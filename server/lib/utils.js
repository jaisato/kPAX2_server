
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

  // GET or POST
  const body = req.body || req.query;

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
