const { createCanvas, Image, registerFont } = require('canvas');
const db = require("../handlers/dbHandler");
const fs = require('fs');
const path = require('path');
const pocketWatchBase = {
    sourceUrl : path.join(__dirname, '../public/images/pocket-watch-clock-face.png'),
    writeToUrl: path.join(__dirname, '../public/images/GENERATED-pocket-watch-clock-face.png'),
    width: 693,
    height: 960,
    center: {
        width: 350,
        height: 606
    },
    radiusMod: .6
};

const watchHandBase = {
    sourceUrl : path.join(__dirname, '../public/images/half-scissor-outline.png'),
    width: 128,
    height: 700,
    radiusMod: .5
};
let isFinished;

function isPocketWatchFinished() {
    return isFinished;
}

async function createPocketWatchImage() {
    isFinished = false;
    registerFont(path.join(__dirname, '../public/fonts/XanhMono-Regular.ttf'), { family: 'Xanh Mono' });
    try {
        await fs.unlinkSync(pocketWatchBase.writeToUrl);
    } catch {
        //do nothing
    }
    const canvas = createCanvas(pocketWatchBase.width, pocketWatchBase.height);
    const ctx = canvas.getContext('2d');

    // Get all Clock Face Postions + Name;
    const clockPositions = await db.getAllClockPositions();
    const wizardWithPositionArray = await db.getAllUsersClockFacePositions();
    const currentWizardState = [];

    const pocketWatchImage = new Image();
    pocketWatchImage.onload = () => drawClock();
    pocketWatchImage.onerror = err => { throw err };
    pocketWatchImage.src = pocketWatchBase.sourceUrl;

    const watchHandImage = new Image();
    watchHandImage.onerror = err => { throw err };
    watchHandImage.src = watchHandBase.sourceUrl;

    async function drawClock() {
        ctx.resetTransform();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(pocketWatchImage, 0, 0, canvas.width, canvas.height);
        await drawNumbers(ctx, pocketWatchBase.center.height/2 - 18, clockPositions);
        await drawTime(ctx, pocketWatchBase.center.height/2 - 18, clockPositions, wizardWithPositionArray);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(pocketWatchBase.writeToUrl, buffer);
        console.log("Pocket Watch Created.");
        isFinished = true;
    }

    // Much help from https://github.com/malcolmrigg/wizard-clock-card/tree/master
    async function drawNumbers(ctx, radius, positions) {
        let selectedFont = 'Xanh Mono';
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillStyle = 'black';

        // Have to compensate for the clock not being a true circle
        const startingAdjustArray = [0.81, 0.82, 0.76, 0.76, 0.74, 0.74, 0.73, 0.73, 0.75, 0.73, 0.71, 0.71, .79];
        const ovalCompensateArray = [0, 5, 10, 10, 7, 3, 0, 3, 7, 6, 4, -2, -3];

        for (let num = 0; num < positions.length; num++) {
            // Unfun Required Math
            const positionTranslateArray = [-99, -75, -68, -72, -83, -98, -110, -122, -132, -140, -146, -148];
            const positionRotateArray = [-55, -30, -5, 20, 35, 40, 38, 38, 38, 28, 17, 10];
            const fontScaleArray = [0.9, 0.8, 0.7, 0.6, 0.6, 0.55, 0.55, 0.5, 0.5, 0.45, 0.4, 0.35];
            const charWidthArray = [3.8, 4, 3.9, 3.5, 2.8, 2.5, 2.5, 2.5, 2.8, 2.8, 2.8];

            ctx.resetTransform();
            ctx.translate(pocketWatchBase.center.width, pocketWatchBase.center.height);
            let ang = (2 * Math.PI / positions.length) * (num + startingAdjustArray[num]);
            ctx.rotate(ang);

            // Now draw, rotate, reset, and repeat
            let text = positions[num].name.toUpperCase();
            for (let j = 0; j < text.length; j++) {
                ctx.font = "bold " + radius * 0.15 * fontScaleArray[j] + "px " + selectedFont;

                // From Center to Edge
                ctx.translate(0, (0 - (radius + ovalCompensateArray[num] * pocketWatchBase.radiusMod + positionTranslateArray[j]* pocketWatchBase.radiusMod)));
                // Rotate to letter position
                ctx.rotate(positionRotateArray[j] * Math.PI / 180);

                ctx.fillText(text[j], 0, 0);

                // Rotate back to straight
                ctx.rotate(-positionRotateArray[j] * Math.PI / 180);
                // From Edge to Center
                ctx.translate(0, -(0 - (radius + ovalCompensateArray[num]* pocketWatchBase.radiusMod + positionTranslateArray[j]* pocketWatchBase.radiusMod)));

                ctx.rotate((charWidthArray[j]) * Math.PI / 180);
            }
        }
    }

    async function drawTime(ctx) {
        ctx.resetTransform();
        ctx.translate(pocketWatchBase.center.width, pocketWatchBase.center.height);

        // Update Wizard Info
        for (let num = 0; num < wizardWithPositionArray.length; num++) {
            const wizardClockPosition = wizardWithPositionArray[num];
            const wizardOffset = ((num - ((wizardWithPositionArray.length - 1) / 2)) / wizardWithPositionArray.length * 0.6);
            let location = wizardOffset;
            for (let loc of clockPositions) {
                if (loc.name === wizardClockPosition.position.name) {
                    location = wizardOffset + loc.face_position;
                }
            }
            location = (2 * Math.PI / clockPositions.length) * (location + .2);

            currentWizardState.push({
                wizard: wizardWithPositionArray[num].name,
                pos: location,
                length: (pocketWatchBase.center.height / 2) * 0.7,
                width: (pocketWatchBase.center.width) * 0.05,
            });
        }

        // draw currentState
        for (let wizardState of currentWizardState) {
            await drawHand(ctx, wizardState.pos, wizardState.length, wizardState.width, wizardState.wizard);
        }
    }

    async function drawHand(ctx, pos, length, width, wizard) {
        let fontScale = 0.3;
        let selectedFont = 'Aboreto';

        ctx.rotate(pos);
        ctx.drawImage(watchHandImage, -20* watchHandBase.radiusMod,
            -400* watchHandBase.radiusMod, watchHandBase.width* watchHandBase.radiusMod,
            watchHandBase.height* watchHandBase.radiusMod);
        ctx.font = "bolder " + width * 3 * fontScale + "px " + selectedFont;
        ctx.fillStyle = "white";
        ctx.translate(6, -length / 2);
        ctx.rotate(Math.PI / 2)
        if (pos < Math.PI && pos >= 0) {
            ctx.rotate(Math.PI);
        }
        ctx.fillText(wizard.toUpperCase(), 0, 0);
        if (pos < Math.PI && pos >= 0) {
            ctx.rotate(-Math.PI);
        }
        ctx.rotate(-Math.PI / 2);
        ctx.translate(-6, length / 2);
        ctx.rotate(-pos);
    }
}

module.exports = {
    createPocketWatchImage,
    isPocketWatchFinished
};
