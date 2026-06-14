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
debug('Connecting to Mongodb', url);
MongoClient.connect(url, function (err, db) {
  if (err) {
    debug('ERROR', err);
    throw err;
  }

  // async!
  database = db;
  debug('Successfully connected to the database');
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

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
app.use(function (req, res, next) {
  req.db = database;
  next();
});

// CORS Enabled
// WARNING: In production, replace '*' with specific allowed origins
var allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'];
app.use(function (req, res, next) {
  var origin = req.headers.origin;
  if (allowedOrigins.indexOf('*') !== -1 || allowedOrigins.indexOf(origin) !== -1) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
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
