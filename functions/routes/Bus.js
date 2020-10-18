const express = require('express');
const router = express.Router();
const COLLECTION_NAME = "Bus";
const CORS = require('cors');
const functions = require('firebase-functions');

const admin = require("./init.js")

const db = admin.firestore();

const BusApp = express();

BusApp.use(CORS({ origin: true }));


BusApp.post('/', async (req, res) => {
    const bus = req.body;
    const valid = dataValidation(bus.number, bus.state, bus.location)

    if (valid === "") {

        let listOfBuses = await db.collection(COLLECTION_NAME).get();

        listOfBuses.forEach(_bus => {
            if (_bus.data().number === bus.number) {
                res.status(400).json({
                    status: "error",
                    error: "bus : " + bus.number + " already exist "
                });
                return;
            }
        });
        await db.collection(COLLECTION_NAME).add(bus)
        res.status(201).send(JSON.stringify(bus));
    } else {
        res.status(400).json({
            status: 'error',
            error: valid
        });
    }

});


BusApp.get('/', async (req, res) => {
    const snapshot = await db.collection(COLLECTION_NAME).get();

    let Buses = [];
    snapshot.forEach(element => {
        let id = element.id;
        let data = element.data();
        Buses.push({ id, ...data });
    });
    res.status(200).send(JSON.stringify(Buses));
});

BusApp.get('/getById/:id', async (req, res) => {
    const snapshot = await db.collection(COLLECTION_NAME).doc(req.params.id).get();

    if (!snapshot.exists) {
        res.status(200).send(null);
        return;
    }
    let id = snapshot.id;
    let data = snapshot.data();
    res.status(200).send(JSON.stringify({ id, data }));
});

BusApp.get('/getbyNumber/:number', async (req, res) => {
    const snapshot = await db.collection(COLLECTION_NAME).where("number", "==", req.params.number).get();
    let Buses = [];
    snapshot.forEach(element => {
        let id = element.id;
        let data = element.data();
        Buses.push({ id, ...data });
    });
    res.status(200).send(JSON.stringify(Buses));
});

BusApp.get('/getActive', async (req, res) => {
    const snapshot = await db.collection(COLLECTION_NAME).where("state", "==", "true").get();
    let Buses = [];
    snapshot.forEach(element => {
        let id = element.id;
        let data = element.data();
        Buses.push({ id, ...data });
    });
    res.status(200).send(JSON.stringify(Buses));
});


BusApp.put('/:id', async (req, res) => {
    const bus = req.body;

    const valid = dataValidation(bus.number, bus.state, bus.location)

    if (valid === "") {
        const snapshot = await db.collection(COLLECTION_NAME).doc(req.params.id).get();
        if (!snapshot.exists) {
            res.status(400).json({
                status: 'error',
                error: "no bus with id : " + req.params.id
            });
            return;
        }
        await db.collection(COLLECTION_NAME).doc(req.params.id).update(bus);
        res.status(201).send(JSON.stringify(bus));
    } else {
        res.status(400).json({
            status: 'error',
            error: valid
        });
    }

});


BusApp.delete('/:id', async (req, res) => {
    const snapshot = await db.collection(COLLECTION_NAME).doc(req.params.id).get();
    if (!snapshot.exists) {
        res.status(400).json({
            status: 'error',
            error: "no bus with id : " + req.params.id
        });
        return;
    }
    await db.collection(COLLECTION_NAME).doc(req.params.id).delete();

    res.status(200).send();
});
let dataValidation = (number, state, location) => {
    let errorMsg = "";
    if (!number || number === "")
        errorMsg += "Bus number missing or empty |"
    if (!state || state === "")
        errorMsg += "Bus state missing or empty |"
    if (!location || location === "")
        errorMsg += "Bus location missing or empty |"
    if (errorMsg !== "")
        return errorMsg

    let loc = JSON.parse(location);
    if (isNaN(number))
        errorMsg += "Bus number should contain only numbers  |";
    if (state !== "false" && state !== "true")
        errorMsg += "Bus state should be true or false  |"
    if (!Array.isArray(loc))
        errorMsg += "Bus location should be an array "
    else if (loc.length !== 2 || isNaN(loc[0]) || isNaN(loc[1]))
        errorMsg += "bus location array should contain 2 float "
    return errorMsg;
}
exports.Bus = functions.https.onRequest(BusApp)
