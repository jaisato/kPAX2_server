var express = require('express');
var router = express.Router();

//DEL var ObjectId = require('mongodb').ObjectId;

const utils = require('../lib/utils');
const mongo = require('../lib/mongo');

const debug = require('debug')('app:category');

/**
 * List categories under a FREE condition
 * if no parameter passed, all games ar listed
 * the 'q' query must be a valid JSON query condition in MongoBD format
 * endpoint method: GET
 * example : /category/list?q={"nlikes":{"$lt":15}}
 */
router.get('/list', function (req, res, next) {
  debug('GET /category/list');

  debug('category/list endpoint! Query Chain passed:', req.query.q);

  var gameQuery = {};
  if (req.query.q) {
    debug('Query condition:q=', req.query.q);

    try {
      gameQuery = JSON.parse(req.query.q);
    }
    catch (e) {
      debug(' Bad JSON format, NO Query Done!: NO records listed');
      gameQuery = { _id: null };
    }
  };

  debug('JSON Query passed: ', gameQuery);

  // find game
  req.db.collection('gameCategories').find(
    gameQuery,
    function (err, cursor) {
      // if error, return 500
      if (err) return res.status(500).send('Error when db.find ' + err.message);

      // walk cursor
      var games = [];
      cursor.each(function (err, doc) {
        if (doc == null) {
          debug(games);
          return res.jsonp(games);
        }

        games.push(doc);
      });
    }
  );
});


/**
 *
 */
function sendError (error, message, res) {
  debug(error, '-', message);
  res.status(400).send('Bad parameters');
}

module.exports = router;
  
