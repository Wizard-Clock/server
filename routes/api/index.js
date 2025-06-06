const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require("../../handlers/dbHandler");
const authenticateToken = require("../../handlers/authHandler");
const passport = require("passport");

router.post('/login', async function (req, res, next) {
    passport.authenticate('local', (err, user) => {
        if (err || !user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        req.login(user, {session: false}, err => {
            if (err) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }
            const token = jwt.sign(user.id, process.env.JWT_SECRET);
            return res.json({ token })
        })
    })
    (req, res);
});

module.exports = router;
