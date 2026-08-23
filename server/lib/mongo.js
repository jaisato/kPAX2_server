
/**
 *
 * MongoDB common queries in express.
 *
 * Manages response
 *
 */

var debug = require('debug')('app:lib:mongo');
// `require('util').Error` does not exist, so ApiError was undefined and
// sendError() - which every failure path here goes through - threw
// "ApiError is not a function" straight after writing the response. The real
// one lives in ./utils.
var ApiError = require('./utils').ApiError;

var internals = {};

module.exports = internals;


/**
 * findOne
 */
internals.get = function(req, res, collection, id, cb) {

  debug ('.get', id);
  debug ('QUERY', 'req.db.collection(' + collection + ').findOne ({ guid: ' + id + '})');

  // find game
  req.db.collection(collection).findOne (
    { guid: id },
    function (err, doc) {
      // if error, return 500
      if (err) {
        const error = internals.sendError(500, 'Error when db.findOne', res, err);
        debug ('.get error', error);
        return cb(error);
      }

      // Game not found
      if (!doc) {
        const error = internals.sendError(404, 'Not found', res);
        debug ('.get error', error);
        return cb(error);
      }

      debug ('.get response', doc);
      cb(undefined, doc);
    }
  );
};

/**
 * find, returning every document in the collection.
 *
 * This was a copy of get() that had never been adjusted: it referenced an `id`
 * that is not a parameter of this function - a ReferenceError on the first
 * line - then ran findOne() and answered the response itself instead of calling
 * the callback the signature promises. It now does what its name says, and
 * reports through cb like get() does.
 */
internals.list = function(req, res, collection, cb) {

  debug ('.list', collection);

  req.db.collection(collection).find({}).toArray(
    function (err, docs) {
      // if error, return 500
      if (err) {
        const error = internals.sendError(500, 'Error when db.find', res, err);
        debug ('.list error', error);
        return cb(error);
      }

      debug ('.list response', docs.length);
      cb(undefined, docs);
    }
  );
};


/**
 * send error if res specified
 */
internals.sendError = function(status, message, res, err) {
  if (err) {
    message += ' ' + err.message;
  }

  res.status(status).send(message);

  return new ApiError(status, message);
};
