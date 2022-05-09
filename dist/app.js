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
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
(0, app_1.initializeApp)({
    credential: (0, app_1.applicationDefault)(),
    storageBucket: "markr-7d6ab.appspot.com",
});
const app = (0, express_1.default)();
const port = 3000;
const db = (0, firestore_1.getFirestore)();
const bucket = (0, storage_1.getStorage)().bucket;
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const snapshot = yield db.collection("Users").get();
    snapshot.forEach((doc) => {
        console.log(doc.id, "=>", doc.data());
    });
    res.sendStatus(200);
}));
const storage_2 = require("@google-cloud/storage");
function uploadFile(name, file) {
    return __awaiter(this, void 0, void 0, function* () {
        yield new storage_2.Storage().bucket("markr-7d6ab").file(name).save(file);
    });
}
app.post("/", (0, multer_1.default)().single("file"), function (req, res) {
    const originalName = req["file"].originalname;
    uploadFile(originalName, req["file"]);
    res.sendStatus(200);
});
app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});
//# sourceMappingURL=app.js.map