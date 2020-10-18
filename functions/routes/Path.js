const express = require('express');
const router = express.Router();
const COLLECTION_NAME = "Path";
const CORS = require('cors');
const functions = require('firebase-functions');
const admin = require("./init.js")

const db = admin.firestore();

const PathApp = express();

PathApp.use(CORS({ origin: true }));


PathApp.post('/', async (req, res) => {
    const Path = req.body;
    const valid = dataValidation(Path.name, Path.timeEst, Path.geoJSON)

    if (valid === "") {

        let listOfPathes = await db.collection(COLLECTION_NAME).get();

        listOfPathes.forEach(_Path => {
            if (_Path.data().name === Path.name) {
                res.status(400).json({
                    status: "error",
                    error: "Path : " + Path.name + " already exist "
                });
                return;
            }
        });
        await db.collection(COLLECTION_NAME).add(Path)
        res.status(201).send(JSON.stringify(Path));
    } else {
        res.status(400).json({
            status: 'error',
            error: valid
        });
    }

});


PathApp.get('/', async (req, res) => {
    const snapshot = await db.collection(COLLECTION_NAME).get();

    let Pathes = [];
    snapshot.forEach(element => {
        let id = element.id;
        let data = element.data();
        Pathes.push({ id, ...data });
    });
    res.status(200).send(JSON.stringify(Pathes));
});

PathApp.get('/getById/:id', async (req, res) => {
    const snapshot = await db.collection(COLLECTION_NAME).doc(req.params.id).get();

    if (!snapshot.exists) {
        res.status(200).send(null);
        return;
    }
    let id = snapshot.id;
    let data = snapshot.data();
    res.status(200).send(JSON.stringify({ id, data }));
});

PathApp.get('/getbyname/:name', async (req, res) => {
    const snapshot = await db.collection(COLLECTION_NAME).where("name", "==", req.params.name).get();
    let Pathes = [];
    snapshot.forEach(element => {
        let id = element.id;
        let data = element.data();
        Pathes.push({ id, ...data });
    });
    res.status(200).send(JSON.stringify(Pathes));
});



PathApp.put('/:id', async (req, res) => {
    const Path = req.body;

    const valid = dataValidation(Path.name, Path.timeEst, Path.geoJSON)

    if (valid === "") {
        const snapshot = await db.collection(COLLECTION_NAME).doc(req.params.id).get();
        if (!snapshot.exists) {
            res.status(400).json({
                status: 'error',
                error: "no Path with id : " + req.params.id
            });
            return;
        }
        await db.collection(COLLECTION_NAME).doc(req.params.id).update(Path);
        res.status(201).send(JSON.stringify(Path));
    } else {
        res.status(400).json({
            status: 'error',
            error: valid
        });
    }

});


PathApp.delete('/:id', async (req, res) => {
    const snapshot = await db.collection(COLLECTION_NAME).doc(req.params.id).get();
    if (!snapshot.exists) {
        res.status(400).json({
            status: 'error',
            error: "no Path with id : " + req.params.id
        });
        return;
    }
    await db.collection(COLLECTION_NAME).doc(req.params.id).delete();

    res.status(200).send();
});
let dataValidation = (name, timeEst, geoJSON) => {
    let errorMsg = "";
    if (!name || name === "")
        errorMsg += "Path name missing or empty |"
    if (!timeEst || timeEst === "")
        errorMsg += "Path timeEst missing or empty |"
    if (!geoJSON || geoJSON === "")
        errorMsg += "Path geoJSON missing or empty |"
    if (errorMsg !== "")
        return errorMsg

    let loc = JSON.parse(geoJSON);
    if (!Array.isArray(loc))
        errorMsg += "Path geoJSON should be an array "

    return errorMsg;
}
exports.Path = functions.https.onRequest(PathApp)
