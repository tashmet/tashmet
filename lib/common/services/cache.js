var events = require('events');
var async  = require('async');

function Cache() {
  var index = {};
  var list = [];

  function indexOf(id) {
    if(id in index) {
      return index[id];
    } else {
      return -1;
    }
  }

  this.get = function(id) {
    return list[index[id]];
  };

  this.put = function(obj) {
    var i = indexOf(obj.__id);
    if(i >= 0) {
      list[i] = obj;
      return false;
    } else {
      index[obj.__id] = list.length;
      list.push(obj);
      return true;
    }
  };

  this.remove = function(id) {
    var i = indexOf(id);
    if(i >= 0) {
      delete index[id];
      list.splice(i, 1);
      return true;
    } else {
      return false;
    }
  };

  this.list = function() {
    return list;
  };
}


function CachedCollection(source) {
  var collection = this;

  this.synced = false;
  this.source = source;
  this._cache = new Cache();
  this.eventEmitter = new events.EventEmitter();

  this.checkExclude = function(obj) {
    return false;
  };

  source.on('doucment-added', onUpdate);
  source.on('document-changed', onUpdate);
  source.on('document-removed', onRemove);
  source.on('document-error', function(err) {
    eventEmitter.emit('document-error', err);
  });

  function onUpdate(obj) {
    collection.cache(obj);
  }

  function onRemove(ev) {
    collection.uncache(ev);
  }
}

CachedCollection.prototype.on = function(eventName, listener) {
  this.eventEmitter.on(eventName, listener);
};

CachedCollection.prototype.sync = function(cb) {
  var collection = this;

  this.source.findAll(function(errors, objects) {
    if(errors) {
      errors.forEach(function(err) {
        collection.eventEmitter.emit('document-error', err);
      });
    }

    async.eachSeries(objects, function(obj, done) {
      collection.cache(obj);
      done();
    }, function(err) {
      collection.synced = true;
      collection.eventEmitter.emit('ready');
      if(cb) {
        cb(errors, objects);
      }
    });
  });
};


CachedCollection.prototype.cache = function(obj) {
  if(this.checkExclude(obj)) {
    CachedCollection.prototype.uncache.call(this, obj.__id);
  } else {
    if(this._cache.put(obj)) {
      this.eventEmitter.emit('document-added', obj);
    } else {
      this.eventEmitter.emit('document-changed', obj);
    }
  }
};

CachedCollection.prototype.uncache = function(id) {
  var obj = this._cache.get(id);
  if(obj) {
    this._cache.remove(id);
    this.eventEmitter.emit('document-removed', obj);
    return obj;
  } else {
    return false;
  }
};

CachedCollection.prototype.get = function(id, cb, forceLoad) {
  var collection = this;
  var obj;
  if(!forceLoad) {
    obj = this._cache.get(id);
  }
  if(!obj) {
    this.source.get(id, function(err, obj) {
      if(!err) {
        CachedCollection.prototype.cache.call(collection, obj);
      } else {
        collection.eventEmitter.emit('document-error', err);
      }
      cb(err, obj);
    });
  } else {
    cb(null, obj);
  }
};

CachedCollection.prototype.findAll = function(cb) {
  if(this.synced) {
    cb(false, this._cache.list());
  } else {
    this.sync(cb);
  }
};

CachedCollection.prototype.store = function(obj, cb) {
  CachedCollection.prototype.cache.call(this, obj);
  this.source.store(obj, cb);
};

CachedCollection.prototype.exclude = function(fn) {
  this.checkExclude = fn;
};

/**
 * @module cache
 *
 * @description
 * This service is responsible for maintaining a in-memory cache of objects
 * used in the system.
 */
exports = module.exports = function CacheService() {

  /**
   * Create a cached collection from another collection.
   *
   * @param {Object} source - The collection that we want to cache.
   * @return {Object} A new cached collection.
   */
  this.collection = function(source) {
    return new CachedCollection(source);
  };

  return this;
};
