var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectId;

const utils = require('../lib/utils');

const debug = require('debug')('app:user');

/**
 * Add a new user
 */
router.post('/', function (req, res) {

  // check parameters
  //DEL if (!req.body.login || !req.body.name) {
  if (!utils.checkParams(req, ['login', 'name'])) {
    return res.status(400).send('Bad parameters');
  }

  // find user
  req.db.collection('users').findOne(
    { login: req.body.login },
    function (err, doc) {
      // if error, return 500
      if (err) return res.status(500).send('Error when db.findOne ' + err.message);

      // User already exists
      if (doc) return res.status(409).send('Already exists');

      // crete new user - only wanted fields
      var now = new Date();
      var user = {
        login: req.body.login,
        name: req.body.name,
        created_at: now,
        updated_at: now,
        status: 1
      };

      // create user
      req.db.collection('users').insert(
        user,
        function (err, doc) {
          // if error, return 500
          if (err) return res.status(500).send('Error when db.insert ' + err.message);

          debug(user);
          res.jsonp(user);
        }
      );
    }
  );
});

/**
 * list users under a FREE condition
 * if no parameter passed, all users ar listed
 * the 'q' query must be a valid JSON query condition in MongoBD format
 * endpoint method: GET
 * example : /users/list?q={"status":3}
 */
router.get('/list', function (req, res) {

  debug('/game/list. Query Chain passed:', req.query.q);

  // read user query. All users by default
  var userQuery = {};
  if (req.query.q) {

    try {
      userQuery = JSON.parse(req.query.q);
    }
    catch (e) {
      debug(' Bad JSON format, NO Query Done!: NO records listed');
      userQuery = { _id: null };
    }

    // The whole point of this endpoint is that the caller writes the filter, so
    // it is a Mongo query straight from the query string by design. What it must
    // not be is a way to run code: $where and $function hand the server a
    // JavaScript expression to evaluate, which on a server with them enabled is
    // remote execution inside the database process, not a filter. They are also
    // the one part of the query language that nothing here needs - every
    // documented use ({"status":3} and the like) is plain field matching.
    if (utils.containsCodeOperator(userQuery)) {
      return res.status(400).send('Bad parameters');
    }
  };

  debug('JSON Query passed: ', userQuery);

  // find users
  req.db.collection('users').find(
    userQuery,
    function (err, cursor) {
      // if error, return 500
      if (err) return res.status(500).send('Error when db.find ' + err.message);

      // walk the cursor
      var users = [];
      cursor.each(function (err, doc) {

        if (doc == null) {
          debug(users);
          return res.jsonp(users);
        }

        users.push(doc);
      });
    }
  );
});

// DELETE
// /**
//  * list users (all users in the system, whatever is them status )
//  * URL example:  METHOD: GET
//  * http://localhost:3000/user/lista
//  */
// router.get('/listall', function (req, res, next) {
//   // find user
//   req.db.collection('users').find(
//     {},
//     function (err, cursor) {
//
//       // check error
//       if (err) {
//         return res.status(500).send(err.message);
//       }
//
//       var users = [];
//
//       // walk cursor
//       cursor.each(function (err, doc) {
//
//         // end
//         if (doc == null) {
//           return res.jsonp(users);
//         }
//
//         users.push(doc);
//       });
//     }
//   );
// });

/**
 * list ONE user (by Id of the user)
 * parameter: user
 * GET /user/:user
 *
 * Example: http://localhost:3000/user/57546d42ff435e591d083d04
 */
router.get('/:id', function (req, res, next) {
  var userId = req.params.id;

  // find user
  req.db.collection('users').findOne(
    { _id: new ObjectId(userId) },
    function (err, doc) {
      // if error, return 500
      if (err) return res.status(500).send('Error when users.findOne ' + err.message);

      // User not found
      if (!doc) return res.status(404).send('Not found');

      debug(doc);
      res.jsonp(doc);
    }
  );
});

/**
 *
 * Set a USER unavailable (status : '3' => deleted)
 * POST   /user/del
 * parameter:  user  (game id)
 *
 */
router.delete('/:id', function (req, res) {
  var userId = req.params.id;

  // new ObjectId() throws on anything that is not a 24-character hex string, so
  // a mistyped id used to come back as a 500 instead of a 400.
  if (!ObjectId.isValid(userId)) {
    return res.status(400).send('Bad parameters');
  }

  // This endpoint never worked. Three separate faults, all in the few lines
  // this replaces:
  //
  // 1. The not-found test was inverted - `if (doc) return 404` - so every user
  //    that actually existed was reported as missing and nothing was ever
  //    soft-deleted. Compare GET /:id directly above, which has it the right
  //    way round.
  // 2. Being inverted, the update only ran for ids that matched nothing, and it
  //    was called as update(selector, doc, upsert, multi, cb) - the driver 1.x
  //    positional form. Driver 2.x reads that third argument as `options` and
  //    the fourth as `callback`, so `upsert: true` was passed as the whole
  //    options object and the real callback never arrived. The one path that
  //    could run was an upsert for a user that did not exist, which is a write
  //    that invents a record rather than deleting one.
  // 3. The response echoed the update result, not the user.
  //
  // findOneAndUpdate does the read and the write as one atomic operation, so
  // there is also no longer a window between "does this user exist" and
  // "mark it deleted".
  req.db.collection('users').findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $set: { status: 3, updated_at: new Date() } },
    { returnOriginal: false },
    function (err, result) {
      // if error, return 500
      if (err) return res.status(500).send('Error when users.findOneAndUpdate ' + err.message);

      // User not found
      if (!result || !result.value) return res.status(404).send('Not found');

      debug(result.value);
      res.jsonp(result.value);
    }
  );
});

module.exports = router;
