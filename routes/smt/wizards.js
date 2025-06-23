const express = require('express');
const router = express.Router();
const db = require("../../handlers/dbHandler");
const {formidable} = require('formidable');
const authenticateToken = require("../../handlers/authHandler");

router.get("/", authenticateToken, async function (req, res, next) {
    const userRole = await db.getRoleFromUserID(req.userID);
    if (userRole.role !== "admin") {
        return res.redirect("/clock");
    }
    let users = await db.getAllUsers();
    for (let user of users) {
        await db.getRoleFromUserID(user.id).then(role => {user.role = role.role});
    }
    const user = await db.getUserFromID(req.userID);
    res.render('wizards',{title: 'Wizards', username: user.username, role: userRole.role, wizards: users, roles: await db.getAllRoles()});
});

router.post('/addUser', authenticateToken, async function (req, res, next) {
    const form = formidable({ multiples: true });
    await form.parse(req, async (err, user) => {
        await db.addUser(user.username[0], user.password[0], user.role[0]);
        res.send({success: true});
    });
})

router.post('/deleteUser', authenticateToken, async function (req, res, next) {
    await db.deleteUser(req.body.id);
    res.send({success: true});
})

router.post('/updateUser', authenticateToken, async function (req, res, next) {
    await db.updateUser(req.body);
    res.send({success: true});
})

module.exports = router;
