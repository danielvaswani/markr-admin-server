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
// app.use(express.json());
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
      // avi: "AVI",
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

enum ALLOWED_TYPES {
  font = "font",
  video = "video",
  image = "image",
  audio = "audio",
  text = "text",
  color = "color",
  unknown = "unknown",
}

interface Asset {
  content: FileAsset | TextAsset | ColorAsset;
  name: string;
  type: ALLOWED_TYPES;
}

interface FileAsset {
  format: string;
  url: string;
}

interface TextAsset {
  fontSize: number;
  fontName: string;
  textContent: string;
}

interface ColorAsset {
  red: number;
  green: number;
  blue: number;
  opacity: number;
  category: string;
}

function getAllTypes() {
  return ALLOWED_FORMATS.map((item) => item.type);
}

function getTypeFromFormat(format: string): ALLOWED_TYPES {
  let type = "unknown";
  ALLOWED_FORMATS.forEach((item) => {
    if (Object.keys(item.formats).includes(format)) {
      type = item.type;
    }
  });
  return ALLOWED_TYPES[type];
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

async function getBrandGuide(name) {
  const bgsRef = BGS_GALLERY_REF.doc(name);
  const bgsSnapshot = await bgsRef.get();

  const pagesSnapshot = await bgsRef.collection("Pages").get();
  const pages = [];

  pagesSnapshot.forEach((doc) => {
    pages.push(doc.data());
  });
  const bgsData = bgsSnapshot.data();
  bgsData.pages = pages;
  return bgsData;
}

async function addBrandGuideToDatabase(bgsName: string) {
  if (await hasBrandGuide(bgsName)) {
    return false;
  }
  BGS_GALLERY_REF.doc(bgsName).set({ name: bgsName });
  return true;
}

async function hasBrandGuide(bgsName) {
  return (await BGS_GALLERY_REF.doc(bgsName).get()).exists;
}

async function getPage(bgsName: string, pageName: string) {
  const pageRef = BGS_GALLERY_REF.doc(bgsName)
    .collection("Pages")
    .doc(pageName);
  const pageSnapshot = await pageRef.get();
  return pageSnapshot.data();
}

async function addPageToDatabase(bgsName: string, pageName: string) {
  const pageRef = BGS_GALLERY_REF.doc(bgsName)
    .collection("Pages")
    .doc(pageName);

  const newPageData = {
    name: pageName,
    containsDefaultFont: false,
    isCoreComponent: false,
    Assets: [],
  };

  return db.runTransaction((transaction) => {
    return transaction.get(pageRef).then((doc) => {
      if (!doc.exists) {
        transaction.create(pageRef, newPageData);
      }
    });
  });
}

async function getAssets(bgsName): Promise<Asset[]> {
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
  const type = getTypeFromFormat(fileNameSplit[1]);
  console.log(type);
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
    type: ALLOWED_TYPES[type],
  };
}

async function getFonts(bgsName) {
  const allAssets = await getAssets(bgsName);
  return allAssets.filter((asset) => asset.type === ALLOWED_TYPES.font);
}

function getFontCSS(fonts) {
  return fonts
    .map((font) => {
      const format =
        ' format("' + getFullFormat(font.content.format, "font") + '")';
      return `@font-face {
  font-family: '${font.name.split("-").join(" ")}';
  src: url(${font.content.url})${format};
}`;
    })
    .join("\n");
}

async function uploadFile(file) {
  const originalName = file.originalname;
  const blob = file.buffer;
  bucket.file(originalName).save(blob);
}

function removeSpaces(pathName) {
  return pathName.split("%20").join(" ");
}

app.get("/api/brandguides", async (req, res) => getBrandGuides(req, res));

app.get("/api/brandguides/:name/fonts", async (req, res) => {
  const fonts = Promise.all(await getFonts(removeSpaces(req.params.name))).then(
    (fonts) => {
      const fontsCss = getFontCSS(fonts);
      res.set("Content-Type", "text/css");
      res.send(fontsCss);
    }
  );
});

app.get("/api/brandguides/:name", async (req, res) => {
  res.set("Content-Type", "application/json");
  res.send(await getBrandGuide(removeSpaces(req.params.name)));
});

app.get("/api/brandguides/:bgsName/:pageName/", async (req, res) => {
  res.set("Content-Type", "application/json");
  res.send(
    await getPage(
      removeSpaces(req.params.bgsName),
      removeSpaces(req.params.pageName)
    )
  );
});

app.post("/api/brandguides/:bgsName/:pageName/", async (req, res) => {
  addPageToDatabase(
    removeSpaces(req.params.bgsName),
    removeSpaces(req.params.pageName)
  )
    .then(() => res.sendStatus(200))
    .catch(console.error);
});

app.post(
  "/api/brandguides/:bgsName/:pageName/upload/blob",
  multer().single("file"),
  async (req, res) => {
    const asset = createBlobAsset(req["file"].originalname);
    if (asset.type === ALLOWED_TYPES.unknown) {
      res.sendStatus(500);
      return;
    }
    uploadFile(req["file"])
      .then(() => {
        addAssetToDatabase(
          removeSpaces(req.params.bgsName),
          removeSpaces(req.params.pageName),
          asset
        )
          .then(() => res.sendStatus(200))
          // TODO DELETE FILE IN CATCH IF DB REFERENCE FAILED
          .catch(console.error);
      })
      .catch(console.error);
  }
);

app.post("/api/brandguides/:bgsName", async (req, res) => {
  const success = await addBrandGuideToDatabase(
    removeSpaces(req.params.bgsName)
  );
  res.sendStatus(success ? 200 : 400);
});

app.post(
  "/api/brandguides/:bgsName/:pageName/upload/",
  express.json(),
  async (req, res) => {
    addAssetToDatabase(
      removeSpaces(req.params.bgsName),
      removeSpaces(req.params.pageName),
      {
        content: req.body.content,
        name: req.body.name,
        type: req.body.type,
      }
    )
      .then(() => res.sendStatus(200))
      .catch(console.error);
  }
);

app.listen(PORT, () => {
  return console.log(`Express is listening at http://localhost:${PORT}`);
});

module.exports = app;
