
const util = require('util')

var internals = {};

module.exports = internals;

/**
 * Our custom error (status, message)
 */
//function ApiError 


internals.ApiError = function (status, message) {
  Error.captureStackTrace(this, this.constructor);
  this.status = this.constructor.status;
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

/**
 * Recursively checks whether a (user-supplied) Mongo query object contains
 * a `$where` clause (or any operator that would let arbitrary JavaScript be
 * executed server-side, e.g. `$where`/`$function`).
 *
 * Query params such as `?q={"nlikes":{"$lt":15}}` are intentionally
 * forwarded as raw MongoDB filters, but `$where` lets an attacker run
 * arbitrary JS in the database process (NoSQL injection / RCE), so it must
 * always be rejected before the query reaches the driver.
 */
internals.hasDangerousMongoOperator = function (value) {
  if (Array.isArray(value)) {
    return value.some(internals.hasDangerousMongoOperator);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value).some(function (key) {
      if (key === '$where' || key === '$function' || key === '$accumulator') {
        return true;
      }
      return internals.hasDangerousMongoOperator(value[key]);
    });
  }

  return false;
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
