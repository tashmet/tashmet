var events = require('events');
var rest   = require('rest');
var mime   = require('rest/interceptor/mime');

var client = rest.wrap(mime);


function DatabaseService(remote, cache, sync) {
  var collections = {};

  function getDatabaseInfo(cb) {
    client({path: '/api/database'}).then(function(response) {
      cb(null, response.entity);
    }, function(response) {
      cb(response.entity, null);
    });
  }

  getDatabaseInfo(function(err, info) {
    info.collections.forEach(function(name) {
      var remoteCol = remote.collection(name);
      var collection = cache.collection(remoteCol);

      sync.collection(name, remoteCol);

      collections[name] = collection;
    });
  });

  this.collection = function(name) {
    return collections[name];
  };

  return this;
}


exports = module.exports = DatabaseService;
