var async = require('async');

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


function Collection(source, eventEmitter) {
  var collection = this;

  this.synced = false;
  this.source = source;
  this._cache = new Cache();
  this.eventEmitter = eventEmitter;

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

Collection.prototype.on = function(eventName, listener) {
  this.eventEmitter.on(eventName, listener);
};

Collection.prototype.sync = function(cb) {
  var collection = this;

  this.source.findAll(function(errors, objects) {
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
    Collection.prototype.uncache.call(this, obj.__id);
  } else {
    if(this._cache.put(obj)) {
      this.eventEmitter.emit('document-added', obj);
    } else {
      this.eventEmitter.emit('document-changed', obj);
    }
  }
};

Collection.prototype.uncache = function(id) {
  var obj = this._cache.get(id);
  if(obj) {
    this._cache.remove(id);
    this.eventEmitter.emit('document-removed', obj);
    return obj;
  } else {
    return false;
  }
};

Collection.prototype.get = function(id, cb, forceLoad) {
  var collection = this;
  var obj;
  if(!forceLoad) {
    obj = this._cache.get(id);
  }
  if(!obj) {
    this.source.get(id, function(err, obj) {
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
  Collection.prototype.cache.call(this, obj);
  this.source.store(obj, cb);
};

Collection.prototype.exclude = function(fn) {
  this.checkExclude = fn;
};

exports = module.exports = {
  Collection: Collection
};
