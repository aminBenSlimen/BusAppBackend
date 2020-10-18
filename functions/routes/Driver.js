const express = require('express');
const router = express.Router();
const COLLECTION_NAME = "Driver";
const CORS = require('cors');
const functions = require('firebase-functions');

const admin = require("./init.js")

const db = admin.firestore();

const DriverApp = express();

DriverApp.use(CORS({ origin: true }));


DriverApp.post('/', async (req, res) => {
    const Driver = req.body;
    const valid = dataValidation(Driver.name)

    if (valid === "") {

        let listOfDriveres = await db.collection(COLLECTION_NAME).get();

        listOfDriveres.forEach(_Driver => {
            if (_Driver.data().name === Driver.name) {
                res.status(400).json({
                    status: "error",
                    error: "Driver : " + Driver.name + " already exist "
                });
                return;
            }
        });
        await db.collection(COLLECTION_NAME).add(Driver)
        res.status(201).send(JSON.stringify(Driver));
    } else {
        res.status(400).json({
            status: 'error',
            error: valid
        });
    }

});


DriverApp.get('/', async (req, res) => {
    const snapshot = await db.collection(COLLECTION_NAME).get();

    let Driveres = [];
    snapshot.forEach(element => {
        let id = element.id;
        let data = element.data();
        Driveres.push({ id, ...data });
    });
    res.status(200).send(JSON.stringify(Driveres));
});

DriverApp.get('/getById/:id', async (req, res) => {
    const snapshot = await db.collection(COLLECTION_NAME).doc(req.params.id).get();

    if (!snapshot.exists) {
        res.status(200).send(null);
        return;
    }
    let id = snapshot.id;
    let data = snapshot.data();
    res.status(200).send(JSON.stringify({ id, data }));
});

DriverApp.get('/getbyname/:name', async (req, res) => {
    const snapshot = await db.collection(COLLECTION_NAME).where("name", "==", req.params.name).get();
    let Driveres = [];
    snapshot.forEach(element => {
        let id = element.id;
        let data = element.data();
        Driveres.push({ id, ...data });
    });
    res.status(200).send(JSON.stringify(Driveres));
});


DriverApp.put('/:id', async (req, res) => {
    const Driver = req.body;

    const valid = dataValidation(Driver.name)

    if (valid === "") {
        const snapshot = await db.collection(COLLECTION_NAME).doc(req.params.id).get();
        if (!snapshot.exists) {
            res.status(400).json({
                status: 'error',
                error: "no Driver with id : " + req.params.id
            });
            return;
        }
        await db.collection(COLLECTION_NAME).doc(req.params.id).update(Driver);
        res.status(201).send(JSON.stringify(Driver));
    } else {
        res.status(400).json({
            status: 'error',
            error: valid
        });
    }

});


DriverApp.delete('/:id', async (req, res) => {
    const snapshot = await db.collection(COLLECTION_NAME).doc(req.params.id).get();
    if (!snapshot.exists) {
        res.status(400).json({
            status: 'error',
            error: "no Driver with id : " + req.params.id
        });
        return;
    }
    await db.collection(COLLECTION_NAME).doc(req.params.id).delete();

    res.status(200).send();
});
let dataValidation = (name) => {
    let errorMsg = "";
    if (!name || name === "")
        errorMsg = "Driver name missing or empty |"
    return errorMsg
}
exports.Driver = functions.https.onRequest(DriverApp)
