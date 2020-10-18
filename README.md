polymorphic-request
===================

use your spiffy new network request library, but continue to have a working `request` interface for compatibility. No dependencies.

Ding Dong! [The witch is dead](https://github.com/request/request/issues/3142)! All hail the glorious new day, which will all lead us to use a common interface, creating library consistency and reduced bundle sizes everywhere! And that interface is: [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), no... wait... [Axios](https://github.com/axios/axios) err... um...

The main lesson I've taken away from this deprecation in favor of the "next-gen" is request is an excellent interface, stable, uniform and in 2020.... dead as a doornail.

Still, writing test suits for the backend in fetch leads huge blocks of promise boilerplate for anything but the simplest of cases and still leaves plenty of room for devs to not be using their preferred solution. Due to the time scales of network requests, indirection overhead is no big deal, but there's a lack of uniformity of interface, and extra warts everywhere for no marginal benefit. The main argument for it being it's "compatibility" between client and server; told by people who believe it's not "best practice" to write cross compatible modules. It's bikeshedding, just like promises (how many codebases have been refactored for the aesthetics of people who principally enjoy other languages?).

This is where polymorphic-request comes in. Put it in place and the frontend guys can use lib A the backend guys can use lib B and modules that run in both places use a request syntax, allowing pluggable libs (as long as your use cases aren't too much of an edge case) everywhere. The only supported syntaxes are in the [Test Suite](test/test.js) so please check these use cases before using and, should you need more, we accept PRs.

In addition it enables some development features for writing tests, allowing simple mocking of an external system, without network requests, keeping test suites fast and lean and giving you an easy mechanism to capture and prevent regressions.

Install
-------

    npm install polymorphic-request

Fetch Usage
-----------

Supports:

- [node-fetch](https://www.npmjs.com/package/node-fetch)
- [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

### ES5 Node.js

    var fetch = require('node-fetch');
    var formData = require('form-data')
    var request = require('polymorphic-request').fetch(fetch, formData);

### ES5 Browser (Webpack/Browserify)

    var request = require('polymorphic-request').fetch(Fetch, FormData);

### ES6 Node.js

    import poly from "polymorphic-request/implementations/node-fetch";
    import fetch from "node-fetch";
    import formData from "form-data";
    const request = poly(fetch, formData);

### ES6 Browser (Via Babel)

    import poly from "polymorphic-request/implementations/node-fetch";
    import fetch from "node-fetch";
    import formData from "form-data";
    const request = poly(fetch, formData);

Axios Usage
-----------

Supports:

- [axios](https://github.com/axios/axios)

### ES5 Node.js

    var axios = require('axios');
    var formData = require('form-data')
    var request = require('polymorphic-request').axios(axios, formData);

### ES5 Browser (Webpack/Browserify)

    var axios = require('axios');
    var request = require('polymorphic-request').axios(axios, FormData);

### ES6 Node.js

    import poly from "polymorphic-request/implementations/axios";
    import axios from "axios";
    import formData from "form-data";
    const request = poly(axios, formData);

### ES6 Browser (Via Babel)

    import poly from "polymorphic-request/implementations/axios";
    import axios from "axios";
    import formData from "form-data";
    const request = poly(axios, formData);

request Usage
-------------

Supports:

- [request](https://www.npmjs.com/package/request) [DEPRECATED]
- [postman-request](https://www.npmjs.com/package/postman-request)
- [browser-request](https://www.npmjs.com/package/browser-request) [DEPRECATED]

### ES5 Node.js

    var request = require('request');
    var formData = require('form-data');
    var request = require('polymorphic-request').request(request, formData);

### ES5 Browser (Webpack/Browserify)

    var request = require('request');
    request = require('polymorphic-request').request(request, FormData);

### ES6 Node.js

    import poly from "polymorphic-request/implementations/request";
    import requestLib from "request";
    import formData from "form-data";
    const request = poly(requestLib, formData);

### ES6 Browser (Via Babel)

    import poly from "polymorphic-request/implementations/request";
    import requestLib from "request";
    import formData from "form-data";
    const request = poly(requestLib, formData);

Testing Extensions[TBD]
------------------

`var testRequest = request.testing(<instance>)` //return an instance of request with testing features

`testRequest.mock(<url or selectorFn>, <[err, res, data]>)` //hardcode specific request configs

`testRequest.record(<handlerFn or dirPath>)` //record requests

`testRequest.events()[TBD]` //event control, first ref causes event prop

`testRequest.stats()[TBD]` //returns current stats, first ref activates

Writing Test Suites that support many request libraries (in Mocha)
------------------------------------------------------------------

```js
    // before you start, install your dev-dependencies:
    // node-fetch, request, axios, form-data, express & polymorhpic-request

    //include some dependencies
    var poly = require('polymorhpic-request');
    var util = require('polymorhpic-request/util');

    //setup some variables
    var supportedModules = ['node-fetch', 'request', 'axios'];
    var testPort = 8081;
    var makeRequestFunction = util.makeRequestFunctionGenerator(
        supportedModules,
        { formData : require('form-data') }, 
        poly
    );
    var testRoot = 'http://localhost:'+testPort;

    describe('my-awesome-module', function(){
        supportedModules.forEach(function(moduleName){
            describe('uses the '+moduleName+' module', function(){
                var server;
                var getRequest = makeRequestFunction(moduleName);

                before(function(done){
                    server = util.makeServer(done, require('express'), testPort);
                });


                it('does something with the module', function(done){
                    var request = getRequest();
                    request = poly.testing(request);
                    //do your stuff
                });

                //more tests here


                after(function(done){
                    server.close(function(){
                        done();
                    });
                });
            });
        });
    });

```

This gives you a uniform suite executing across all fetch methods, and if you are writing a library you want to be compatible with many methods you'd set on your library at runtime with `instance.setRequest('axios', axios)` which you implement yourself as part of your library's API.

Testing
------------

    mocha
