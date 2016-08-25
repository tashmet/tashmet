var defaults = require('json-schema-defaults');

/**
 * @class
 */
function Config(collection, eventEmitter) {
  this.collection = collection;
  this.eventEmitter = eventEmitter;
  this.schemas = {};

  collection.on('document-added', function(ev)   { onUpdate(ev); });
  collection.on('document-changed', function(ev) { onUpdate(ev); });
  collection.on('document-removed', function(ev) { onUpdate(ev); });

  collection.sync();

  function onUpdate(ev) {
    eventEmitter.emit('config-changed', ev);
  }
}

/**
 * Get default values for a configuration.
 *
 * @param {String} name - Name of the configuration.
 * @return {Object}
 */
Config.prototype.defaults = function(name) {
  var schema = this.schemas[name];
  return schema ? defaults(schema) : {};
};

/**
 * Set and/or get a schema for a given configuration name.
 *
 * @param {String} name - Name of the configuration.
 * @param {Object} [schema] - If set the schema will be updated.
 * @return {Object} The schema.
 */
Config.prototype.schema = function(name, schema) {
  if(schema) {
    this.schemas[name] = schema;
  }
  return this.schemas[name];
};

/**
 * Get a configuration.
 *
 * @param {String} name - Name of the configuration.
 * @return {Object}
 */
Config.prototype.getByName = function(name, cb, forceLoad) {
  this.collection.get(name, cb, forceLoad);
};

Config.prototype.store = function(obj, cb) {
  this.collection.store(obj, cb);
};

Config.prototype.services = function() {
  return Object.keys(this.schemas);
};


/**
 * Register an event handler.
 */
Config.prototype.on = function(event, fn) {
  this.eventEmitter.on(event, fn);
};


exports = module.exports = Config;
