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
    },
    makeServer : function(done, express, testPort){
        var app = express();
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
        return app.listen(testPort, function(){
            done();
        });
    },
    makeRequestFunctionGenerator : function(libNames, libs, poly){
        var options = {
            'node-fetch': [libs.formData]
        }
        return function(moduleName){
            return function(){
                var args = [require(moduleName)];
                if(options[moduleName]) args = args.concat(options[moduleName]);
                return poly[moduleName].apply(poly[moduleName], args);
            }
        }
    }
}
var methods = ['get', 'post', 'put', 'head', 'options', 'delete', 'connect', 'trace', 'patch'];
