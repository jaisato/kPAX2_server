var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('test', { title: 'Express in Action' });
});

/* GET another page. */
router.get('/another', function(req, res, next) {
  res.render('test2', { title: 'Another Page in Action', author: ' WebMaster KpaxServer2' });
});

/* GET another page with params. */
router.get('/another/:Autname', function(req, res, next) {
  // Sanitize user input to prevent XSS - strip HTML tags
  var auth = req.params.Autname.replace(/<[^>]*>/g, '');
  res.render('test2', { title: 'Another Page  With params in Action', author: auth });
});

module.exports = router;
