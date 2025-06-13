const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');
const crypto = require('crypto');
const db = require('./dbHandler');

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
    db.sqlite_inst.get('SELECT * FROM users WHERE username = ?', [ username ], function(err, user) {
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

const passportJWT = require("passport-jwt");
const jwt = require("jsonwebtoken");
const JWTStrategy   = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
passport.use(new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey   : process.env.JWT_SECRET
    },
    function (jwtPayload, callback) {
        db.sqlite_inst.get('SELECT * FROM users WHERE username = ?', [ jwtPayload ], function(err, user) {
            if (err) { return callback(err); }
            if (!user) { return callback(null, false, { message: 'Incorrect token.' }); }

            crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
                if (err) { return callback(err); }
                if (!crypto.timingSafeEqual(user.hashed_password, hashedPassword)) {
                    return callback(null, false, { message: 'Incorrect token.' });
                }
                return callback(null, user);
            });
        });
    }
));

// Middleware to verify JWT
function authenticateToken(req, res, next) {
    if (req.baseUrl === "/api") {
        const token = req.headers['authorization'].slice(6).trim();
        // If there is no token, return an error
        if(token == null) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            // If there is an error, return an error
            if(err) return res.status(401).json({ message: 'User not authenticated.' });

            // If there is no error, continue the execution
            req.userID = user;
            next();
        })
    } else {
        const authCookie = req.cookies['nargle'];
        // If there is no cookie, return an error
        if(authCookie == null) {
            return res.redirect("/login");
        }

        jwt.verify(authCookie, process.env.JWT_SECRET, (err, user) => {
            // If there is an error, return an error
            if(err) return res.redirect("/login");

            // If there is no error, continue the execution
            req.userID = user;
            next();
        })
    }
}

module.exports = authenticateToken;
