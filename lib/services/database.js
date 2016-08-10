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
    resource.on('resource-added', get);
    resource.on('resource-changed', get);
    resource.on('resource-removed', remCached);
  });

  this.sync = function() {
    resource.findAllMatches(function(err, matches) {
      async.eachSeries(matches, function(query, done) {
        get(query, function(err) {
          done(err);
        });
      }, function(err) {
        synced = true;
        collection.emit('ready');
      });
    });
  };

  function get(query, cb) {
    resource.get(query, function(err, obj, path) {
      if(!err) {
        update(query, obj);
      } else {
        collection.emit('document-error', {query: query, err: err});
      }
      if(cb) {
        cb(err);
      }
    });
  }

  function update(query, obj) {
    if(checkExclude(obj)) {
      remCached(query);
    } else {
      addCached(query, obj);
    }
  }

  function addCached(query, obj) {
    if(cache.put(query, obj)) {
      collection.emit('document-added', {query: query, object: obj});
    } else {
      collection.emit('document-changed', {query: query, object: obj});
    }
  }

  function remCached(params) {
    var obj = cache.get(params);
    if(obj) {
      cache.remove(params);
      collection.emit('document-removed', {query: params, object: obj});
    }
  }

  this.get = function(query, cb, forceLoad) {
    var obj;
    if(!forceLoad) {
      obj = cache.get(query);
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
      cb(false, cache.list());
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


exports = module.exports = function(storage) {

  this.collection = function(resource) {
    return new Collection(resource, storage);
  };

  return this;
};
