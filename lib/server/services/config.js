var defaults = require('json-schema-defaults');
var events   = require('events');
var _        = require('lodash');

var eventEmitter = new events.EventEmitter();


/**
 * @module config
 * @requires express
 * @requires storage
 * @requires cache
 * @requires yaml
 * @requires pipeline
 *
 * @description
 * This service is responsible for managing configurations, loading them from
 * the file-system and providing them to other services.
 *
 * @fires config-changed
 */
exports = module.exports = function(app, storage, cache, yaml, pipe) {
  var configService = this;
  var schemas = {};

  var inputPipe = new pipe.Pipeline()
    .step('parse yaml', function(data, options, cb) {
      yaml.parse(data, cb);
    })
    .step('merge default values', function(obj, options, cb) {
      cb(null, _.merge({}, configService.defaults(options.query.id), obj));
    });

  var outputPipe = new pipe.Pipeline()
    .step('serialize yaml', function(obj, options, cb) {
      yaml.serialize(obj, cb);
    });

  var collection = cache.collection(storage.directory('config', {
    extension: 'yml',
    input: inputPipe,
    output: outputPipe,
    read: function(err, data, cb) {
      cb(null, data || '');
    }
  }));

  collection.on('document-added', function(ev)   { onUpdate(ev); });
  collection.on('document-changed', function(ev) { onUpdate(ev); });
  collection.on('document-removed', function(ev) { onUpdate(ev); });

  collection.sync();

  function onUpdate(ev) {
    eventEmitter.emit('config-changed', ev);
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
    collection.get(name, cb, forceLoad);
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
