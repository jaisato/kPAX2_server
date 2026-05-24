var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectId;

const utils = require('../lib/utils');

const debug = require('debug')('app:user');

/**
 * Sanitize a user-supplied query object by stripping any keys that
 * start with '$' (MongoDB operators like $where, $gt, $regex, etc.)
 * This prevents NoSQL injection attacks.
 */
function sanitizeQuery(query) {
  if (typeof query !== 'object' || query === null) {
    return {};
  }

  var clean = {};
  var allowedFields = ['login', 'name', 'status', 'created_at', 'updated_at'];

  Object.keys(query).forEach(function (key) {
    // Reject any key starting with '$' (MongoDB operator)
    if (key.charAt(0) === '$') {
      debug('sanitizeQuery: stripped dangerous key:', key);
      return;
    }

    // Only allow whitelisted fields
    if (allowedFields.indexOf(key) === -1) {
      debug('sanitizeQuery: stripped non-whitelisted key:', key);
      return;
    }

    var value = query[key];

    // If the value is an object, strip any '$' operator keys inside it
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      var cleanValue = {};
      var hasValidKeys = false;
      Object.keys(value).forEach(function (subKey) {
        if (subKey.charAt(0) === '$') {
          debug('sanitizeQuery: stripped dangerous operator:', subKey);
          return;
        }
        cleanValue[subKey] = value[subKey];
        hasValidKeys = true;
      });
      if (hasValidKeys) {
        clean[key] = cleanValue;
      }
      return;
    }

    clean[key] = value;
  });

  return clean;
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
 * list users under a FREE condition
 * if no parameter passed, all users ar listed
 * the 'q' query must be a valid JSON query condition in MongoBD format
 * endpoint method: GET
 * example : /users/list?q={"status":3}
 */
router.get('/list', function (req, res) {

  debug('/user/list. Query Chain passed:', req.query.q);

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
  };

  // Sanitize query to prevent NoSQL injection
  userQuery = sanitizeQuery(userQuery);

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
