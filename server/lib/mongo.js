
/**
 *
 * MongoDB common queries in express.
 *
 * Manages response
 *
 */

var debug = require('debug')('app:lib:mongo');
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
//        const error = internals.sendError(500, 'Error when db.findOne', res, err);
         error = internals.sendError(500, 'Error when db.findOne', res, err);
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
 * findOne
 */
internals.list = function(req, res, collection, cb) {

  debug ('list', id);

  // find game
  req.db.collection(collection).findOne (
    { guid: id },
    function (err, doc) {
      // if error, return 500
      if (err) return res.status(500).send('Error when db.findOne ' + err.message);

      // Game not found
      if (!doc) return res.status(404).send('Not found');

      debug(doc);
      return res.jsonp(doc);
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

  return ApiError (status, message);
};
