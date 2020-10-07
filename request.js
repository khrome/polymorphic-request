
var transform = {
    "nodeFetch": "node-fetch",
    "fetch": "node-fetch"
}

module.exports = new Proxy({}, {
  get: function(ob, name, receiver){
    return function(instance, opt1){
        var id = transform[name] || name;
        var impl = require('./implementations/'+id);
        return impl(instance, opt1);
    };
  }
});
