
/**
 *
 * MongoDB common queries in express.
 *
 * Manages response
 *
 */

var debug = require('debug')('app:lib:mongo');

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
 * find (list) documents in a collection
 */
internals.list = function(req, res, collection, query, cb) {

  debug ('list', collection, query);

  // find documents
  req.db.collection(collection).find (
    query,
    function (err, cursor) {
      // if error, return 500
      if (err) {
        const error = internals.sendError(500, 'Error when db.find', res, err);
        debug ('.list error', error);
        return cb(error);
      }

      var results = [];
      cursor.each(function (err, doc) {
        if (doc == null) {
          debug('.list results', results);
          return cb(undefined, results);
        }
        results.push(doc);
      });
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

  return new Error(status + ': ' + message);
};
