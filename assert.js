// Copyright (c) 2012, Mark Cavage. All rights reserved.

var assert = require('assert');
var Stream = require('stream').Stream;
var util = require('util');



///--- Globals

var NDEBUG = process.env.NODE_NDEBUG || false;
/* JSSTYLED */
var UUID_REGEXP = /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/;



///--- Messages

var ARRAY_TYPE_REQUIRED = '%s ([%s]) required';
var TYPE_REQUIRED = '%s (%s) is required';



///--- Internal

function normalize(s) {
	switch (s) {
		case 'func': s = 'function'; break;
		case 'bool': s = 'boolean'; break;
	}
	return s;
}

function denormalize(s) {
	switch (s) {
		case 'function': s = 'func'; break;
		case 'boolean': s = 'bool'; break;
	}
	return s;
}

function capitalize(str) {
        return (str.charAt(0).toUpperCase() + str.slice(1));
}

function uncapitalize(str) {
        return (str.charAt(0).toLowerCase() + str.slice(1));
}

function _() {
        return (util.format.apply(util, arguments));
}


function _assert(arg, type, name, stackFunc) {
	name = name || type;
	stackFunc = stackFunc || _assert.caller;
	var t = typeof (arg);

	if (t !== type) {
		throw new assert.AssertionError({
			message: _(TYPE_REQUIRED, name, type),
			actual: t,
			expected: type,
			operator: '===',
			stackStartFunction: stackFunc
		});
	}
}


function _instanceof(arg, type, name, stackFunc) {
	name = name || type;
	stackFunc = stackFunc || _instanceof.caller;

	if (!(arg instanceof type)) {
		throw new assert.AssertionError({
			message: _(TYPE_REQUIRED, name, type.name),
			actual: _getClass(arg),
			expected: type.name,
			operator: 'instanceof',
			stackStartFunction: stackFunc
		});
	}
}

function _getClass(object) {
        return (Object.prototype.toString.call(object).slice(8, -1));
}



///--- API

function array(arr, type, name) {
	name = name || type;

	if (!Array.isArray(arr)) {
		throw new assert.AssertionError({
			message: _(ARRAY_TYPE_REQUIRED, name, type),
			actual: typeof (arr),
			expected: 'array',
			operator: 'Array.isArray',
			stackStartFunction: array.caller
		});
	}

	for (var i = 0; i < arr.length; i++) {
		module.exports[denormalize(type)](arr[i], name);
	}
}


function bool(arg, name) {
        _assert(arg, 'boolean', name, bool);
}


function buffer(arg, name) {
        if (!Buffer.isBuffer(arg)) {
                throw new assert.AssertionError({
                        message: _(TYPE_REQUIRED, name || '', 'Buffer'),
                        actual: typeof (arg),
                        expected: 'buffer',
                        operator: 'Buffer.isBuffer',
                        stackStartFunction: buffer
                });
        }
}


function func(arg, name) {
        _assert(arg, 'function', name);
}


function number(arg, name) {
        _assert(arg, 'number', name);
        if ((isNaN(arg) || !isFinite(arg))) {
                throw new assert.AssertionError({
                        message: _(TYPE_REQUIRED, name, 'number'),
                        actual: arg,
                        expected: 'number',
                        operator: 'isNaN',
                        stackStartFunction: number
                });
        }
}


function object(arg, name) {
        _assert(arg, 'object', name);
}


function stream(arg, name) {
        _instanceof(arg, Stream, name);
}


function date(arg, name) {
        _instanceof(arg, Date, name);
}

function regexp(arg, name) {
        _instanceof(arg, RegExp, name);
}


function string(arg, name) {
        _assert(arg, 'string', name);
}


function uuid(arg, name) {
        string(arg, name);
        if (!UUID_REGEXP.test(arg)) {
                throw new assert.AssertionError({
                        message: _(TYPE_REQUIRED, name, 'uuid'),
                        actual: 'string',
                        expected: 'uuid',
                        operator: 'test',
                        stackStartFunction: uuid
                });
        }
}


///--- Exports

var funcs = {
        bool: bool,
        buffer: buffer,
        date: date,
        func: func,
        number: number,
        object: object,
        regexp: regexp,
        stream: stream,
        string: string,
        uuid: uuid
};

module.exports = function () {
	if (NDEBUG)
		return;
	assert.ok.apply(assert, arguments);
};

// add arrayOf* methods
Object.keys(funcs).forEach(function (k) {
	module.exports[k] = function () {
		if (NDEBUG)
			return;
		funcs[k].apply(null, arguments);
	};

        var name = 'arrayOf' + capitalize(k);

        module.exports[name] = function (arg, name) {
		if (NDEBUG)
			return;
                array(arg, normalize(k), name);
        };
});

// add optional* methods
Object.keys(module.exports).forEach(function (k) {
        var _name = 'optional' + capitalize(k);
        var s = normalize(uncapitalize(k.replace('arrayOf', '')));

	if (k.indexOf('arrayOf') !== -1) {
		module.exports[_name] = function (arg, name) {
			if (!NDEBUG && arg !== undefined) {
				array(arg, s, name);
			}
		};
	} else {
		module.exports[_name] = function (arg, name) {
			if (!NDEBUG && arg !== undefined) {
				module.exports[k](arg, name);
			}
		};
	}
});


// Reexport built-in assertions
Object.keys(assert).forEach(function (k) {
        if (k === 'AssertionError') {
                module.exports[k] = assert[k];
                return;
        }

        module.exports[k] = function () {
                if (NDEBUG)
			return;
		assert[k].apply(assert[k], arguments);
        };
});
