var async = require('async');

function Cache() {
  var index = {};
  var list = [];

  function indexOf(params) {
    var hash = hashOf(params);
    if(hash in index) {
      return index[hash];
    } else {
      return -1;
    }
  }

  function hashOf(params) {
    return JSON.stringify(params);
  }

  this.get = function(params) {
    var i = indexOf(params);
    if(i < 0) {
      return null;
    } else {
      return list[i];
    }
  };

  this.put = function(obj) {
    var i = indexOf(obj.__params);
    if(i >= 0) {
      list[i] = obj;
      return false;
    } else {
      index[hashOf(obj.__params)] = list.length;
      list.push(obj);
      return true;
    }
  };

  this.remove = function(params) {
    var i = indexOf(params);
    if(i >= 0) {
      delete index[hashOf(params)];
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


function Collection(resource, eventEmitter) {
  this.synced = false;
  this.resource = resource;
  this._cache = new Cache();
  this.eventEmitter = eventEmitter;

  this.checkExclude = function(obj) {
    return false;
  };
}

Collection.prototype.on = function(eventName, listener) {
  this.eventEmitter.on(eventName, listener);
};

Collection.prototype.sync = function(cb) {
  var collection = this;

  this.resource.findAll(function(errors, objects) {
    errors.forEach(function(err) {
      collection.eventEmitter.emit('document-error', err);
    });

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


Collection.prototype.cache = function(obj) {
  if(this.checkExclude(obj)) {
    Collection.prototype.uncache.call(this, obj.__params);
  } else {
    if(this._cache.put(obj)) {
      this.eventEmitter.emit('document-added', obj);
    } else {
      this.eventEmitter.emit('document-changed', obj);
    }
  }
};

Collection.prototype.uncache = function(params) {
  var obj = this._cache.get(params);
  if(obj) {
    this._cache.remove(params);
    this.eventEmitter.emit('document-removed', obj);
    return obj;
  } else {
    return false;
  }
};

Collection.prototype.get = function(query, cb, forceLoad) {
  var collection = this;
  var obj;
  if(!forceLoad) {
    obj = this._cache.get(query);
  }
  if(!obj) {
    this.resource.get(query, function(err, obj) {
      if(!err) {
        Collection.prototype.cache.call(collection, obj);
      } else {
        collection.eventEmitter.emit('document-error', err);
      }
      cb(err, obj);
    });
  } else {
    cb(null, obj);
  }
};

Collection.prototype.findAll = function(cb) {
  if(this.synced) {
    cb(false, this._cache.list());
  } else {
    this.sync(cb);
  }
};

Collection.prototype.store = function(obj, cb) {
  this._cache(obj);
  this.resource.store(obj, cb);
};

Collection.prototype.exclude = function(fn) {
  this.checkExclude = fn;
};

exports = module.exports = {
  Collection: Collection
};
