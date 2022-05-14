"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
require("dotenv/config");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
// import { uploadBytes, ref } from "firebase/storage";
const storage_1 = require("firebase-admin/storage");
console.log("private key is " + process.env.FIREBASE_PRIVATE_KEY);
const firebaseApp = (0, app_1.initializeApp)({
    credential: firebase_admin_1.default.credential.cert({
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
        projectId: process.env.FIREBASE_PROJECT_ID,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});
const PORT = 3000;
const USER_DOCUMENT_ID = "XI3pHNcWUMDUuDcGlBpA";
const app = (0, express_1.default)();
const db = (0, firestore_1.getFirestore)();
const bucket = (0, storage_1.getStorage)().bucket();
const bgsGalleryRef = db
    .collection("Users")
    .doc(USER_DOCUMENT_ID)
    .collection("BGSs");
function getBrandGuides(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const bgsGallerySnapshot = yield bgsGalleryRef.get();
        const bgsGallery = [];
        bgsGallerySnapshot.forEach((doc) => {
            let data = doc.data();
            bgsGallery.push(data);
        });
        res.send(bgsGallery);
    });
}
function getBrandGuide(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const name = req.params.name.split("%20").join(" ");
        const bgsRef = yield bgsGalleryRef.doc(name);
        const bgsSnapshot = yield bgsRef.get();
        const pagesSnapshot = yield bgsRef.collection("Pages").get();
        const pages = [];
        pagesSnapshot.forEach((doc) => {
            pages.push(doc.data());
        });
        const bgsData = bgsSnapshot.data();
        bgsData.pages = pages;
        res.send(bgsData);
    });
}
function uploadFile(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const originalName = req["file"].originalname;
        const blob = req["file"].buffer;
        bucket
            .file(originalName)
            .save(blob)
            .then(() => {
            res.sendStatus(200);
        })
            .catch(() => {
            res.sendStatus(500);
        });
    });
}
app.get("/brandguides", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //   const docRef = db
    //     .collection("Users")
    //     .doc("XI3pHNcWUMDUuDcGlBpA")
    //     .collection("BGSs")
    //     .doc("Johnny Walker")
    //     .collection("Pages")
    //     .doc("Typography");
    // const response = await docRef.set(
    // {
    //     capital: true,
    // },
    // { merge: true }
    // );
    getBrandGuides(req, res);
}));
app.get("/brandguides/:name", (req, res) => __awaiter(void 0, void 0, void 0, function* () { return getBrandGuide(req, res); }));
app.post("/upload", (0, multer_1.default)().single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () { return uploadFile(req, res); }));
app.listen(PORT, () => {
    return console.log(`Express is listening at http://localhost:${PORT}`);
});
//# sourceMappingURL=app.js.map