const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const sqlite = require('sqlite3');
const db = new sqlite.Database(":memory:"); //remembrall.db
db.serialize(() => {
  db.run("BEGIN TRANSACTION");
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, password TEXT)");
  db.run(`INSERT INTO users (name, email, password) VALUES ("admin", "admin@admin.admin", "admin")`)
  db.run("COMMIT");
});

const app = express();
const port = 3000;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', require('./routes/index'));
app.use('/login', require('./routes/login'));
app.use('/users', require('./routes/users'));

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

const passport = require('passport');
const LocalStrategy = require('passport-local');
const crypto = require('crypto');
passport.use(new LocalStrategy(function verify(username, password, doneCallback) {
  db.get(`SELECT * FROM users WHERE username = ?`, [ username ], function(err, user) {
    if (err) { 
      return doneCallback(err);
    }
    if (!user) {
      return doneCallback(null, false, { message: 'Incorrect username or password.' });
    }

    crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
      if (err) {
        return doneCallback(err);
      }
      if (!crypto.timingSafeEqual(user.hashed_password, hashedPassword)) {
        return doneCallback(null, false, { message: 'Incorrect username or password.' });
      }
      return doneCallback(null, user);
    });
  });
}));


module.exports = app;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
