# REST API example application

REST API Documentation example taken from https://github.com/bbc/REST-API-example

The entire application is contained within the `index.ts` file.

All routes are contained on one file due to Vercel requirements when using express js. If it is possible, a solution could not be found on their documentation. 

`vercel.json` is a config file to allow Vercel to host an express app as a serverless function.

## Install

    npm install

## Run the app

    npm start

# REST API

The REST API to the example app is described below.

The user is hardcoded and so all requests return data for a specific user, this can be extended in the future to allow multiple users.

DISCLAIMER: FILES UPLOADED ABOVE 5MB WILL FAIL

## Get list of all Brand Guide Systems

### Request

`GET /api/brandguides`

### Response

```json
[
    {
        "name": "Audi",
        "imageUrl": "https://www.teahub.io/photos/full/6-66951_wiki-free-audi-iphone-image-pic-wpc0010850-data.jpg",
        "subdomain": "audi"
    },
    {
        "subdomain": "johnniewalker",
        "imageUrl": "https://mir-s3-cdn-cf.behance.net/project_modules/disp/0cd84925304975.56343b9c7bf1c.jpg",
        "name": "Johnnie Walker"
    },
]

```


## Create a new Brand Guide System

### Request

`POST api/brandguides/:bgsName`

### Request body

```json
{
    "name": "Audi",
    "imageUrl": "https://www.teahub.io/photos/full/6-66951_wiki-free-audi-iphone-image-pic-wpc0010850-data.jpg",
    "subdomain": "audi"
 },

```

    You can choose to omit the imageUrl field 

### Response

    If succeeded it returns a 200 OK,  Otherwise 403 Forbidden

## Add/Update the Brand Guide System cover image

### Request

`PUT /api/brandguides/:bgsName/upload`

### Request body

    Accepts formdata, name should be "file" and value field should be the file you want to upload.
    
### Response 

    If succeeded it returns a 200 OK, it will fail and give a vercel error of "FUNCTION PAYLOAD TOO LARGE" if the file is over 5MB
    
## Add/Update a Brand Guide System field 

`PUT api/brandguides/:bgsName?field=:fieldName&value=:value`

### Request params

    :fieldName (I.E. subdomain, imageUrl, name, isLive) and :value (the string value you want to update/add to)
    
### Response

    If succeeded it returns a 200 OK
    
## Add/Update a Page field from a Brand Guide System 

`PUT api/brandguides/:bgsName/:pageName?field=:fieldName&value=:value`

### Request params

    :fieldName (I.E. containsDefaultFont, isCoreComponent, name) and :value (the string value you want to update/add to)
    
### Response

    If succeeded it returns a 200 OK
    
## Upload an Image Asset to a page

`POST /api/brandguides/:bgsName/:pageName/upload/image`


### Request 

    Accepts formdata, name should be "file" and value field should be the file you want to upload.
    
### Response 

    If succeeded it returns a 200 OK, it will fail and give a vercel error of "FUNCTION PAYLOAD TOO LARGE" if the file is over 5MB
    
## Upload other file asset to a page (I.E. fonts and videos)

`POST /api/brandguides/:bgsName/:pageName/upload/blob`


### Request 

    Accepts formdata, name should be "file" and value field should be the file you want to upload.
    
### Response 

    If succeeded it returns a 200 OK, it will fail and give a vercel error of "FUNCTION PAYLOAD TOO LARGE" if the file is over 5MB
    
## Create and Add a Page to a Brand Guide System

### Request

`POST /api/brandguides/:bgsName/:pageName`

### Response

    If succeeded it returns a 200 OK
    
    It initializes a page with an object body like below
    
```json
    {
      name: pageName,
      containsDefaultFont: false,
      isCoreComponent: false,
      Assets: [],
    }
```
## Get a single Page of a Brand Guide System

### Request

`GET /api/brandguides/:bgsName/:pageName`

### Response 

```json

{
    "Assets": [
        {
            "content": {
                "value": "'Oswald', sans-serif",
                "variant": "subtitle"
            },
            "name": "text7",
            "type": "text"
        },
        {
            "content": {
                "value": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.                              Ut enim ad minim veniam, qui",
                "variant": "paragraph"
            },
            "name": "text8",
            "type": "text"
        }
        ],
        "containsDefaultFont": false,
        "name": "Typography",
        "isCoreComponent": false
}
```

## Get all data of a Brand Guide System

### Request

`GET /api/brandguides/:bgsName`

### Response

```json
{
    "imageUrl": "https://mir-s3-cdn-cf.behance.net/project_modules/disp/0cd84925304975.56343b9c7bf1c.jpg",
    "subdomain": "johnniewalker",
    "name": "Johnnie Walker",
    "pages": [
        {
            "containsDefaultFont": false,
            "name": "About",
            "Assets": [
                {
                    "type": "text",
                    "name": "text1",
                    "content": {
                        "value": "Johnnie Walker wh...",
                        "variant": "paragraph"
                    }
                },
            ],
            "isCoreComponent": false
        },
        {
            "name": "Colors",
            "Assets": [
                {
                    "type": "color",
                    "name": "Primary Colors",
                    "content": {
                        "colors": [
                            {
                                "name": "SuperWhite",
                                "blue": 255,
                                "red": 255,
                                "green": 255
                            },
                            {
                                "name": "Light Grayish Yellow",
                                "green": 246,
```

## Get availability of a subdomain

### Request

`GET /api/brandguides/:bgsName?subdomain=true&nodata=true`

### Response

    if succeeded it returns a 200 OK, Otherwise a 404 Not Found

## Get all data for a Brand Guide System by subdomain (for markr-displayed-bgs)

### Request

`GET /api/brandguides/:bgsName?subdomain=true`

### Response

```json
{
    "imageUrl": "https://mir-s3-cdn-cf.behance.net/project_modules/disp/0cd84925304975.56343b9c7bf1c.jpg",
    "subdomain": "johnniewalker",
    "name": "Johnnie Walker",
    "pages": [
        {
            "containsDefaultFont": false,
            "name": "About",
            "Assets": [
                {
                    "type": "text",
                    "name": "text1",
                    "content": {
                        "value": "Johnnie Walker wh...",
                        "variant": "paragraph"
                    }
                },
            ],
            "isCoreComponent": false
        },
        {
            "name": "Colors",
            "Assets": [
                {
                    "type": "color",
                    "name": "Primary Colors",
                    "content": {
                        "colors": [
                            {
                                "name": "SuperWhite",
                                "blue": 255,
                                "red": 255,
                                "green": 255
                            },
                            {
                                "name": "Light Grayish Yellow",
                                "green": 246,
```


### Get Font CSS for a Brand Guide System

`GET /api/brandguides/:bgsName/fonts`

### Response

```css
    
@font-face {
  font-family: 'Gilroy ExtraBold';
  src: url(https://firebasestorage.googleapis.com/v0/b/markr-7d6ab.appspot.com/o/Gilroy-ExtraBold.otf?alt=media) format("opentype");
  }
@font-face {
  font-family: 'Gilroy Light';
  src: url(https://firebasestorage.googleapis.com/v0/b/markr-7d6ab.appspot.com/o/Gilroy-Light.otf?alt=media) format("opentype");
  }
    
```

## Update an asset in a Page of a Brand Guide System by its index on the page

### Request

`PUT /api/brandguides/:bgsName/:pageName/:assetIndex`

### Request body

```json
{
  content: {
    variant: "subtitle",
    value: "The quick brown fox jumps over the lazy dog"
  },
  name: "text1",
  type: "text"
}
```
    All asset types need a content: any, name: String, and type: String
### Response
    
    If succeeded it returns a 200 OK, Otherwise a 403 Forbidden


## Delete a Brand Guide System

    NOT IMPLEMENTED 
    
## Delete a Page from a Brand Guide System

    NOT IMPLEMENTED
    
    
## Delete an Asset in a Page by index

    NOT IMPLEMENTED
