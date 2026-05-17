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
 * list users under a filtered condition
 * Supports query parameters: login, name, status
 * endpoint method: GET
 * example: /user/list?status=1&name=john
 */
router.get('/list', function (req, res) {

  // SECURITY FIX: Replaced raw JSON.parse(req.query.q) which allowed arbitrary MongoDB
  // queries (NoSQL injection). Now uses a whitelist of specific allowed filter parameters.
  var userQuery = {};

  if (req.query.login) {
    userQuery.login = String(req.query.login);
  }
  if (req.query.name) {
    userQuery.name = String(req.query.name);
  }
  if (req.query.status) {
    var status = parseInt(req.query.status, 10);
    if (!isNaN(status)) {
      userQuery.status = status;
    }
  }

  debug('User query: ', userQuery);

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

  // find game
  req.db.collection('users').findOne(
    { _id: new ObjectId(userId) },
    function (err, doc) {

      // if error, return 500
      if (err) return res.status(500).send('Error when users.findOne ' + err.message);

      // BUG FIX: Logic was inverted -- returned 404 when user WAS found
      if (!doc) return res.status(404).send('Not found');

      // game found -- UPdate status: set to 3 => Deleted
      req.db.collection('users').update(
        { _id: new ObjectId(userId) },
        { $set: { status: 3 } },
        true,
        true,
        function (err, doc) {
          // if error, return 500
          if (err) return res.status(500).send('Error when users.update ' + err.message);

          debug(doc);
          res.jsonp(doc);
        }
      );
    }
  ); // find one
});

module.exports = router;
