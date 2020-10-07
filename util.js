module.exports = {
    ensureIsRequestOptionsObjectOrNull : function(opts, wrapper){
        return (typeof opts === 'string')?{uri:opts}:opts;
    },
    convertOptions : function(opts, map, wrapper){
        if(typeof opts === 'string') opts = module.exports.ensureIsRequestOptionsObjectOrNull(opts);
        return opts;
    },
    mutateOptionsForForm : function(form, formData, options){
        switch(options.enctype){
            case 'application/json':
                options.body = JSON.stringify(values);
                break;
            case 'application/x-www-form-urlencoded':
                var data = new formData(values);
                var params = new URLSearchParams(data);
                options.body = params;
                break;
            case 'form-data':
                var data = new formData(values);
                options.body = data;
                break;
            case 'text-plain':
                if(typeof values) throw new Error('`text-plain` requires form value be a string')
                options.body = values;
                break;
        }
    },
    setupShortcuts : function(ob, rqst){
        methods.forEach(function(method){
            ob[method.toLowerCase()] = function(opts, callback){
                var options = module.exports.ensureIsRequestOptionsObjectOrNull(opts);
                options.method = method.toUpperCase();
                return rqst(options, callback);
            }
        });
    }
}
var methods = ['get', 'post', 'put', 'head', 'options', 'delete', 'connect', 'trace', 'patch'];
