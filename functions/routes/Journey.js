const express = require('express');
const router = express.Router();
const COLLECTION_NAME = "Journey";
const CORS = require('cors');
const functions = require('firebase-functions');

const admin = require("./init.js")

const db = admin.firestore();

const JourneyApp = express();

JourneyApp.use(CORS({ origin: true }));


JourneyApp.post('/', async (req, res) => {
    const Journey = req.body;
    const valid = dataValidation(Journey.time, Journey.path, Journey.bus, Journey.driver)

    if (valid === "") {
        await db.collection(COLLECTION_NAME).add(Journey)
        res.status(201).send(JSON.stringify(Journey));
    } else {
        res.status(400).json({
            status: 'error',
            error: valid
        });
    }

});


JourneyApp.get('/', async (req, res) => {
    const snapshot = await db.collection(COLLECTION_NAME).get();

    let journeys = [];
    snapshot.forEach(element => {
        let id = element.id;
        let data = element.data();
        journeys.push({ id, ...data });
    });
    res.status(200).send(JSON.stringify(journeys));
});

JourneyApp.get('/getByPath/:path', async (req, res) => {
    const snapshot = await db.collection(COLLECTION_NAME).where("path", "==", req.params.path).get();

    let journeys = [];
    snapshot.forEach(element => {
        let id = element.id;
        let data = element.data();
        journeys.push({ id, ...data });
    });
    res.status(200).send(JSON.stringify(journeys));
});
JourneyApp.get('/getById/:id', async (req, res) => {
    const snapshot = await db.collection(COLLECTION_NAME).doc(req.params.id).get();

    if (!snapshot.exists) {
        res.status(200).send(null);
        return;
    }
    let id = snapshot.id;
    let data = snapshot.data();
    res.status(200).send(JSON.stringify({ id, data }));
});

JourneyApp.get('/timeXdriver/:time/:driver', async (req, res) => {
    const snapshot = await db.collection(COLLECTION_NAME)
        .where("time", "==", req.params.time)
        .where("driver", "==", req.params.driver).get();
    let journeys = [];
    snapshot.forEach(element => {
        let id = element.id;
        let data = element.data();
        journeys.push({ id, ...data });
    });
    res.status(200).send(JSON.stringify(journeys));
});

JourneyApp.get('/timeXbus/:time/:bus', async (req, res) => {
    const snapshot = await db.collection(COLLECTION_NAME)
        .where("time", "==", req.params.time)
        .where("bus", "==", req.params.bus).get();
    let journeys = [];
    snapshot.forEach(element => {
        let id = element.id;
        let data = element.data();
        journeys.push({ id, ...data });
    });
    res.status(200).send(JSON.stringify(journeys));
});


JourneyApp.put('/:id', async (req, res) => {
    const Journey = req.body;

    const valid = dataValidation(Journey.time, Journey.path, Journey.bus, Journey.driver)

    if (valid === "") {
        const snapshot = await db.collection(COLLECTION_NAME).doc(req.params.id).get();
        if (!snapshot.exists) {
            res.status(400).json({
                status: 'error',
                error: "no Journey with id : " + req.params.id
            });
            return;
        }
        await db.collection(COLLECTION_NAME).doc(req.params.id).update(Journey);
        res.status(201).send(JSON.stringify(Journey));
    } else {
        res.status(400).json({
            status: 'error',
            error: valid
        });
    }

});


JourneyApp.delete('/:id', async (req, res) => {
    const snapshot = await db.collection(COLLECTION_NAME).doc(req.params.id).get();
    if (!snapshot.exists) {
        res.status(400).json({
            status: 'error',
            error: "no Journey with id : " + req.params.id
        });
        return;
    }
    await db.collection(COLLECTION_NAME).doc(req.params.id).delete();

    res.status(200).send();
});
let dataValidation = (time, path, bus, driver) => {

    let errorMsg = "";
    if (!time || time === "")
        errorMsg += "Journey time missing or empty |"
    if (!path || path === "")
        errorMsg += "Journey path missing or empty |"
    if (!bus || bus === "")
        errorMsg += "Journey bus missing or empty |"
    if (errorMsg !== "")
        return errorMsg
    if (!validateTime(time))
        errorMsg = "time invalid"
    return errorMsg;
}

let validateTime = (time) => {
    return /^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/.test(time)
}
exports.Journey = functions.https.onRequest(JourneyApp)
