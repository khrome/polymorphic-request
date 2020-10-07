polymorphic-request
===================

use your spiffy new network request library, but continue to have a working `request` interface for compatibility. No dependencies.

Ding Dong! [The witch is dead](https://github.com/request/request/issues/3142)! All hail the glorious new day, which will all lead us to use a common interface, creating library consistency and reduced bundle sizes everywhere! And that interface is: Fetch, no... wait... Axios err... um...

The main lesson I've taken away from this deprecation in favor of the "next-gen" is request is an excellent interface, stable, uniform and in 2020.... dead as a doornail.

Still, writing test suits for the backend in fetch leads huge blocks of promise boilerplate for anything but the simplest of cases. Due to the time scales of network requests, promise overhead is no big deal, but there's a lack of uniformity of interface, extra warts everywhere for no marginal benefit. The main argument for it being it's "compatibility" between client and server; told by people who believe it's not "best practice" to write cross compatible modules. It's bikeshedding, just like promises (how many codebases have been refactored for the aesthetics of people who principally enjoy other languages?).

This is where polymorphic-request comes in. Put it in place and the frontend guys can use lib A the backend guys can use lib B and modules that run in both places use a request syntax, allowing pluggable libs (as long as your use cases aren't too much of an edge case) everywhere. The only supported syntaxes are in the [Test Suite](test/test.js) so please check these use cases before using and, should you need more, we accept PRs.

In addition it enables some development features for writing tests, allowing simple mocking of an external system, without network requests, keeping test suites fast and lean and giving you an easy mechanism to capture and prevent regressions.

Install
-------

    npm install polymorphic-request

Fetch Usage
-----------

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

### ES5 Node.js

    var axios = require('axios');
    var formData = require('form-data')
    var request = require('polymorphic-request').fetch(axios, formData);

### ES5 Browser (Webpack/Browserify)

    var request = require('polymorphic-request').fetch(axios, FormData);

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

Testing Extensions[TBD]
------------------

`request.testing()` //return an instance of request with testing features

`request.mock(<url>, [<filter>], <result>)` //hardcode specific request configs

`request.events()` //event control, first ref causes event prop

`request.stats()` //returns current stats, first ref activates

Testing
------------

    mocha
