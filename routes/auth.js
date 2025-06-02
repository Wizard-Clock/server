const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const crypto = require('crypto');
const db = require('../db');

/* Configure password authentication strategy.
 *
 * The `LocalStrategy` authenticates users by verifying a username and password.
 * The strategy parses the username and password from the request and calls the
 * `verify` function.
 *
 * The `verify` function queries the database for the user record and verifies
 * the password by hashing the password supplied by the user and comparing it to
 * the hashed password stored in the database.  If the comparison succeeds, the
 * user is authenticated; otherwise, not.
 */
passport.use(new LocalStrategy(function verify(username, password, callback) {
    db.get('SELECT * FROM users WHERE username = ?', [ username ], function(err, user) {
        if (err) { return callback(err); }
        if (!user) { return callback(null, false, { message: 'Incorrect username or password.' }); }

        crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
            if (err) { return callback(err); }
            if (!crypto.timingSafeEqual(user.hashed_password, hashedPassword)) {
                return callback(null, false, { message: 'Incorrect username or password.' });
            }
            return callback(null, user);
        });
    });
}));

/* Configure session management.
 *
 * When a login session is established, information about the user will be
 * stored in the session.  This information is supplied by the `serializeUser`
 * function, which is yielding the user ID and username.
 *
 * As the user interacts with the app, subsequent requests will be authenticated
 * by verifying the session.  The same user information that was serialized at
 * session establishment will be restored when the session is authenticated by
 * the `deserializeUser` function.
 *
 * Since every request to the app needs the user ID and username, in order to
 * fetch todo records and render the user element in the navigation bar, that
 * information is stored in the session.
 */
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
        cb(null, { id: user.id, username: user.username });
    });
});

passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, user);
    });
});

var router = express.Router();


/* Login home page. */
router.get('/', function(req, res) {
    res.redirect("login");
})

router.get('/login', function(req, res, next) {
    res.render('login', { title: 'Login' });
});

router.post('/login', passport.authenticate('local', {
    successReturnToOrRedirect: '/dashboard',
    failureRedirect: '/auth/login',
    failureMessage: true
}));

module.exports = router;
