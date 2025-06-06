const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require("../../handlers/dbHandler");
const authenticateToken = require("../../handlers/authHandler");

router.get('/', authenticateToken, async function (req, res, next) {
    const role = await db.getRoleNameFromUserID(req.user.id);
    res.render('index', {title: 'Home', username: req.user.username, role: role[0].role});
});

module.exports = router;
