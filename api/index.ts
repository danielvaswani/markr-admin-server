import express from "express";
import multer from "multer";
import "dotenv/config";

import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import admin from "firebase-admin";
// import { uploadBytes, ref } from "firebase/storage";
import { getStorage } from "firebase-admin/storage";

const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
const firebaseApp = initializeApp({
  credential: cert(firebaseConfig),
  storageBucket: process.env.STORAGE_BUCKET,
});

const PORT = 3000;
const USER_DOCUMENT_ID = "XI3pHNcWUMDUuDcGlBpA";

const app = express();
app.use(express.json());
const db = getFirestore();
const bucket = getStorage().bucket();

const BGS_GALLERY_REF = db
  .collection("Users")
  .doc(USER_DOCUMENT_ID)
  .collection("BGSs");

const ALLOWED_FORMATS = [
  {
    type: "font",
    formats: {
      otf: "opentype",
      ttf: "truetype",
      woff: "woff",
      woff2: "woff2",
    },
  },
  {
    type: "image",
    formats: {
      jpg: "JPEG",
      svg: "SVG",
      png: "PNG",
    },
  },
  {
    type: "video",
    formats: {
      mp4: "MP4",
      mpg: "MPEG",
      avi: "AVI",
      webm: "WEBM",
    },
  },
  {
    type: "audio",
    formats: {
      mp3: "MP3",
      wav: "WAV",
      ogg: "Ogg",
    },
  },
];

function getTypeFromFormat(format) {
  ALLOWED_FORMATS.forEach((item) => {
    if (format in item.formats) {
      return item.type;
    }
  });
  return "unknown";
}

function getFullFormat(format, type) {
  const fullFormat = ALLOWED_FORMATS.filter((item) => item.type == type)[0]
    .formats[format];
  return fullFormat;
}

async function getBrandGuides(req, res) {
  const bgsGallerySnapshot = await BGS_GALLERY_REF.get();
  const bgsGallery = [];

  bgsGallerySnapshot.forEach((doc) => {
    const data = doc.data();
    bgsGallery.push(data);
  });
  res.send(bgsGallery);
}

async function getBrandGuide(req, res) {
  const name = req.params.name.split("%20").join(" ");
  const bgsRef = await BGS_GALLERY_REF.doc(name);
  const bgsSnapshot = await bgsRef.get();

  const pagesSnapshot = await bgsRef.collection("Pages").get();
  const pages = [];

  pagesSnapshot.forEach((doc) => {
    pages.push(doc.data());
  });
  const bgsData = bgsSnapshot.data();
  bgsData.pages = pages;
  res.setHeader("Content-Type", "application/json");
  res.send(bgsData);
}

interface Asset {
  content: any;
  name: string;
  type: string;
}

async function getAssets(bgsName) {
  const pagesRef = BGS_GALLERY_REF.doc(bgsName).collection("Pages");
  const snapshot = await pagesRef.get();
  const allAssets = [];
  snapshot.forEach((doc) => {
    console.log(doc.id, "=>", doc.data().Assets);
    allAssets.push(...doc.data().Assets);
  });
  return allAssets;
}

async function addAssetToDatabase(
  bgsName: string,
  pageName: string,
  asset: Asset
) {
  const assetRef = BGS_GALLERY_REF.doc(bgsName)
    .collection("Pages")
    .doc(pageName);

  //add item to assets array inside, merge = true
  return await assetRef.update({
    Assets: FieldValue.arrayUnion(asset),
  });
}

function createBlobAsset(fileName): Asset {
  const fileNameSplit = fileName.split(".");
  return {
    content: {
      format: fileNameSplit[1],
      url:
        "https://firebasestorage.googleapis.com/v0/b/" +
        process.env.STORAGE_BUCKET +
        "/o/" +
        fileName +
        "?alt=media",
    },
    name: fileNameSplit[0],
    type: getTypeFromFormat(fileNameSplit[1]),
  };
}

    })

async function uploadFile(file) {
  const originalName = file.originalname;
  const blob = file.buffer;
  bucket.file(originalName).save(blob);
}

app.get("/api/brandguides", async (req, res) => {
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
  const bgsGallerySnapshot = await bgsGalleryRef.get();
  const bgsGallery = [];

  bgsGallerySnapshot.forEach((doc) => {
    let data = doc.data();
    bgsGallery.push(data);
  });
  res.send(bgsGallery);
});

app.get("/api/hello", (req, res) => res.send("Hello world"));

app.get("/api/brandguides/:name", async (req, res) => getBrandGuide(req, res));

app.post(
  "/api/brandguides/:bgsName/:pageName/upload/blob",
  multer().single("file"),
  async (req, res) => {
    uploadFile(req["file"])
      .then(() => {
        addAssetToDatabase(
          req.params.bgsName,
          req.params.pageName,
          createBlobAsset(req["file"].originalname)
        )
          .then(() => res.sendStatus(200))
          // TODO DELETE FILE IN CATCH IF DB REFERENCE FAILED
          .catch(console.error);
      })
      .catch(console.error);
  }
);

app.post("/api/brandguides/:bgsName/:pageName/upload/", async (req, res) => {
  addAssetToDatabase(req.params.bgsName, req.params.pageName, {
    content: req.body.content,
    name: req.body.name,
    type: req.body.type,
  })
    .then(() => res.sendStatus(200))
    .catch(console.error);
});

app.listen(PORT, () => {
  return console.log(`Express is listening at http://localhost:${PORT}`);
});

module.exports = app;
