var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectId;

const debug = require('debug')('app:user');

/**
 * Add a new user
 */
router.post('/', function (req, res) {

  // check parameters
  if (!req.body.login || !req.body.name) {
    // 400 - bad request
    debug('LOGIN: %s', req.body.login);
    debug('NAME: %s', req.body.name);
    return res.status(400).send('Bad parameters');
  }

  // find user
  req.db.collection('users').findOne(
    { login: req.body.login },
    function (err, doc) {

      // if error, return
      if (err) {
        // 500
        return res.status(500).send(err.message);
      }

      if (doc) {
        // 400 - conflict
        return res.status(409).send('User already exists');
      }

      var now = new Date();

      // crete new user - only wanted fields
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
          // if error, return
          if (err) {
            // 500
            return res.status(500).send(err.message);
          }

          res.jsonp(user);
        }
      );
    }
  ); // find one
});

/**
 * list users under a FREE condition
 * if no parameter passed, all users ar listed
 * the 'q' query must be a valid JSON query condition in MongoBD format
 * endpoint method: GET
 * example : /users/list?q={"status":3}
 */

router.get('/list', function (req, res, next) {

  debug('/game/list. Query Chain passed: %s', req.query.q);

  var userQuery = null;
  if (typeof (req.query.q) != 'undefined') {
    debug('Query condition:q=  %s ', req.query.q);

    try {
      userQuery = JSON.parse(req.query.q);
    }
    catch (e) {
      debug(' Bad JSON format, NO Query Done!: NO records listed');
      userQuery = { _id: 0 };
    }
  } else {
    debug(' q Query condition not defined: all records listed');
    userQuery = {};
  };

  debug('JSON Query passed: ', userQuery);

  // find user
  req.db.collection('users').find(
    userQuery,
    function (err, cursor) {

      // check error
      if (err) {
        return res.status(500).send(err.message);
      }

      var users = [];

      // walk cursor
      cursor.each(function (err, doc) {

        // end
        if (doc == null) {
          return res.jsonp(users);
        }

        users.push(doc);
      });
    }
  );
});

/**
 * list users (all users in the system, whatever is them status )
 * URL example:  METHOD: GET
 * http://localhost:3000/user/lista
 */
router.get('/listall', function (req, res, next) {
  // find user
  req.db.collection('users').find(
    {},
    function (err, cursor) {

      // check error
      if (err) {
        return res.status(500).send(err.message);
      }

      var users = [];

      // walk cursor
      cursor.each(function (err, doc) {

        // end
        if (doc == null) {
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
router.get('/:user', function (req, res, next) {
  var userId = req.params.user;
  debug(userId);

  // find user
  req.db.collection('users').find(
    { _id: new ObjectId(userId) },

    function (err, cursor) {

      // check error
      if (err) {
        return res.status(500).send(err.message);
      }

      var user = [];

      // walk cursor
      cursor.each(function (err, doc) {

        // end
        if (doc == null) {
          return res.jsonp(user);
        }

        user.push(doc);
      });
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
router.post('/del', function (req, res) {

  // check parameters
  if (!req.body.user) {
    // 400 - bad request
    debug('** No Parameters. user required');
    return res.status(400).send('Bad parameters. user required');

  }

  var userId = req.body.user;

  // find game
  req.db.collection('users').findOne(
    { _id: new ObjectId(userId) },
    function (err, doc) {

      // if error, return
      if (err) {
        // 500
        return res.status(500).send(err.message);
      }

      if (!doc) {
        // Game not Found
        return res.status(404).send('USER ' + req.body.user  + 'NOT exists');
      }

      // game found -- UPdate status: set to 3 => Deleted
      req.db.collection('users').update(
        { _id: new ObjectId(userId) },
        {
          $set: { status: 3 }
        },
        true,
        true,
        function (err, doc) {
          // if error, return
          if (err) {
            // 500
            return res.status(500).send(err.message);
          }

          res.jsonp(doc); // delete ENDs ; sends a response needed to END the Update.  Response with a record updated info
          debug(doc);
        }
      );
    }
  ); // find one
});

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
