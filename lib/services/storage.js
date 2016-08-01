var async     = require('async');
var chokidar  = require('chokidar');
var events    = require('events');
var fs        = require('fs');
var path      = require('path');
var recursive = require('recursive-readdir');
var format    = require('string-template');
var util      = require('util');
var _         = require('lodash');

var eventEmitter = new events.EventEmitter();
var basePath = path.join(process.cwd(), 'tashmetu');


/**
 * Resource error
 *
 * @typedef {Object} Resource~ResourceError
 * @property {String} query - Failed query.
 * @property {String} message - Error message.
 */
ResourceError = function(query, message) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.message = message;
  this.name = 'ResourceError';
  this.query = query;
};

util.inherits(ResourceError, Error);


/**
 * @class Resource
 */
function Resource(def) {
  this.regex = new RegExp('^' + def.pattern
    .replace(/{.+?}/g, '(.*)')
    .replace(/\//g, "\\/") + '$');

  this.params  = def.pattern.match(/[^{}]+(?=\})/g);
  this.pattern = def.pattern;
  this.loaders  = def.loaders || [];
}

util.inherits(Resource, events.EventEmitter);

function getPath(query, params, pattern, fail, success) {
  if(_.isEqual(Object.keys(query).sort(), params.sort())) {
    var relPath = format(pattern, query);
    success(path.join(basePath, relPath));
  } else {
    fail('Missing one or more parameters');
  }
}

function transformData(func, loaders, data, absPath, query, cb) {
  async.eachSeries(loaders, function(loader, done) {
    if(func == 'load') {
      loader.load(data, absPath, query, function(err, result) {
        data = result;
        done(err);
      });
    } else if(func == 'serialize') {
      loader.serialize(data, absPath, query, function(err, result) {
        data = result;
        done(err);
      });
    }
  }, function(err) {
    cb(err, data);
  });
}

/**
 * Get a single object given a query.
 *
 * @param {Object} query - Query consisting of keys and values.
 * @param {Function} cb - Callback
 */
Resource.prototype.get = function(query, cb) {
  var loaders = this.loaders;

  getPath(query, this.params, this.pattern, cb, function(absPath) {
    fs.readFile(absPath, 'utf-8', function(err, data) {
      if(!err) {
        transformData('load', loaders, data, absPath, query, function(err, data) {
          err = err ? new ResourceError(query, err.message) : err;
          cb(err, data, absPath);
        });
      } else {
        cb(err);
      }
    });
  });
};

/**
 * Store an object.
 *
 * @param {Object} query - Query consisting of keys and values.
 * @param {Object} data - The object to store.
 * @param {Resource~storeCallback} cb - The callback that handles the response.
 */
Resource.prototype.store = function(query, data, cb) {
  var loaders = this.loaders;

  getPath(query, this.params, this.pattern, cb, function(absPath) {
    transformData('serialize', loaders, data, absPath, query, function(err, data) {
      if(!err) {
        fs.writeFile(absPath, data, function(err) {
          err = err ? new ResourceError(query, err.message) : err;
          cb(err, absPath);
        });
      } else {
        cb(new ResourceError(query, err.message));
      }
    });
  });
};

/**
 * Find all matches for this resource.
 *
 * @param {Function} cb - Callback delivering a list of queries that
 *    corresponds to files belonging to this resource.
 */
Resource.prototype.findAllMatches = function(cb) {
  var resource = this;
  var matches = {};
  recursive(basePath, function (err, files) {
    async.eachSeries(files, function(file, done) {
      file = path.relative(basePath, file);

      var match = resource.regex.exec(file);
      if(match) {
        var query = {};
        for(var j=0; j<resource.params.length; j++) {
          query[resource.params[j]] = match[j+1];
        }
        matches[match[0]] = query;
      }
      done();
    }, function(err) {
      cb(err, matches);
    });
  });
};


/**
 * Get all the items of belonging to this resource.
 *
 * @param {Function} cb
 */
Resource.prototype.findAll = function(cb) {
  var resource = this;
  var collection = [];
  var errors = [];

  this.findAllMatches(function(err, matches) {
    if(err) {
      cb(err);
    } else {
      async.eachSeries(matches, function(query, done) {
        resource.get(query, function(err, item, path) {
          if(err) {
            errors.push(err);
          } else {
            collection.push(item);
          }
          done();
        });
      }, function(err) {
        cb(errors, collection);
      });
    }
  });
};


Resource.prototype.matchFile = function(file) {
  var match = this.regex.exec(file);
  if(match) {
    var query = {};
    for(var j=0; j<this.params.length; j++) {
      query[this.params[j]] = match[j+1];
    }
    return query;
  }
  return false;
};

/**
 * Callback supplying result of store operation.
 * @callback Resource~storeCallback
 * @param {} err
 * @param {String} path Absolute file system path.
 */


/**
 * @module storage
 *
 * @description
 * Storage service responsible for loading and storing data on the file system.
 * This service also listens for file changes and emits events when files are
 * added, changed or removed
 */
exports = module.exports = function() {
  var resources = {};

  function onFile(file, action) {
    file = path.relative(basePath, file);
    Object.keys(resources).forEach(function(name) {
      var query = resources[name].matchFile(file);
      if(query) {
        resources[name].emit('resource-' + action, query);
      }
    });
  }

  this.ResourceError = ResourceError;

  /**
   * Create or get a resource.
   *
   * @param {String} name - Name of the resource.
   * @param {Object} definition
   */
  this.resource = function(name, definition) {
    if(definition) {
      resources[name] = new Resource(definition);
    }
    return resources[name];
  };


  /**
   * Start listening for file changes
   */
  this.listen = function() {
    var config = {
      awaitWriteFinish: {
        stabilityThreshold: 500
      }
    };
    chokidar.watch(basePath, config)
      .on('add',    function(path) { onFile(path, 'added'); })
      .on('change', function(path) { onFile(path, 'changed'); })
      .on('unlink', function(path) { onFile(path, 'removed'); })
      .on('ready',  function() {
        eventEmitter.emit('ready');
      });
  };

  /**
   * Register an event handler.
   */
  this.on = function(event, fn) {
    eventEmitter.on(event, fn);
  };

  return this;
};
