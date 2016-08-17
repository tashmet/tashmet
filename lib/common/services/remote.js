var events = require('events');
var rest   = require('rest');
var mime   = require('rest/interceptor/mime');

var client = rest.wrap(mime);

function RemoteCollection(name) {
  this.name = name;
  this.eventEmitter = new events.EventEmitter();
}

RemoteCollection.prototype.on = function(eventName, listener) {
  this.eventEmitter.on(eventName, listener);
};

RemoteCollection.prototype.get = function(id, cb) {
  client({path: '/api/' + this.name + '/' + id}).then(function(response) {
    cb(null, response.entity);
  }, function(response) {
    cb(response.entity, null);
  });
};

RemoteCollection.prototype.findAll = function(cb) {
  client({path: '/api/' + this.name}).then(function(response) {
    cb(null, response.entity);
  }, function(response) {
    cb(response.entity, null);
  });
};

RemoteCollection.prototype.store = function(obj, cb) {
  throw Error('Storing not supported for remote collection');
};

RemoteCollection.prototype.emit = function(eventName, message) {
  this.eventEmitter.emit(eventName, message);
};

/**
 * @module remote
 *
 * @description
 * This service is responsible for interfacing with remote rest apis.
 */
exports = module.exports = function() {

  /**
   * Create a remote collection.
   *
   * @param {Object} name - The name of the endpoint.
   * @return {Object} A new collection.
   */
  this.collection = function(name) {
    return new RemoteCollection(name);
  };

  this.get = function(name, cb) {
    client({path: '/api/' + name}).then(function(response) {
      cb(null, response.entity);
    }, function(response) {
      cb(response.entity, null);
    });
  };

  return this;
};
