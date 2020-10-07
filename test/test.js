var chai = require('chai');
var should = chai.should();
var poly = require('../request');
var express = require('express');

//WTF is this stupidity mocha?!?! I predicted this trashpile.
let unhandledRejectionExitCode = 0;

process.on("unhandledRejection", function(reason){
    //console.log("unhandled rejection:", reason);
    unhandledRejectionExitCode = 1;
    throw reason;
});

var supportedModules = ['node-fetch', 'request', 'axios'];
var options = {
    'node-fetch': [require('form-data')]
}
var testPort = 8081;
var testRoot = 'http://localhost:'+testPort;

var head = function(headers, header){
    return headers[header] || headers[header.toLowerCase()];
}

describe('polymorphic-request', function(){
    supportedModules.forEach(function(moduleName){
        describe('uses the '+moduleName+' module', function(){
            var server;
            var getRequest = function(){
                var args = [require(moduleName)];
                if(options[moduleName]) args = args.concat(options[moduleName]);
                return poly[moduleName].apply(poly[moduleName], args);
            }

            before(function(done){
                var app = require('express')();
                app.use(express.static('./test/data'));
                app.all('/mirror', function(req, res, next){
                    var cache = [];
                    res.send(JSON.stringify(req, function(key, value){
                        if(typeof value === 'object' && value !== null){
                            if(value.type === Buffer && value.data) return value.toString();
                            if(cache.includes(value)) return;
                            cache.push(value);
                        }
                        return value;
                    }));
                })
                server = app.listen(testPort, function(){
                    done();
                });
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
                })
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
                })
            })
        });
    });
});

process.prependListener("exit", function(code){
    if(code === 0) process.exit(unhandledRejectionExitCode);
});
