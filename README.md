# REST API example application

REST API Documentation example taken from https://github.com/bbc/REST-API-example

The entire application is contained within the `index.ts` file.

`vercel.json` is a config file to allow Vercel to host an express app as a serverless function.

X

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
    
## Add/Update a Brand Guide field 

`POST api/brandguides/:bgsName?field=:fieldName&value=:value`

### Request params

    :fieldName (I.E. subdomain, imageUrl, name, isLive) and :value (the string value you want to update/add to)
    
### Response

    If succeeded it returns a 200 OK
    
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

## Get all data of a Brand Guide System

### Request

`GET /api/brandguides/:bgsName`

### Response

    HTTP/1.1 201 Created
    Date: Thu, 24 Feb 2011 12:36:31 GMT
    Status: 201 Created
    Connection: close
    Content-Type: application/json
    Location: /thing/2
    Content-Length: 35

    {"id":2,"name":"Bar","status":null}

## Get list of Things again

### Request

`GET /thing/`

    curl -i -H 'Accept: application/json' http://localhost:7000/thing/

### Response

    HTTP/1.1 200 OK
    Date: Thu, 24 Feb 2011 12:36:31 GMT
    Status: 200 OK
    Connection: close
    Content-Type: application/json
    Content-Length: 74

    [{"id":1,"name":"Foo","status":"new"},{"id":2,"name":"Bar","status":null}]

## Change a Thing's state

### Request

`PUT /thing/:id/status/changed`

    curl -i -H 'Accept: application/json' -X PUT http://localhost:7000/thing/1/status/changed

### Response

    HTTP/1.1 200 OK
    Date: Thu, 24 Feb 2011 12:36:31 GMT
    Status: 200 OK
    Connection: close
    Content-Type: application/json
    Content-Length: 40

    {"id":1,"name":"Foo","status":"changed"}

## Get changed Thing

### Request

`GET /thing/id`

    curl -i -H 'Accept: application/json' http://localhost:7000/thing/1

### Response

    HTTP/1.1 200 OK
    Date: Thu, 24 Feb 2011 12:36:31 GMT
    Status: 200 OK
    Connection: close
    Content-Type: application/json
    Content-Length: 40

    {"id":1,"name":"Foo","status":"changed"}

## Change a Thing

### Request

`PUT /thing/:id`

    curl -i -H 'Accept: application/json' -X PUT -d 'name=Foo&status=changed2' http://localhost:7000/thing/1

### Response

    HTTP/1.1 200 OK
    Date: Thu, 24 Feb 2011 12:36:31 GMT
    Status: 200 OK
    Connection: close
    Content-Type: application/json
    Content-Length: 41

    {"id":1,"name":"Foo","status":"changed2"}

## Attempt to change a Thing using partial params

### Request

`PUT /thing/:id`

    curl -i -H 'Accept: application/json' -X PUT -d 'status=changed3' http://localhost:7000/thing/1

### Response

    HTTP/1.1 200 OK
    Date: Thu, 24 Feb 2011 12:36:32 GMT
    Status: 200 OK
    Connection: close
    Content-Type: application/json
    Content-Length: 41

    {"id":1,"name":"Foo","status":"changed3"}

## Attempt to change a Thing using invalid params

### Request

`PUT /thing/:id`

    curl -i -H 'Accept: application/json' -X PUT -d 'id=99&status=changed4' http://localhost:7000/thing/1

### Response

    HTTP/1.1 200 OK
    Date: Thu, 24 Feb 2011 12:36:32 GMT
    Status: 200 OK
    Connection: close
    Content-Type: application/json
    Content-Length: 41

    {"id":1,"name":"Foo","status":"changed4"}

## Change a Thing using the _method hack

### Request

`POST /thing/:id?_method=POST`

    curl -i -H 'Accept: application/json' -X POST -d 'name=Baz&_method=PUT' http://localhost:7000/thing/1

### Response

    HTTP/1.1 200 OK
    Date: Thu, 24 Feb 2011 12:36:32 GMT
    Status: 200 OK
    Connection: close
    Content-Type: application/json
    Content-Length: 41

    {"id":1,"name":"Baz","status":"changed4"}

## Change a Thing using the _method hack in the url

### Request

`POST /thing/:id?_method=POST`

    curl -i -H 'Accept: application/json' -X POST -d 'name=Qux' http://localhost:7000/thing/1?_method=PUT

### Response

    HTTP/1.1 404 Not Found
    Date: Thu, 24 Feb 2011 12:36:32 GMT
    Status: 404 Not Found
    Connection: close
    Content-Type: text/html;charset=utf-8
    Content-Length: 35

    {"status":404,"reason":"Not found"}

## Delete a Thing

### Request

`DELETE /thing/id`

    curl -i -H 'Accept: application/json' -X DELETE http://localhost:7000/thing/1/

### Response

    HTTP/1.1 204 No Content
    Date: Thu, 24 Feb 2011 12:36:32 GMT
    Status: 204 No Content
    Connection: close


## Try to delete same Thing again

### Request

`DELETE /thing/id`

    curl -i -H 'Accept: application/json' -X DELETE http://localhost:7000/thing/1/

### Response

    HTTP/1.1 404 Not Found
    Date: Thu, 24 Feb 2011 12:36:32 GMT
    Status: 404 Not Found
    Connection: close
    Content-Type: application/json
    Content-Length: 35

    {"status":404,"reason":"Not found"}

## Get deleted Thing

### Request

`GET /thing/1`

    curl -i -H 'Accept: application/json' http://localhost:7000/thing/1

### Response

    HTTP/1.1 404 Not Found
    Date: Thu, 24 Feb 2011 12:36:33 GMT
    Status: 404 Not Found
    Connection: close
    Content-Type: application/json
    Content-Length: 35

    {"status":404,"reason":"Not found"}

## Delete a Thing using the _method hack

### Request

`DELETE /thing/id`

    curl -i -H 'Accept: application/json' -X POST -d'_method=DELETE' http://localhost:7000/thing/2/

### Response

    HTTP/1.1 204 No Content
    Date: Thu, 24 Feb 2011 12:36:33 GMT
    Status: 204 No Content
    Connection: close


