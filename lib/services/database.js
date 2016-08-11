var cache  = require('../common/cache.js');
var async  = require('async');
var events = require('events');
var util   = require('util');
var _      = require('lodash');


function ServerCollection(resource, storage, socket) {
  cache.Collection.call(this, resource, new events.EventEmitter());
  var collection = this;

  storage.on('ready', function() {
    resource.on('resource-added', onUpdate);
    resource.on('resource-changed', onUpdate);
    resource.on('resource-removed', onRemove);
  });

  function onUpdate(ev) {
    cache.Collection.prototype.get.call(collection, ev, function() {}, true);
  }

  function onRemove(ev) {
    cache.Collection.prototype.uncache.call(collection, ev);
  }
}

util.inherits(ServerCollection, cache.Collection);

exports = module.exports = function(storage) {

  this.collection = function(resource) {
    return new ServerCollection(resource, storage);
  };

  return this;
};
