var Config   = require('../../common/config.js');
var defaults = require('json-schema-defaults');
var events   = require('events');
var util     = require('util');
var _        = require('lodash');

var eventEmitter = new events.EventEmitter();


function ConfigService(app, storage, cache, yaml, pipe, rest, sync) {
  var configService = this;
  var shared = [];

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

  storage.on('ready', function() {
    Object.keys(configService.schemas).forEach(function(name) {
      if(!collection.isCached(name)) {
        var obj = defaults(configService.schemas[name]);
        obj.__id = name;
        collection.cache(obj);
      }
    });
  });

  Config.call(this, collection, eventEmitter);

  rest.collection('configs', collection, {
    filter: function(item) {
      return _.indexOf(shared, item.__id) >= 0;
    }
  });
  sync.collection('configs', collection);

  this.define = function(name, definition) {
    this.schemas[name] = definition.schema;
    if(definition.shared) {
      shared.push(name);
    }
  };
}

util.inherits(ConfigService, Config);

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
exports = module.exports = function(database) {
  //return new ConfigService(app, storage, cache, yaml, pipe, rest, sync);
  return new Config(database.collection('configs'), eventEmitter);
};
