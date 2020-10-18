var util = require('./util');
var hash = require('object-hash');
var fs = require('fs');
var transform = {
    "nodeFetch": "node-fetch",
    "fetch": "node-fetch"
}

module.exports = new Proxy({}, {
  get: function(ob, name, receiver){
    return function(instance, opt1){
        var id = transform[name] || name;
        if(id === 'testing') return testing(instance);
        var impl = require('./implementations/'+id);
        return impl(instance, opt1);
    };
  }
});

var copy = function(i){
    var cache = [];
    var result = JSON.parse(JSON.stringify(i, function(key, value){
      if(typeof value === 'object' && value !== null){
        if (cache.includes(value)) return;
        cache.push(value);
      }
      return value;
    }));
    cache = null;
    return result;
};

var testing = function(instance){
    //
    var mocks = [];
    //THE WRAPPER
    var wrapper = function(){
        var args = Array.prototype.slice.call(arguments);
        if(typeof args[args.length-1] == 'function'){
            var originalCallback = args.pop();
            args.push(function(){
                var cbArgs = Array.prototype.slice.call(arguments);
                wrapper.callCount++;
                if(wrapper.recorders){
                    wrapper.recorders.forEach(function(recorderFn){
                        var theseArgs = copy(cbArgs);
                        theseArgs.push(args[0]);
                        if(theseArgs.length !== 4 || !args[0]){
                            throw new Error('no options!');
                        }
                        recorderFn.apply(recorderFn, theseArgs);
                    });
                }
                originalCallback.apply(originalCallback, arguments);
            });
        }
        var found;
        mocks.forEach(function(mock){
            if(mock.select.apply({}, args)){
                wrapper.callCount++; //todo:stats
                found = true;
                if(Array.isArray(mock.result)){
                    return originalCallback.apply(originalCallback, mock.result);
                }
                if(typeof mock.result === 'object'){
                    //todo:
                }
                //todo: handle pipe mocking
            }
        });
        if(!found){
            wrapper.callthruCount++; //todo:stats
            var result = instance.apply(instance, args);
            var parentPipe = result.pipe;
            result.pipe = function(stream, options){
                var piped = parentPipe.apply(result, [stream, options || {}]);
                if(piped){
                    //TODO: make em universal
                    piped.on('pipe', function(reader){
                        reader.on('data', function(){
                            //console.log('DT')
                        });
                        reader.on('finish', function(){
                            //console.log('E')
                        });
                    });
                }
                return piped;
            }
            return result;
        }
    }
    wrapper.callCount = 0;
    wrapper.callthruCount = 0;
    util.setupShortcuts(wrapper, wrapper);
    //THE TEST UTILITIES
    wrapper.mock = function(selector, result){ //<string or fn>, <string or object>
        var select = typeof selector === 'function'?select:function(opts){
            return opts.uri === selector || opts === selector;
        };
        mocks.push({
            select: select,
            result: result
        });
    }
    wrapper.record = function(handler, registerName){
        var handlerFn = handler;
        if(typeof handler === 'string'){ //filepath
            handlerFn = function(err, req, res, options){
                var safeErr = err && copy(err);
                var safeReq = req && copy(req);
                var safeRes = res && copy(res);
                var name = hash(options);
                if(registerName) registerName(name);
                fs.writeFile(handler+name, JSON.stringify({
                    error: safeErr,
                    request : safeReq,
                    response : safeRes
                }), function(){
                    //console.log('File Written: '+handler+name);
                });
            }
        }
        if(!wrapper.recorders) this.recorders = [];
        wrapper.recorders.push(handlerFn);
    }
    wrapper.events = function(){
        if(!wrapper.eventHandle){

        }
        return wrapper.eventHandle;
    }
    wrapper.stats = function(){

    }
    return wrapper;
}
