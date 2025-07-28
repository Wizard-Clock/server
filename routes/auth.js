const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const authenticateToken = require("../handlers/authHandler");

const router = express.Router();

/* Login home page. */
router.get('/', authenticateToken, function(req, res) {
    res.redirect("/clock");
});

router.get('/login', function(req, res, next) {
    res.render('login', { title: 'Login' , errorMsg: ""});
});

router.post('/login', function (req, res, next) {
    passport.authenticate('local', (err, user, info) => {
        if (err || !user) {
            return res.render('login', { title: 'Login' , errorMsg: info.message });
        }
        req.login(user, {session: false}, err => {
            if (err) {
                res.send(err);
            }
            const token = jwt.sign(user.id, process.env.JWT_SECRET);
            let age = req.body.rememberMe ? 31557600000 : 3600000;
            res.cookie('nargle', token, { httpOnly: true, secure: true, maxAge: age });
            return res.redirect('/clock');
        })
    })
    (req, res);
});

router.post('/logout', function(req, res, next){
    res.clearCookie('nargle');
    res.redirect('/');
});

module.exports = router;
