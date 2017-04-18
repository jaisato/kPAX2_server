var express = require('express');
var router = express.Router();

// ADD ROUTES
router.use('/test', require('./test'));

router.use('/user', require('./user'));

router.use('/game', require('./games'));

router.use('/userprofile', require('./userprofile'));

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
