const express = require('express');
const passport = require('passport');

const router = express.Router();

/* Login home page. */
router.get('/', function(req, res) {
    if (req.isAuthenticated()) {
        res.redirect("/dashboard");
    } else {
        res.redirect("login");
    }
});

router.get('/login', function(req, res, next) {
    let errors = req.session.messages ? req.session.messages.pop() : undefined;
    res.render('login', { title: 'Login' , errorMsg: errors});
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/',
    failureMessage: true
}));

router.post('/logout', function(req, res, next){
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

module.exports = router;
