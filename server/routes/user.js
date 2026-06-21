var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectId;

const utils = require('../lib/utils');

const debug = require('debug')('app:user');

// Allowed query fields for the users collection (whitelist)
const ALLOWED_USER_QUERY_FIELDS = ['login', 'name', 'status', 'created_at', 'updated_at'];

/**
 * Sanitize a user-provided query object to prevent NoSQL injection.
 * Only allows whitelisted field names and rejects any keys starting with '$'.
 */
function sanitizeQuery(rawQuery) {
  if (typeof rawQuery !== 'object' || rawQuery === null || Array.isArray(rawQuery)) {
    return null;
  }

  var sanitized = {};
  var keys = Object.keys(rawQuery);

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];

    // Reject any top-level MongoDB operators (e.g. $where, $regex, $gt, etc.)
    if (key.charAt(0) === '$') {
      return null;
    }

    // Only allow whitelisted fields
    if (ALLOWED_USER_QUERY_FIELDS.indexOf(key) === -1) {
      return null;
    }

    var value = rawQuery[key];

    // If the value is an object, reject any MongoDB operators inside it
    if (typeof value === 'object' && value !== null) {
      var valueKeys = Object.keys(value);
      for (var j = 0; j < valueKeys.length; j++) {
        if (valueKeys[j].charAt(0) === '$') {
          return null;
        }
      }
    }

    sanitized[key] = value;
  }

  return sanitized;
}

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
 * list users under a validated condition
 * if no parameter passed, all users are listed
 * the 'q' query must be a valid JSON query condition using only whitelisted fields
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
      return res.status(400).send('Bad query format');
    }

    // Sanitize the query to prevent NoSQL injection
    userQuery = sanitizeQuery(userQuery);
    if (userQuery === null) {
      debug(' Query rejected: contains disallowed fields or operators');
      return res.status(400).send('Invalid query: only allowed fields are ' + ALLOWED_USER_QUERY_FIELDS.join(', '));
    }
  }

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

      // User not found
      if (doc) return res.status(404).send('Not found');

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
