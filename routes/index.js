const express = require('express');
const router = express.Router();
const db = require("../db");


/* GET home page. */
router.get('/', async function (req, res, next) {
  if (!req.isAuthenticated()) {
    res.redirect('../');
  } else {
    const role = await db.getRoleNameFromUserID(req.user.id);
    res.render('index', {title: 'Home', username: req.user.username, role: role[0].role});
  }
});

module.exports = router;
