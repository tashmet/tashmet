var cache  = require('../../cache.js');
var events = require('events');

/**
 * @module cache
 *
 * @description
 * This service is responsible for maintaining a in-memory cache of objects
 * used in the system.
 */
exports = module.exports = function() {

  /**
   * Create a cached collection from another collection.
   *
   * @param {Object} source - The collection that we want to cache.
   * @return {Object} A new cached collection.
   */
  this.collection = function(source) {
    return new cache.Collection(source, new events.EventEmitter());
  };

  return this;
};
