var express = require('express');
var router = express.Router();

//DEL var ObjectId = require('mongodb').ObjectId;

const utils = require('../lib/utils');
const mongo = require('../lib/mongo');

const debug = require('debug')('app:games');

/**
 * Add a new game
 */
router.post('/:id', function (req, res) {
  var id = req.params.id;

  // check parameters
  //DEL if (!req.body.name || !req.body.owner) {
  if (!utils.checkParams(req, ['name', 'owner', 'category'])) {
    return sendError(400, 'Bad parameters', res);
  }

  // find game
  req.db.collection('games').findOne(
    { name: req.body.name },
    function (err, doc) {
      // if error, return 500
      if (err) return sendError(500, 'Error when db.findOne ' + err.message, res);

      // TODO check the user already exists and status == 1

      // the game object
      var game = {
        name: req.body.name,
        description: req.body.description || '',
        category: req.body.category,
        tags: req.body.tags || [],
        owner: req.body.owner,
        updated_at: new Date()
      };

      // values to initialize if insert
      var gameOnInsert = {
        status: 1,
        nlikes: 0,
        created_at: game.updated_at
      };

      // create game
      req.db.collection('games').update(
        { guid: id },
        {
          $set: game,
          $setOnInsert: gameOnInsert
        },
        { upsert: true },
        function (err, doc) {
          // if error, return 500
          if (err) return res.status(500).send('Error when db.insert ' + err.message);

          debug(game);
          res.jsonp(game);
        }
      );  // Insert
    }
  ); // find one
});

/**
 * list games under a FREE condition
 * if no parameter passed, all games ar listed
 * the 'q' query must be a valid JSON query condition in MongoBD format
 * endpoint method: GET
 * example : /games/list?q={"nlikes":{"$lt":15}}
 */
router.get('/list', function (req, res, next) {
  debug('GET /game/list');

  debug('games/list endpoint! Query Chain passed:', req.query.q);

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
  req.db.collection('games').find(
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

//DEL
// /**
//  * list ONE game (by Id of the Game)
//  * parameter: game
//  * GET /game/:game
//  */
// router.get('/:id', function (req, res, next) {
//   var id = req.params.id;
//   debug(id);

//   // find game
//   req.db.collection('games').findOne(
//     { guid: id },
//     function (err, doc) {
//       // if error, return 500
//       if (err) return res.status(500).send('Error when db.findOne ' + err.message);

//       // Game not found
//       if (!doc) return res.status(404).send('Not found');

//       debug(doc);
//       return res.jsonp(doc);
//     }
//   );
// });

/**
 * list ONE game (by Id of the Game)
 * parameter: game
 * GET /game/:game
 */
router.get('/category/:id', function (req, res, next) {

  mongo.get(req, res, 'gameCategories', req.params.id, function (err, doc) {
    if (err) return;

    res.jsonp(doc);
  });
});



/**
 * list ONE game (by Id of the Game)
 * parameter: game
 * GET /game/:game
 */
router.get('/:id', function (req, res, next) {

  mongo.get(req, res, 'games', req.params.id, function (err, doc) {
    if (err) return;

    res.jsonp(doc);
  });
});

/**
 *
 * Set a GAME unavailable (status : '3' => deleted)
 * DELETE   /game/del
 * parameter:  game  (game id)
 *
 */
router.delete('/:id', function (req, res) {
  const id = req.params.id;

  // find game
  req.db.collection('games').findOne(
    { guid: id },
    function (err, doc) {
      // if error, return 500
      if (err) return res.status(500).send('Error when db.findOne ' + err.message);

      // Game not found
      if (!doc) return res.status(404).send('Not Found');

      // game found -- UPdate status: set to 3 => Deleted
      req.db.collection('games').update(
        { guid: id },
        { $set: { status: 3 } },
        true,
        true,
        function (err, doc) {
          // if error, return 500
          if (err) return res.status(500).send('Error when db.update ' + err.message);

          debug(doc);
          res.jsonp(doc);
        }
      );  // update end
    }
  ); // find one
});

// **  like A (very complex nlike marker)

/**
 *  'VERY Complex' ADD like && Plus user / Date info
 *  POST  /game/:game_id/like
 *   Parameters:
        (in the URL) :   game       Game  identifier
         (in the body):   user        user identifier
 *  nlike ++
 *  additional info of user and date of 'like' added
 *  if the like is still market : do nothing
 *   if the like is new  : save user * date/time info + increases by ONe the like counter !
 *
 *  IF user ya tiene un like registrado , no se repite ni se incrementa el marcador de likes
 *  ELSE  se registra el usuario y fecha/hora del registro y se incremeta en uno el contador de likes
 */
router.post('/:game/like', function (req, res) {
  var gameId = req.params.game;
  var userId = req.body.user;

  debug('gameId:', gameId);
  debug('userId:', userId);

  if (!req.params.game || !req.body.user) {
    // 400 - bad request
    debug('** No Parameters. gameId & userId required');
    return res.status(400).send('Bad parameters. gameId & userId required ');
  }

  // find game
  req.db.collection('games').findOne(
    { guid: gameId },

    function (err, doc) {
      // if error, return 500
      if (err) return res.status(500).send('Error when db.findOne ' + err.message);

      // Game not found
      if (!doc) return res.status(404).send('Not found');

      // comprovam si l'usuari té ja aquest like enregistrat
      req.db.collection('games').findOne(
        { guid: gameId, 'ulike.uid': userId },
        function (err, docLike) {
          // if error, return 500
          if (err) return res.status(500).send('Error when db.findOne ' + err.message);

          // Already marked +1
          if (docLike) return res.jsonp(doc);

          req.db.collection('games').update(
            { guid: gameId },
            {
              $inc: { nlikes: +1 },
              $push: { ulike: { uid: userId, date: new Date() } }
            },
            true,
            true,
            function (err, doc) {
              // if error, return 500
              if (err) return res.status(500).send('Error when db.update ' + err.message);

              debug(doc);
              res.jsonp(doc);
            }
          );  // update end
        }
      ); // FindOne  (gameId + userId)
    }
  ); // find one
});

//  like A end

router.post('/:game/unlike', function (req, res) {

  // unmark the LIKE of a game & // decrease the like marker by one
  // check parameters
  //req.params.game

  var gameId = req.params.game;
  var userId = req.body.user;

  debug('gameId:', gameId);
  debug('userId:', userId);

  if (!req.params.game || !req.body.user) {
    // 400 - bad request
    debug('** No Parameters. gameId & userId required');
    return res.status(400).send('Bad parameters. gameId & userId required ');
  }

  // find game
  req.db.collection('games').findOne(
    { guid: gameId },

    function (err, doc) {
      // if error, return 500
      if (err) return res.status(500).send('Error when db.findOne ' + err.message);

      // Game not found
      if (!doc) return res.status(404).send('Not found');

      // game found -- UPdate nlikes -1
      // comprovam si l'usuari té ja aquest like enregistrat
      req.db.collection('games').findOne(
        { guid: gameId, 'ulike.uid': userId },
        function (err, docLike) {
          // if error, return 500
          if (err) return res.status(500).send('Error when db.findOne ' + err.message);

          // If not document, user never marked +1
          if (!docLike) return res.jsonp(doc);

          // var userDateInfo = {'uid': userId, 'date': new Date()};
          req.db.collection('games').update(
            { guid: gameId },
            {
              $inc: { nlikes: -1 },
              $pull: { ulike: { uid: userId } }
            },
            { multi: true }, // TODO: why multi?
            function (err, doc) {
              // if error, return 500
              if (err) return res.status(500).send('Error when db.update ' + err.message);

              debug(doc);
              res.jsonp(doc);
            }
          );
        }
      ); // FindOne  (gameId + userId)
    }
  ); // find one
});

//  UNlike  end



/**
 *
 */
function sendError (error, message, res) {
  debug(error, '-', message);
  res.status(400).send('Bad parameters');
}

module.exports = router;
 
