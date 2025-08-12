const db = require("../controllers/dbController");

async function applyFollowLink(followerID, leadID) {
    db.dbConnector.all(`INSERT INTO follower_link (follower_id, lead_id) VALUES (?, ?) ON CONFLICT(follower_id) DO UPDATE SET lead_id=?`,[
        followerID,
        leadID,
        leadID
    ]);
}

async function removeFollowLink(followerID) {
    await db.dbConnector.run(`DELETE FROM follower_link WHERE follower_id=?`, followerID, () => {});
}

async function getLeadIDFromFollowerID(followerID) {
    return await new Promise((resolve, reject) => {
        db.dbConnector.all('SELECT lead_id FROM follower_link WHERE follower_id=?', followerID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

async function getFollowerInfoFromLeadID(leadID) {
    return await new Promise((resolve, reject) => {
        db.dbConnector.all('SELECT * FROM follower_link WHERE lead_id=?', leadID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

module.exports = {
    applyFollowLink,
    removeFollowLink,
    getLeadIDFromFollowerID,
    getFollowerInfoFromLeadID
}