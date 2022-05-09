import express from "express";
import multer from "multer";

import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { uploadBytes, ref } from "firebase/storage";
import { getStorage } from "firebase-admin/storage";

initializeApp({
  credential: applicationDefault(),
  storageBucket: "markr-7d6ab.appspot.com",
});

const app = express();
const port = 3000;
const db = getFirestore();
const bucket = getStorage().bucket;

app.get("/", async (req, res) => {
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
  const snapshot = await db.collection("Users").get();

  snapshot.forEach((doc) => {
    console.log(doc.id, "=>", doc.data());
  });
  res.sendStatus(200);
});

import { Storage } from "@google-cloud/storage";

async function uploadFile(name, file) {
  await new Storage().bucket("markr-7d6ab").file(name).save(file);
}

app.post("/", multer().single("file"), function (req, res) {
  const originalName = req["file"].originalname;
  uploadFile(originalName, req["file"]);
  res.sendStatus(200);
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
