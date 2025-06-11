const express = require('express');
const router = express.Router();
const db = require("../handlers/dbHandler");
const {formidable} = require('formidable');
const authenticateToken = require("../handlers/authHandler");


/* GET home page. */
router.get('/', authenticateToken, async function (req, res, next) {
    const user = await db.getUserFromID(req.userID);
    const userRole = await db.getRoleFromUserID(req.userID);
    res.render('index', {title: 'Home', username: user.username, role: userRole.role});
});

router.get("/wizards", authenticateToken, async function (req, res, next) {
    let users = await db.getAllUsers();
    for (let user of users) {
        await db.getRoleFromUserID(user.id).then(role => {user.role = role.role});
    }
    res.render('wizards',{wizards: users, roles: await db.getAllRoles()});
});

router.post('/wizards/addUser', authenticateToken, async function (req, res, next) {
    const form = formidable({ multiples: true });
    await form.parse(req, async (err, user) => {
        await db.addUser(user.username[0], user.password[0], user.role[0]);
        console.log('fields: ', user);
        res.send({success: true});
    });
})

router.post('/wizards/deleteUser', authenticateToken, async function (req, res, next) {
    await db.deleteUser(req.body.id);
    res.send({success: true});
})

router.post('/wizards/updateUser', authenticateToken, async function (req, res, next) {
    console.log(req.body);
    // await db.updateUser(req.body);
    res.send({success: true});
})

module.exports = router;
