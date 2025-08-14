const locationController = require("../../src/controllers/locationController");
const locationDAO = require("../../src/dao/locationDAO");
const clockFaceDAO = require("../../src/dao/clockFaceDao");
const {should, expect} = require('chai');
should();

const TEST_LOCATION = {
    name: 'Loch Morar',
    clockPosition: 5,
    latitude: '56.954592',
    longitude: '-5.683472',
    radius: 500,
    description: 'One of the many lochs used for shots of Hogwarts Lake.',
}

let TEST_LOCATION_UPDATE = {
    name: 'Loch Arkaig',
    clockPosition: 4,
    latitude: '50.2342',
    longitude: '-20.683472',
    radius: 1000,
    description: 'The only loch used for shots of Hogwarts Lake.',
}

describe('Location CRUD Tests', function () {
    describe('Create', function () {
        it('create location.', async function () {
            await locationController.addLocationInfo(TEST_LOCATION).then(async result => {
                result.should.equal(true);
            });
        });

        it('verify create.', async function () {
            let createdLocation = await locationDAO.getLocationFromName(TEST_LOCATION.name);
            let clockFacePosition = await clockFaceDAO.getClockPositionFromLocationID(createdLocation.id);
            createdLocation.name.should.equal(TEST_LOCATION.name);
            clockFacePosition.face_position.should.equal(TEST_LOCATION.clockPosition);
            createdLocation.latitude.should.equal(TEST_LOCATION.latitude);
            createdLocation.longitude.should.equal(TEST_LOCATION.longitude);
            createdLocation.radius.should.equal(TEST_LOCATION.radius);
            createdLocation.description.should.equal(TEST_LOCATION.description);
        });
    });

    describe('Update', function () {
        it('update location.', async function () {
            let createdLocation = await locationDAO.getLocationFromName(TEST_LOCATION.name);
            TEST_LOCATION_UPDATE.id = createdLocation.id;
            await locationController.updateLocationInfo(TEST_LOCATION_UPDATE).then(async result => {
                result.should.equal(true);
            });
        });

        it('verify update.', async function () {
            let updatedLocation = await locationDAO.getLocationFromName(TEST_LOCATION_UPDATE.name);
            let clockFacePosition = await clockFaceDAO.getClockPositionFromLocationID(updatedLocation.id);

            updatedLocation.name.should.equal(TEST_LOCATION_UPDATE.name);
            updatedLocation.name.should.not.equal(TEST_LOCATION.name);

            clockFacePosition.face_position.should.equal(TEST_LOCATION_UPDATE.clockPosition);
            clockFacePosition.face_position.should.not.equal(TEST_LOCATION.clockPosition);

            updatedLocation.latitude.should.equal(TEST_LOCATION_UPDATE.latitude);
            updatedLocation.latitude.should.not.equal(TEST_LOCATION.latitude);

            updatedLocation.longitude.should.equal(TEST_LOCATION_UPDATE.longitude);
            updatedLocation.longitude.should.not.equal(TEST_LOCATION.longitude);

            updatedLocation.radius.should.equal(TEST_LOCATION_UPDATE.radius);
            updatedLocation.radius.should.not.equal(TEST_LOCATION.radius);

            updatedLocation.description.should.equal(TEST_LOCATION_UPDATE.description);
            updatedLocation.description.should.not.equal(TEST_LOCATION.description);
        });
    });

    describe('Delete', function () {
        it('delete location.', async function () {
            await locationController.deleteLocationInfo(TEST_LOCATION_UPDATE.id).then(async result => {
                result.should.equal(true);
            });
        });

        it('verify delete.', async function () {
            let locationList = await locationDAO.getAllLocations();
            for (let loc of locationList) {
                TEST_LOCATION_UPDATE.id.should.not.equal(loc.id);
            }
            await clockFaceDAO.getClockPositionFromLocationID(TEST_LOCATION_UPDATE.id).then(async result => {
                expect(result).to.equal(null);
            })
        });
    });
});