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

const PORT = 3001;
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
  {
    type: "iframe",
    formats: {
      vimeo: "vimeo",
      youtube: "youtube",
      other: "other",
    },
  },
  {
    type: "text",
    formats: {
      subtitle: "subtitle",
      paragraph: "paragraph",
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
  iframe = "iframe",
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
  variant?: string;
}

interface TextAsset {
  fontSize: number;
  fontName: string;
  textContent: string;
}

interface ColorPaletteAsset {
  colors: ColorAsset[];
}

interface ColorAsset {
  red: number;
  green: number;
  blue: number;
  opacity: number;
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

async function getBrandGuides() {
  const bgsGallerySnapshot = await BGS_GALLERY_REF.get();
  const bgsGallery = [];
  try {
    bgsGallerySnapshot.forEach((doc) => {
      const data = doc.data();
      bgsGallery.push(data);
    });
  } catch (error) {
    console.log(error);
  }
  bgsGallery.sort((bgs1, bgs2) =>
    bgs1.name > bgs2.name ? 1 : bgs2.name > bgs1.name ? -1 : 0
  );
  return bgsGallery;
}

async function getBrandGuide(name, isSubdomain) {
  let bgsName = name;
  if (isSubdomain) bgsName = await getBrandGuideNameFromSubdomain(name);

  if (bgsName === "") return;

  const bgsRef = BGS_GALLERY_REF.doc(bgsName);
  const bgsSnapshot = await bgsRef.get();

  const pagesSnapshot = await bgsRef.collection("Pages").get();
  const pages = [];

  pagesSnapshot.forEach((doc) => {
    pages.push(doc.data());
  });

  console.log(JSON.parse(JSON.stringify(bgsSnapshot.data())));
  const bgsData = JSON.parse(JSON.stringify(bgsSnapshot.data()));
  bgsData.pages = pages;
  return bgsData;
}

async function getBrandGuideNameFromSubdomain(subdomain) {
  try {
    return await (
      await BGS_GALLERY_REF.where("subdomain", "==", subdomain).get()
    ).docs[0].data().name;
  } catch (error) {
    console.log(error);
  }
  return "";
}

async function addBrandGuideToDatabase(bgsName: string, body: any) {
  if (await hasBrandGuide(bgsName)) {
    return;
  }
  await BGS_GALLERY_REF.doc(bgsName).set(body);
  return getBrandGuide(bgsName, false);
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
    const data = doc.data();
    console.log(doc.id, "=>", data.Assets);
    let assetData = [...data.Assets];
    const pageName = data.name;
    assetData.forEach((item) => Object.assign(item, pageName));
    allAssets.push(assetData);
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
      url: getStorageURL(fileName),
    },
    name: fileNameSplit[0],
    type: ALLOWED_TYPES[type],
  };
}

function getStorageURL(fileName: string): string {
  return (
    "https://firebasestorage.googleapis.com/v0/b/" +
    process.env.STORAGE_BUCKET +
    "/o/" +
    fileName +
    "?alt=media"
  );
}

async function getFonts(bgsName) {
  // const allAssets = await getAssets(bgsName);
  // return allAssets.filter((asset) => asset.type === ALLOWED_TYPES.font);
  const bgsRef = (await BGS_GALLERY_REF.doc(bgsName).get()).data().fonts;
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

app.get("/api/brandguides", async (req, res) =>
  res.send(await getBrandGuides())
);

app.get("/api/brandguides/:name/fonts", async (req, res) => {
  const format = req.query.format;
  const fonts = await getFonts(removeSpaces(req.params.name)).then((fonts) => {
    const fontsCss = getFontCSS(fonts);
    res.set("Content-Type", "text/css");
    res.send(fontsCss);
  });
});

app.get("/api/brandguides/:name", async (req, res) => {
  const isSubdomain = req.query.subdomain === "true";
  const nodata = req.query.nodata === "true";
  if (isSubdomain && nodata) {
    res.sendStatus(
      (await getBrandGuideNameFromSubdomain(removeSpaces(req.params.name))) ===
        ""
        ? 404
        : 200
    );
  } else {
    res.set("Content-Type", "application/json");
    const brandGuide = await getBrandGuide(
      removeSpaces(req.params.name),
      isSubdomain
    );
    brandGuide !== undefined ? res.send(brandGuide) : res.sendStatus(404);
  }
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

app.post(
  "/api/brandguides/:bgsName/:pageName/upload/image",
  multer().single("file"),
  async (req, res) => {
    const variant = req.query.variant;
    const asset = createImageAsset(req["file"].originalname, variant);
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

function createImageAsset(fileName, variant): Asset {
  const fileNameSplit = fileName.split(".");
  const type = getTypeFromFormat(fileNameSplit[1]);
  console.log(type);
  return {
    content: {
      variant: variant,
      format: fileNameSplit[1],
      url: getStorageURL(fileName),
    },
    name: fileNameSplit[0],
    type: ALLOWED_TYPES[type],
  };
}

app.post("/api/brandguides/:bgsName", express.json(), async (req, res) => {
  const response = await addBrandGuideToDatabase(
    removeSpaces(req.params.bgsName),
    req.body
  );
  if (response) {
    res.send(response);
  } else {
    res.sendStatus(403);
  }
});

app.post(
  "/api/brandguides/:bgsName/:pageName/upload",
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

app.put("/api/brandguides/:bgsName", async (req, res) => {
  const bgsName = req.params.bgsName;
  const field = req.query.field;
  const toValue = req.query.toValue;
  updateBrandGuideField(bgsName, field, toValue);
  res.sendStatus(200);
});

function updateBrandGuideField(
  bgsName: string,
  field: string | import("qs").ParsedQs | string[] | import("qs").ParsedQs[],
  toValue: string | import("qs").ParsedQs | string[] | import("qs").ParsedQs[]
) {
  // if name is in update, get old index and data, add new doc with new doc id and name, changeName()
  // if index get item in other index first, maybe changeIndex()
  const bgsRef = BGS_GALLERY_REF.doc(bgsName);
  const updateObject = {};
  updateObject[field.toString()] = toValue;
  bgsRef.update(updateObject);
}

function updateBrandGuideImage(bgsName: string, image: any) {
  // upload file with uploadFile
  // add ref to db with updateBrandGuideField
  console.log(`type of image is ${typeof image}`);
  console.log(image);
  uploadFile(image).then(() => {
    updateBrandGuideField(
      bgsName,
      "imageUrl",
      getStorageURL(image.originalname)
    );
  });
}

app.put(
  "/api/brandguides/:bgsName/upload",
  multer().single("file"),
  async (req, res) => {
    updateBrandGuideImage(removeSpaces(req.params.bgsName), req["file"]);
    res.sendStatus(200);
  }
);

app.put("/api/brandguides/:bgsName/:pageName", async (req, res) => {
  const bgsName = req.params.bgsName;
  const pageName = req.params.pageName;
  const field = req.query.field;
  const toValue = req.query.toValue;
  updatePageField(bgsName, pageName, field, toValue);
  res.sendStatus(200);
});

function updatePageField(
  bgsName: string,
  pageName: string,
  field: string | import("qs").ParsedQs | string[] | import("qs").ParsedQs[],
  toValue: string | import("qs").ParsedQs | string[] | import("qs").ParsedQs[]
) {
  // if name is in update, get old index and data, add new doc with new doc id and name, changeName()
  // if index get item in other index first, maybe changeIndex()
  const pageRef = BGS_GALLERY_REF.doc(bgsName)
    .collection("Pages")
    .doc(pageName);
  const updateObject = {};
  updateObject[field.toString()] = toValue;
  pageRef.update(updateObject);
}

app.put("/api/brandguides/:bgsName/:pageName/:assetIndex", async (req, res) => {
  const bgsName = req.params.bgsName;
  const pageName = req.params.pageName;
  const assetIndex = req.params.assetIndex;
  const asset = req.body;
  try {
    updateAsset(
      removeSpaces(bgsName),
      removeSpaces(pageName),
      assetIndex,
      asset
    );
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(403);
  }
});

async function updateAsset(
  bgsName: string,
  pageName: string,
  assetIndex: string,
  body: Asset
) {
  const pageRef = BGS_GALLERY_REF.doc(bgsName)
    .collection("Pages")
    .doc(pageName);
  const doc = await pageRef.get();
  if (!doc.exists) {
    return;
  }

  let assets = await doc.data().Assets;
  assets[assetIndex] = body;

  const res = await pageRef.update({
    Assets: assets,
  });
}

// app.delete("/api/brandguides/:bgsName", async (req, res) => {});

// app.delete("/api/brandguides/:bgsName/:pageName", async (req, res) => {});

// app.delete(
//   "/api/brandguides/:bgsName/:pageName/:assetIndex",
//   async (req, res) => {}
// );

app.listen(PORT, () => {
  return console.log(`Express is listening at http://localhost:${PORT}`);
});

module.exports = app;
