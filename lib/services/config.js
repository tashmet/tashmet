var defaults = require('json-schema-defaults');
var events   = require('events');
var _        = require('lodash');

var eventEmitter = new events.EventEmitter();


/**
 * @module config
 * @requires express
 * @requires storage
 * @requires database
 * @requires yaml
 *
 * @description
 * This service is responsible for managing configurations, loading them from
 * the file-system and providing them to other services.
 *
 * @fires config-changed
 */
exports = module.exports = function(app, storage, db, yaml) {
  var configService = this;
  var configs = {};
  var schemas = {};

  var mergeDefaults = {
    input: function(obj, path, query, cb) {
      cb(null, {
        name: query.name,
        config: _.merge({}, configService.defaults(query.name), obj)
      });
    },
    output: function(obj, path, query, cb) {
      cb(null, obj.config);
    }
  };

  var collection = db.collection(storage.resource('config', {
    pattern: 'config/{name}.yml',
    pipeline: [yaml, mergeDefaults],
    read: function(err, data, cb) {
      cb(null, data || '');
    }
  }));

  collection.on('document-added', function(ev)   { onUpdate(ev); });
  collection.on('document-changed', function(ev) { onUpdate(ev); });
  collection.on('document-removed', function(ev) { onUpdate(ev); });

  collection.sync();

  function onUpdate(ev) {
    eventEmitter.emit('config-changed', ev.object);
  }


  /**
   * Get default values for a configuration.
   *
   * @param {String} name - Name of the configuration.
   * @return {Object}
   */
  this.defaults = function(name) {
    var schema = schemas[name];
    return schema ? defaults(schema) : {};
  };

  /**
   * Set and/or get a schema for a given configuration name.
   *
   * @param {String} name - Name of the configuration.
   * @param {Object} [schema] - If set the schema will be updated.
   * @return {Object} The schema.
   */
  this.schema = function(name, schema) {
    if(schema) {
      schemas[name] = schema;
    }
    return schemas[name];
  };

  /**
   * Get a configuration.
   *
   * @param {String} name - Name of the configuration.
   * @return {Object}
   */
  this.getByName = function(name, cb, forceLoad) {
    collection.get({name: name}, function(err, obj) {
      cb(err, obj.config);
    }, forceLoad);
  };

  this.services = function() {
    return Object.keys(schemas);
  };

  /**
   * Register an event handler.
   */
  this.on = function(event, fn) {
    eventEmitter.on(event, fn);
  };

  return this;
};
