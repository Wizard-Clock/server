require('dotenv').config()
const express = require('express');
const path = require('path');
const createError = require('http-errors');
const logger = require('morgan');
require('./src/controllers/authController');

const app = express();

// Parser
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const cors=require("cors");
const corsOptions ={
  origin:'*',
  credentials:true,            //access-control-allow-credentials:true
  optionSuccessStatus:200,
}
app.use(cors(corsOptions))

// view engine setup
app.set('views', path.join(__dirname, '/src/views'));
app.set('view engine', 'pug');

app.use('/', require('./src/routes/auth'));
app.use('/wizards', require('./src/routes/smt/wizards'));
app.use('/locations', require('./src/routes/smt/locations'));
app.use('/clock', require('./src/routes/smt/clock'));
app.use('/serverSettings', require('./src/routes/smt/serverSettings'));
app.use('/api', require('./src/routes/api/api'));
app.use('/api/watchFace', require('./src/routes/api/pocketWatchFace'));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/public", express.static(path.join(__dirname, 'public')));

// Set favicon
app.use('/favicon.ico', express.static('public/images/favicon.svg'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

app.listen(process.env.PORT, () => {
  console.log(`Server startup occurred at: ${new Date().toUTCString()}`);
  console.log(`Listening on port ${process.env.PORT}`);
  require("./src/controllers/serverSettingController").default.getInstance();
  setTimeout(() => {require("./src/controllers/discordController").notifyServerStartup()}, 5000)
});
