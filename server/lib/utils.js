
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
 * Parse the `q` query-string parameter of the /list endpoints.
 *
 * Returns `{ query }` with the Mongo filter to run, or `{ error }` when the
 * caller's filter must be refused. Missing `q` lists everything, and a `q`
 * that is not valid JSON lists nothing - both as before.
 *
 * What is new is the type check. JSON.parse() happily returns a number, a
 * string, a boolean or an array, and the driver's find() quietly drops a
 * selector that is not an object and runs `{}` instead - so `?q=5` or
 * `?q="x"` used to answer with every document in the collection, the exact
 * opposite of a filter. Only a plain object is a filter.
 */
internals.parseListQuery = function (q) {

  if (!q) {
    return { query: {} };
  }

  var query;
  try {
    query = JSON.parse(q);
  }
  catch (e) {
    return { query: { _id: null } };
  }

  if (query === null || typeof query !== 'object' || Array.isArray(query)) {
    return { error: 'Bad parameters: q must be a JSON object' };
  }

  if (internals.containsCodeOperator(query)) {
    return { error: 'Bad parameters' };
  }

  return { query: query };
};

/**
 * A Mongo connection string with its password masked, for logging.
 *
 * The README starts the server with
 * `DEBUG=* MONGODB_URL="mongodb://<user>:<password>@..."`, and the URL was
 * logged verbatim at startup - credentials included - to wherever the debug
 * output goes.
 */
internals.redactMongoUrl = function (url) {
  return String(url).replace(/^([a-z0-9+.-]+:\/\/)([^@/]*)@/i, function (match, scheme, userinfo) {
    var colon = userinfo.indexOf(':');
    return scheme + (colon === -1 ? userinfo : userinfo.slice(0, colon) + ':***') + '@';
  });
};
