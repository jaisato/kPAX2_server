
const util = require('util')

var internals = {};

module.exports = internals;

/**
 * Our custom error (status, message)
 */
//function ApiError 


internals.ApiError = function (status, message) {
  Error.captureStackTrace(this, this.constructor);
  // `this.constructor.status` reads a property off the constructor function,
  // which nothing sets - so every ApiError carried status undefined and the
  // error handlers fell back to 500 whatever the caller asked for.
  this.status = status;
  this.message = message;
};

util.inherits(internals.ApiError, Error);


/**
 * check all parameters are not undefined or null
 */
internals.checkParams = function (req, params) {

  // GET or post
  const body = req.body || req.body;

  var ret = true;
  (params || []).forEach(function (doc) {
    if (typeof body[doc] === 'undefined' || body[doc] == null) {
      ret = false;
    }
  });

  return ret;
};

// Aux Function
// TODO: parse query string
internals.isJsonString = function (str) {

  // For testing if str is a well formed JSON chain
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }

  return true;
};

/**
 * Operators that make Mongo evaluate JavaScript rather than match fields.
 *
 * $where and $function take an expression the server runs; on a deployment
 * where they are enabled that is code execution inside the database process.
 * Endpoints that let a caller supply a raw query need to refuse them - plain
 * field matching, which is all those endpoints are documented to do, never
 * needs any of these.
 */
var CODE_OPERATORS = ['$where', '$function', '$accumulator', '$expr'];

/**
 * Whether a parsed query object contains a code-executing operator anywhere,
 * however deeply nested - `{"$or": [{"$where": "..."}]}` hides it one level
 * down, so a check on the top-level keys alone would miss it.
 */
internals.containsCodeOperator = function (value) {

  if (Array.isArray(value)) {
    return value.some(internals.containsCodeOperator);
  }

  if (value === null || typeof value !== 'object') {
    return false;
  }

  return Object.keys(value).some(function (key) {
    if (CODE_OPERATORS.indexOf(key) !== -1) {
      return true;
    }

    return internals.containsCodeOperator(value[key]);
  });
};
