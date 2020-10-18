var chai = require('chai');
chai.use(require('chai-fs'));
var should = chai.should();
var fs = require('fs');
var poly = require('../request');
var util = require('../util');
var express = require('express');

//WTF is this stupidity mocha?!?! I predicted this trashpile.
let unhandledRejectionExitCode = 0;

process.on("unhandledRejection", function(reason){
    //console.log("unhandled rejection:", reason);
    unhandledRejectionExitCode = 1;
    throw reason;
});

var supportedModules = ['node-fetch', 'request', 'axios'];
var testPort = 8081;
var makeRequestFunction = util.makeRequestFunctionGenerator(supportedModules, {
    formData : require('form-data')
}, poly);
var testRoot = 'http://localhost:'+testPort;

var head = function(headers, header){
    return headers[header] || headers[header.toLowerCase()];
}

describe('polymorphic-request', function(){
    supportedModules.forEach(function(moduleName){
        describe('uses the '+moduleName+' module', function(){
            var server;
            var getRequest = makeRequestFunction(moduleName);

            before(function(done){
                server = util.makeServer(done, require('express'), testPort);
            });

            it('loads without error', function(){
                var request = getRequest();
            });

            it('requests a text document as a string with a callback', function(done){
                var request = getRequest();
                request(testRoot+'/test.txt', function(err, req, data){
                    if(err) throw err;
                    should.exist(req);
                    should.exist(data);
                    (typeof req).should.equal('object');
                    (typeof data).should.equal('string');
                    done();
                });
            });

            it('requests a text document as a uri with a callback', function(done){
                var request = getRequest();
                request({
                    uri:testRoot+'/test.txt'
                }, function(err, req, data){
                    if(err) throw err;
                    should.exist(req);
                    should.exist(data);
                    (typeof req).should.equal('object');
                    (typeof data).should.equal('string');
                    done();
                });
            });

            it('request with string + pipe', function(done){
                var request = getRequest();
                var stream = require('stream');
                var echoStream = new stream.Writable();
                var result = '';
                echoStream._write = function(chunk, encoding, complete){
                  result += chunk.toString();
                  complete();
                };
                echoStream.on('finish', function(){
                    done();
                });
                request(testRoot+'/test.txt').pipe(echoStream);
            });

            it('explicit get request with string + callback', function(done){
                var request = getRequest();
                request.get(testRoot+'/test.txt', function(err, req, data){
                    if(err) throw err;
                    should.exist(req);
                    should.exist(data);
                    (typeof req).should.equal('object');
                    (typeof data).should.equal('string');
                    done();
                });
            });

            it('explicit post request with uri + callback', function(done){
                var request = getRequest();
                request.post({
                    uri: testRoot+'/mirror',
                    json : {
                        some : 'data'
                    }
                }, function(err, req, data){
                    if(err) throw err;
                    should.exist(req);
                    should.exist(data);
                    (typeof req).should.equal('object');
                    (typeof data).should.equal('object');
                    should.exist(data.headers);
                    (typeof data.headers).should.equal('object');
                    should.exist(head(data.headers, 'Content-Type'));
                    head(data.headers, 'Content-Type').should.equal('application/json')
                    done();
                });
            });

            after(function(done){
                server.close(function(){
                    done();
                });
            });
        });
    });

    supportedModules.forEach(function(moduleName){
        describe('uses a test instance with '+moduleName, function(){
            var server;
            var getRequest = makeRequestFunction(moduleName);

            before(function(done){
                server = util.makeServer(done, require('express'), testPort);
            });

            it('request can still perform a fetch wrapped', function(done){
                var request = getRequest();
                var wrapped = poly.testing(request)
                wrapped({
                    uri: testRoot+'/mirror'
                }, function(err, req, data){
                    should.not.exist(err);
                    done();
                });
            });

            it('request can still perform a post shortcut wrapped', function(done){
                var request = getRequest();
                var wrapped = poly.testing(request)
                wrapped.post({
                    uri: testRoot+'/mirror',
                    json : {
                        some : 'data'
                    }
                }, function(err, req, data){
                    if(err) throw err;
                    should.exist(req);
                    should.exist(data);
                    (typeof req).should.equal('object');
                    (typeof data).should.equal('object');
                    should.exist(data.headers);
                    (typeof data.headers).should.equal('object');
                    should.exist(head(data.headers, 'Content-Type'));
                    head(data.headers, 'Content-Type').should.equal('application/json');
                    done();
                });
            });

            it('can override a specific URL', function(done){
                var request = getRequest();
                var wrapped = poly.testing(request);
                wrapped.mock(testRoot+'/mirror', [
                    null,
                    {},
                    Buffer.from('just a test')]);
                wrapped.callCount.should.equal(0);
                wrapped({
                    uri: testRoot+'/mirror'
                }, function(err, req, data){
                    should.not.exist(err);
                    wrapped.callCount.should.equal(1);
                    wrapped.callthruCount.should.equal(0);
                    data.toString().should.equal('just a test')
                    done();
                });
            });

            it('can record a specific URL', function(done){
                //this.timeout(5000);
                var request = getRequest();
                var wrapped = poly.testing(request);
                var thisHash;
                wrapped.record('./test/data/', function(name){
                    thisHash = name;
                });
                //todo: make the hash dynamic
                wrapped({
                    uri: testRoot+'/mirror'
                }, function(err, req, data){
                    var fileName = './test/data/'+thisHash;
                    should.not.exist(err);
                    setTimeout(function(){
                        fileName.should.be.a.path();
                        fileName.should.be.a.file().with.json;
                        fs.unlink(fileName, function(){
                            fileName.should.not.be.a.path();
                            done();
                        });
                    }, 500);
                });
            });

            it('request can still pipe a fetch wrapped', function(done){
                var request = getRequest();
                var wrapped = poly.testing(request);
                var stream = require('stream');
                var echoStream = new stream.Writable();
                var result = '';
                echoStream._write = function(chunk, encoding, complete){
                  result += chunk.toString();
                  complete();
                };
                echoStream.on('finish', function(){
                    done();
                });
                wrapped(testRoot+'/test.txt').pipe(echoStream);
            });

            after(function(done){
                server.close(function(){
                    done();
                });
            });
        });
    });
});

process.prependListener("exit", function(code){
    if(code === 0) process.exit(unhandledRejectionExitCode);
});
