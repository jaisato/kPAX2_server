var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

const debug = require('debug')('app');

// client for mongodb database
const MongoClient = require('mongodb').MongoClient;

var routes = require('./routes/index');

var app = express();

// connect to databse
var database = null;

var url = 'mongodb://localhost:27017/kpax2';  // For working on local DB
if (process.env.MONGODB_URL) {
  url = process.env.MONGODB_URL;
}

// connect to mongodb
//
// Driver 2.x is pinned to bson <= 1.1.3 and mongodb-core <= 3.1.1, which carry
// the critical BSON deserialization-of-untrusted-data advisories; 3.7.4 clears
// them and keeps the callback API every route here is written against.
//
// The one behaviour change that matters: in 2.x this callback received the
// database, in 3.x it receives the *client*, and the database comes from
// client.db(). Assigning the client straight to `database` would have left
// every route calling database.collection() on an object that has no such
// method. The database name stays in the connection string, so db() takes no
// argument.
debug('Connecting to Mongodb', url);
MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, client) {
  if (err) {
    debug('ERROR', err);
    throw err;
  }

  // async!
  database = client.db();
  debug('Successfully connected to the database');
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
// Pug, not Jade. The jade package was last released in 2016 and is
// where most of this project's npm advisories came from: it pulls in
// transformers, which pulls in a vulnerable uglify-js. Pug is the same
// template language under its current name, so the views only changed
// extension.
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

// app.use(function (req, res, next) {
//   debug('RRR', req);
//   next();
// });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// first thing to do, add db to the request
//
// The connection above is asynchronous while the server starts listening
// immediately, so there is a window at boot where `database` is still null.
// Requests arriving in it used to reach the routes anyway and blow up on
// req.db.collection() with a TypeError, which the error handler then reported
// as a generic 500 - indistinguishable from a real server fault. 503 is what
// "not ready yet, try again" actually means, and it keeps the routes free of
// null checks.
app.use(function (req, res, next) {
  if (!database) {
    debug('Request received before the database connection was ready');
    return res.status(503).send('Service Unavailable: database connection not ready');
  }

  req.db = database;
  next();
});

// CORS Enabled
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// debug
app.use(function (req, res, next) {
  debug('HEADERS', req.headers);
  debug('BODY', req.body);
  next();
});

// add routes. this will load the index.js
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {

  debug('NOT FOUND');

  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {

    debug('ERR', err);

    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {

  debug('ERR', err);

  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
