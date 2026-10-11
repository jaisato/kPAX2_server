
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
 * All three take an expression the server runs - $where a predicate, $function
 * and $accumulator a function body - so on a deployment where they are enabled
 * that is code execution inside the database process. Endpoints that let a
 * caller supply a raw query need to refuse them.
 *
 * $expr is deliberately NOT here. It evaluates ordinary aggregation
 * expressions and runs no JavaScript of its own, so blocking it only removed
 * legitimate queries this endpoint is documented to accept - comparing two
 * fields, say, as in {"$expr": {"$gt": ["$spent", "$budget"]}}. The one way it
 * could carry code is by nesting one of the three above, and the traversal
 * below already catches those at any depth.
 */
var CODE_OPERATORS = ['$where', '$function', '$accumulator'];

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

/**
 * Whether a parsed JSON value carries a `_bsontype` key anywhere.
 *
 * The bson 1.x serializer the mongodb 3.x driver uses decides how to encode an
 * object by reading its `_bsontype` property - it does not check that the
 * object really is one of its classes. JSON.parse and body-parser build plain
 * objects, so a client sending {"owner": {"_bsontype": "Code", "code": "..."}}
 * had the server write a BSON JavaScript-code value into the game document,
 * and the same trick produces MinKey/MaxKey, DBRef, Symbol or Binary values
 * that no field here is meant to hold. An unknown `_bsontype` makes the
 * serializer throw instead, turning the request into a 500. No legitimate
 * request needs the key, so it is refused wherever client JSON reaches Mongo.
 */
internals.containsBsonTypeKey = function (value) {

  if (Array.isArray(value)) {
    return value.some(internals.containsBsonTypeKey);
  }

  if (value === null || typeof value !== 'object') {
    return false;
  }

  return Object.keys(value).some(function (key) {
    return key === '_bsontype' || internals.containsBsonTypeKey(value[key]);
  });
};

/**
 * Whether a value parsed from the `q` query-string parameter can be handed to
 * find() as a filter.
 *
 * It has to be a plain JSON object: an array or a scalar ("q=5") is not a
 * filter, and the server rejected it - surfacing as a 500 for what is a client
 * mistake. Beyond that it must not run code (containsCodeOperator) or forge
 * BSON types (containsBsonTypeKey).
 */
internals.isAcceptableQuery = function (query) {
  if (query === null || typeof query !== 'object' || Array.isArray(query)) {
    return false;
  }

  return !internals.containsCodeOperator(query) && !internals.containsBsonTypeKey(query);
};
