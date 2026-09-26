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
// Driver 3.x hands this callback the *client*, not the database - in 2.x it
// was the database itself. The bump from 2.2.36 to 3.1.13 landed without this
// change, so `database` held a MongoClient and every route died on
// req.db.collection() with "req.db.collection is not a function", reported as
// a 500. The database comes from client.db(); its name is in the connection
// string, so db() takes no argument.
//
// The two options pick the parser and topology that 4.x makes the default and
// silence the deprecation warnings 3.x prints at startup without them.
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

// CORS Enabled
//
// This sits ahead of the readiness guard below on purpose. The guard answers
// 503 by short-circuiting, so anything registered after it is skipped for that
// response - and a 503 without Access-Control-Allow-Origin is not a 503 as far
// as a browser is concerned: the fetch rejects as an opaque CORS failure and
// the caller never sees the status, let alone the "try again" it is meant to
// convey. Setting the headers first means every response carries them,
// short-circuited or not.
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

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
