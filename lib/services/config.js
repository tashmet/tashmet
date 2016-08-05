var events = require('events');
var _      = require('lodash');

var eventEmitter = new events.EventEmitter();


/**
 * @module config
 * @requires express
 * @requires storage
 * @requires cache
 * @requires yaml
 *
 * @description
 * This service is responsible for managing configurations, loading them from
 * the file-system and providing them to other services.
 *
 * @fires config-changed
 */
exports = module.exports = function(app, storage, cache, yaml) {
  var configs = {};
  var defaults = {};

  var resource = storage.resource('config', {
    pattern: 'config/{name}.yml',
    pipeline: [yaml]
  });

  resource.on('resource-added', function(ev) { load(ev.name); });
  resource.on('resource-changed', function(ev) { load(ev.name); });
  resource.on('resource-removed', function(ev) { remove(ev.name); });

  function emit(name) {
    eventEmitter.emit('config-changed', {
      name: name,
      config: configs[name]
    });
  }

  function load(name) {
    resource.get({ name: name }, function(err, obj) {
      if(!err) {
        configs[name] = _.merge({}, defaults[name], obj);
        emit(name);
      }
    });
  }

  function remove(name) {
    var newConfig = defaults[name] || {};
    if(!_.isEqual(configs[name], newConfig)) {
      configs[name] = newConfig;
      emit(name);
    }
  }

  /**
   * Set default values for a configuration.
   *
   * @param {String} name - Name of the configuration.
   * @param {Object} config - Default configuration.
   */
  this.defaults = function(name, config) {
    defaults[name] = configs[name] = config;
  };

  /**
   * Get a configuration.
   *
   * @param {String} name - Name of the configuration.
   * @return {Object}
   */
  this.get = function(name) {
    return configs[name];
  };

  /**
   * Register an event handler.
   */
  this.on = function(event, fn) {
    eventEmitter.on(event, fn);
  };

  return this;
};
