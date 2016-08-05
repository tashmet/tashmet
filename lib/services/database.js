var async  = require('async');
var events = require('events');
var util   = require('util');
var _      = require('lodash');

function Collection(resource, storage, cache) {
  var collection = this;
  var synced = false;
  var queue = [];

  var checkExclude = function(obj) {
    return false;
  };

  resource.on('resource-added', onUpdated);
  resource.on('resource-changed', onUpdated);
  resource.on('resource-removed', onRemoved);

  storage.on('ready', function() {
    synced = queue.length === 0;
    if(synced) {
      collection.emit('ready');
    }
  });

  this.sync = function() {
    if(!synced) {
      async.eachSeries(queue, function(query, done) {
        get(query, function() {
          done();
        });
      }, function(err) {
        synced = true;
        collection.emit('ready');
      });
    }
  };

  function get(query, cb) {
    resource.get(query, function(err, obj, path) {
      if(!err) {
        update(query, obj);
      } else {
        collection.emit('document-error', err);
      }
      if(cb) {
        cb();
      }
    });
  }

  function onUpdated(ev) {
    if(synced) {
      get(ev);
    } else {
      // TODO: Also handle resource-removed?
      queue.push(ev);
    }
  }

  function onRemoved(ev) {
    remCached(ev);
  }

  function update(query, obj) {
    if(checkExclude(obj)) {
      remCached(query);
    } else {
      addCached(query, obj);
    }
  }

  function addCached(query, obj) {
    var key = JSON.stringify(query);
    if(cache.put(resource.name, key, obj)) {
      collection.emit('document-added', obj);
    } else {
      collection.emit('document-changed', obj);
    }
  }

  function remCached(query) {
    var key = JSON.stringify(query);
    var obj = cache.get(resource.name, key);
    if(obj) {
      cache.remove(resource.name, key);
      collection.emit('document-removed', obj);
    }
  }

  this.get = function(query, cb, forceLoad) {
    var obj;
    if(!forceLoad) {
      obj = cache.get(resource.name, JSON.stringify(query));
    }
    if(!obj) {
      resource.get(query, function(err, obj, path) {
        cb(err, obj);
      });
    } else {
      cb(null, obj);
    }
  };

  this.findAll = function(cb) {
    if(synced) {
      cb(false, cache.list(resource.name));
    } else {
      resource.findAll(function(err, objects) {
        // TODO: Add all to cache
        cb(err, objects);
      });
    }
  };

  this.store = function(query, obj, cb) {
    update(query, obj);
    resource.store(query, obj, cb);
  };

  this.isSynced = function() {
    return synced;
  };

  this.exclude = function(fn) {
    checkExclude = fn;
  };
}

util.inherits(Collection, events.EventEmitter);


exports = module.exports = function(storage, cache) {

  this.collection = function(resource) {
    return new Collection(resource, storage, cache);
  };

  return this;
};
