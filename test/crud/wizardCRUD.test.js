const wizardController = require('../../src/controllers/wizardController');
const clockFaceController = require('../../src/controllers/clockFaceController');
const locationDAO = require("../../src/dao/locationDAO");
const followerDAO = require("../../src/dao/followerDao");
const wizardDAO = require("../../src/dao/wizardDao");
const roleDAO = require("../../src/dao/roleDao");
const {should, expect} = require('chai');
should();

const TEST_USER = {
    username: 'Sirius',
    password: 'padf00t',
    role: 'user',
    isFollower: false,
    reportingMethod: 'auto',
}

const TEST_USER_UPDATED = {
    username: 'Lupin',
    password: 'mooney',
    role: 'admin',
    isFollower: 'false',
    reportingMethod: 'manual',
}

const TEST_CHILD = {
    username: 'Lily',
    password: 'always',
    role: 'child',
    isFollower: true,
    lead: TEST_USER.username,
    reportingMethod: 'follow'
}

let TEST_CHILD_UPDATE = {
    username: 'Lil',
    password: 'never',
    role: 'user',
    isFollower: 'false',
    lead: null,
    reportingMethod: 'manual',
}


describe('User CRUD Tests', function () {
    describe('Create', function () {
        it('create and initialize user', async function () {
            await wizardController.addUserInfo(
                TEST_USER.username, TEST_USER.password, TEST_USER.role,
                TEST_USER.reportingMethod, TEST_USER.isFollower, '').then(async result => {
                    result.should.equal(true);
            });
        });

        it('verify user create and initialize', async function () {
            let createdUser = await wizardDAO.getUserFromName(TEST_USER.username);
            createdUser.username.should.equal(TEST_USER.username);
            createdUser.isFollower.should.equal(TEST_USER.isFollower.toString());

            let role = await roleDAO.getRoleFromUserID(createdUser.id);
            role.role.should.equal(TEST_USER.role);

            createdUser.reportingMethod.should.equal(TEST_USER.reportingMethod);

            let leadInfo = await followerDAO.getLeadIDFromFollowerID(createdUser.id);
            expect(leadInfo).to.equal(undefined);

            let userClockPosition = await clockFaceController.getClockPositionFromUserID(createdUser.id);
            let defaultClockPosition = await clockFaceController.getDefaultClockPosition();
            userClockPosition.id.should.equal(defaultClockPosition.id);
        });

        it('create and initialize child user', async function () {
            let leadUser = await wizardDAO.getUserFromName(TEST_USER.username);
            await wizardController.addUserInfo(TEST_CHILD.username, TEST_CHILD.password,
                TEST_CHILD.role, TEST_CHILD.reportingMethod, TEST_CHILD.isFollower, leadUser.id).then(async result => {
                result.should.equal(true);
            });
        });

        it('verify child create and initialize', async function () {
            let leadUser = await wizardDAO.getUserFromName(TEST_USER.username);
            let createdChild = await wizardDAO.getUserFromName(TEST_CHILD.username);
            createdChild.username.should.equal(TEST_CHILD.username);
            createdChild.isFollower.should.equal(TEST_CHILD.isFollower.toString());

            createdChild.reportingMethod.should.equal(TEST_CHILD.reportingMethod);

            let role = await roleDAO.getRoleFromUserID(createdChild.id);
            role.role.should.equal(TEST_CHILD.role);
            let leadInfo = await followerDAO.getLeadIDFromFollowerID(createdChild.id);
            leadInfo.lead_id.should.equal(leadUser.id);

            let userClockPosition = await clockFaceController.getClockPositionFromUserID(createdChild.id);
            let defaultClockPosition = await clockFaceController.getDefaultClockPosition();
            userClockPosition.id.should.equal(defaultClockPosition.id);
        });
    });

    describe('Update', function () {
        it('update child user.', async function () {
            let childUser = await wizardDAO.getUserFromName(TEST_CHILD.username);
            TEST_CHILD_UPDATE.id = childUser.id;
            await wizardController.updateUserInfo(TEST_CHILD_UPDATE).then(async result => {
                result.should.equal(true);
            });
        });

        it('verify child user update.', async function () {
            let childUserUpdated = await wizardDAO.getUserFromName(TEST_CHILD_UPDATE.username);

            childUserUpdated.username.should.equal(TEST_CHILD_UPDATE.username);
            childUserUpdated.username.should.not.equal(TEST_CHILD.username);

            childUserUpdated.reportingMethod.should.equal(TEST_CHILD_UPDATE.reportingMethod);
            childUserUpdated.reportingMethod.should.not.equal(TEST_CHILD.reportingMethod);

            let updatedRole = await roleDAO.getRoleFromUserID(childUserUpdated.id);
            updatedRole.role.should.equal(TEST_CHILD_UPDATE.role);
            updatedRole.role.should.not.equal(TEST_CHILD.role);

            childUserUpdated.isFollower.should.equal(TEST_CHILD_UPDATE.isFollower.toString());
            childUserUpdated.isFollower.should.not.equal(TEST_CHILD.isFollower.toString());
            let leadInfo = await followerDAO.getLeadIDFromFollowerID(childUserUpdated.id);
            expect(leadInfo).to.equal(undefined);

            let userClockPosition = await clockFaceController.getClockPositionFromUserID(childUserUpdated.id);
            let defaultClockPosition = await clockFaceController.getDefaultClockPosition();
            userClockPosition.id.should.equal(defaultClockPosition.id);
        });

        it('update user.', async function () {
            let normUser = await wizardDAO.getUserFromName(TEST_USER.username);
            TEST_USER_UPDATED.id = normUser.id;
            await wizardController.updateUserInfo(TEST_USER_UPDATED).then(async result => {
                result.should.equal(true);
            });
        });

        it('verify user update.', async function () {
            let normUserUpdated = await wizardDAO.getUserFromName(TEST_USER_UPDATED.username);

            normUserUpdated.username.should.equal(TEST_USER_UPDATED.username);
            normUserUpdated.username.should.not.equal(TEST_USER.username);

            normUserUpdated.reportingMethod.should.equal(TEST_USER_UPDATED.reportingMethod);
            normUserUpdated.reportingMethod.should.not.equal(TEST_USER.reportingMethod);

            let updatedRole = await roleDAO.getRoleFromUserID(normUserUpdated.id);
            updatedRole.role.should.equal(TEST_USER_UPDATED.role);
            updatedRole.role.should.not.equal(TEST_USER.role);

            normUserUpdated.isFollower.should.equal(TEST_USER_UPDATED.isFollower.toString());
            let leadInfo = await followerDAO.getLeadIDFromFollowerID(normUserUpdated.id);
            expect(leadInfo).to.equal(undefined);

            let userClockPosition = await clockFaceController.getClockPositionFromUserID(normUserUpdated.id);
            let defaultClockPosition = await clockFaceController.getDefaultClockPosition();
            userClockPosition.id.should.equal(defaultClockPosition.id);
        });
    });

    describe('Delete', function () {
        it('delete child user.', async function () {
            let childUser = await wizardController.deleteUserInfo(TEST_CHILD_UPDATE.id);
            expect(childUser).to.equal(undefined);
        });

        it('verify child user delete.', async function () {
            let allUsers = await wizardDAO.getAllUsers();
            for (let wizard of allUsers) {
                TEST_CHILD_UPDATE.id.should.not.equal(wizard.id);
            }
            await wizardDAO.getUserClockPositionInfoFromUserID(TEST_CHILD_UPDATE.id).then(async result => {
                expect(result).to.equal(undefined);
            });
        });

        it('delete admin user.', async function () {
            let normUser = await wizardController.deleteUserInfo(TEST_USER_UPDATED.id);
            expect(normUser).to.equal(undefined);
        });

        it('verify admin user delete.', async function () {
            let allUsers = await wizardDAO.getAllUsers();
            for (let wizard of allUsers) {
                TEST_USER_UPDATED.id.should.not.equal(wizard.id);
            }
            await wizardDAO.getUserClockPositionInfoFromUserID(TEST_USER_UPDATED.id).then(async result => {
                expect(result).to.equal(undefined);
            });
        });
    });
});