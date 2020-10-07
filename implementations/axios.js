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
        if(options.json){
            options.responseType = 'json';
            if(typeof options.json !== 'boolean') options.data = options.json;
        }else{
            options.responseType = 'text';
        }
        if(callback){
            task = fetch(url, options);
            task.then(function(res){
                return callback(undefined, res, res.data);
            }).catch(function(err){
                return callback(err);
            });
        }
        var ctrl = {
            form : function(values, callback){
                task = fetch(url, options);
                if(!options.enctype){
                    options.enctype = 'application/x-www-form-urlencoded';
                }
                util.mutateOptionsForForm(values, formData, options);
            }
        };
        if(!callback){
            ctrl.pipe = function(dest){
                options.responseType = 'stream';
                task = fetch(url, options);
                task.then(function(res){
                    if(!res.data.pipe) throw new Error('pipe not supported!');
                    return res.data.pipe(dest);
                }).catch(function(){});
            }
        }
        return ctrl;
    }

    util.setupShortcuts(requestWrapper, requestWrapper);
    return requestWrapper;
}
