var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');

var app = express();
app.get('env') === 'production' ? app.disable('x-powered-by') : false;
// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');
app.get('env') !== 'production' ? (app.use(logger('dev'))) : false;
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/index'));
app.use('/github', require('./routes/github'));
app.use('/bangumi', require('./routes/bangumi'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  err.status != 404 ? console.error(err) : console.error(req.originalUrl);
  var errorMessage = { message: err.message };

  res.status(err.status || 500);
  req.app.get('env') !== 'production' ? (errorMessage.stack = err.stack) : false;
  res.json(errorMessage);
});

module.exports = app;
