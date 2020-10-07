var util = require('../util');

//TODO: make abort work

var fetchMap = {};

module.exports = function(fetch, formData){ //formData: FormData B or 'form-data' N
    var task;
    var callback;
    var requestWrapper = function(opts, callback){
        var url = opts.uri || opts.url || (
            (typeof opts === 'string')?opts: undefined
        );
        var options = util.convertOptions(opts, fetchMap);
        if(options.json){
            if(!options.headers) options.headers = {};
            options.headers['Content-Type'] = 'application/json';
        }
        task = fetch(url, options);
        if(callback) task.then(function(res){
            //todo: support a binary option
            if(options.json){
                res.json().then(function(data){
                    return callback(undefined, res, data);
                }).catch(function(err){
                    return callback(err);
                });
            }else{
                res.text().then(function(data){
                    return callback(undefined, res, data);
                }).catch(function(err){
                    return callback(err);
                });
            }
        }).catch(function(err){
            return callback(err);
        });;
        var ctrl = {
            form : function(values, callback){
                if(!options.enctype){
                    options.enctype = 'application/x-www-form-urlencoded';
                }
                util.mutateOptionsForForm(values, formData, options);
            }
        };
        if(!callback){
            ctrl.pipe = function(dest){
                task.then(function(res){
                    if(!res.body.pipe) throw new Error('pipe not supported!');
                    //todo: use reader to emulate pipe if not available
                    /*
                    var reader = response.body.getReader();
                    reader.read().then(function process(chunk){
                        if(result.done) return;
                        return reader.read().then(process);
                    }).then(function(){

                    });
                    //*/
                    return res.body.pipe(dest);
                }).catch(function(){});
            }
        }
        return ctrl;
    }

    util.setupShortcuts(requestWrapper, requestWrapper);
    return requestWrapper;
}
