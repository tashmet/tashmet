var Cache  = require('../common/cache.js');
var async  = require('async');
var events = require('events');
var util   = require('util');
var _      = require('lodash');


function Collection(resource, storage) {
  var collection = this;
  var synced = false;
  var queue = [];
  var cache = new Cache();

  var checkExclude = function(obj) {
    return false;
  };

  storage.on('ready', function() {
    resource.on('resource-added', onUpdate);
    resource.on('resource-changed', onUpdate);
    resource.on('resource-removed', remCached);
  });

  function onUpdate(ev) {
    collection.get(ev, function() {}, true);
  }

  this.sync = function(cb) {
    resource.findAll(function(errors, objects) {
      errors.forEach(function(err) {
        collection.emit('document-error', err);
      });

      async.eachSeries(objects, function(obj, done) {
        update(obj);
        done();
      }, function(err) {
        synced = true;
        collection.emit('ready');
        if(cb) {
          cb(errors, objects);
        }
      });
    });
  };

  function update(obj) {
    if(checkExclude(obj)) {
      remCached(obj.__params);
    } else {
      addCached(obj);
    }
  }

  function addCached(obj) {
    if(cache.put(obj)) {
      collection.emit('document-added', obj);
    } else {
      collection.emit('document-changed', obj);
    }
  }

  function remCached(params) {
    var obj = cache.get(params);
    if(obj) {
      cache.remove(params);
      collection.emit('document-removed', obj);
    }
  }

  this.get = function(query, cb, forceLoad) {
    var obj;
    if(!forceLoad) {
      obj = cache.get(query);
    }
    if(!obj) {
      resource.get(query, function(err, obj) {
        if(!err) {
          update(obj);
        } else {
          collection.emit('document-error', err);
        }
        cb(err, obj);
      });
    } else {
      cb(null, obj);
    }
  };

  this.findAll = function(cb) {
    if(synced) {
      cb(false, cache.list());
    } else {
      this.sync(cb);
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


exports = module.exports = function(storage) {

  this.collection = function(resource) {
    return new Collection(resource, storage);
  };

  return this;
};
