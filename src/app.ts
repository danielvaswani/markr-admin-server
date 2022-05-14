import express from "express";
import multer from "multer";
import "dotenv/config";

import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import admin from "firebase-admin";
// import { uploadBytes, ref } from "firebase/storage";
import { getStorage } from "firebase-admin/storage";

const firebaseApp = initializeApp({
  credential: admin.credential.cert({
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    projectId: process.env.FIREBASE_PROJECT_ID,
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const PORT = 3000;
const USER_DOCUMENT_ID = "XI3pHNcWUMDUuDcGlBpA";

const app = express();
const db = getFirestore();
const bucket = getStorage().bucket();

const bgsGalleryRef = db
  .collection("Users")
  .doc(USER_DOCUMENT_ID)
  .collection("BGSs");

async function getBrandGuides(req, res) {
  const bgsGallerySnapshot = await bgsGalleryRef.get();
  const bgsGallery = [];

  bgsGallerySnapshot.forEach((doc) => {
    let data = doc.data();
    bgsGallery.push(data);
  });
  res.send(bgsGallery);
}

async function getBrandGuide(req, res) {
  const name = req.params.name.split("%20").join(" ");
  const bgsRef = await bgsGalleryRef.doc(name);
  const bgsSnapshot = await bgsRef.get();

  const pagesSnapshot = await bgsRef.collection("Pages").get();
  const pages = [];

  pagesSnapshot.forEach((doc) => {
    pages.push(doc.data());
  });
  const bgsData = bgsSnapshot.data();
  bgsData.pages = pages;

  res.send(bgsData);
}

async function uploadFile(req, res) {
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
}

app.get("/brandguides", async (req, res) => {
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
});

app.get("/brandguides/:name", async (req, res) => getBrandGuide(req, res));

app.post("/upload", multer().single("file"), async (req, res) =>
  uploadFile(req, res)
);

app.listen(PORT, () => {
  return console.log(`Express is listening at http://localhost:${PORT}`);
});

module.exports = app;
