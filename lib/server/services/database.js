var events = require('events');
var _      = require('lodash');

exports = module.exports = function(
  core, cache, storage, pipe, yaml, rest, sync, app, validator)
{
  var database = this;
  var collections = {};
  var eventEmitter = new events.EventEmitter();

  function createCollection(name, options) {
    var frontMatter = options.frontMatter;
    var schema = options.schema;

    function validate(obj, options, cb) {
      if(_.isFunction(schema)) {
        schema = schema(obj);
      }
      if(schema) {
        validator.check(obj, schema, function(err) {
          cb(err, obj);
        });
      } else {
        cb(null, obj);
      }
    }

    var inputPipe = new pipe.Pipeline()
      .step('parse yaml', function(data, options, cb) {
        yaml.parse(data, cb, frontMatter);
      })
      .step('validate', validate);

    if(options.input) {
      options.input(inputPipe, database);
    }

    var outputPipe = new pipe.Pipeline();
    if(options.output) {
      options.output(outputPipe, database);
    }
    outputPipe
      .step('validate', validate)
      .step('serialize yaml', function(obj, options, cb) {
        yaml.serialize(obj, cb);
      });


    var collection = cache.collection(storage.directory(name, {
      extension: options.extension || 'yml',
      input: inputPipe,
      output: outputPipe
    }));

    if(options.share === true || _.isFunction(options.share)) {
      var restOptions = {
        filter: function() { return true; }
      };

      if(_.isFunction(options.share)) {
        restOptions.filter = options.share;
      }
      rest.collection(name, collection, restOptions);
    }
    sync.collection(name, collection);

    collection.on('document-error', function(err) {
      eventEmitter.emit('document-error', err);
    });
    collection.on('ready', function() {
      if(options.done) {
        options.done(collection);
      }
    });

    return collection;
  }

  function waitFor(deps, cb) {
    var remaining = deps;

    function done(name) {
      if(_.isEmpty(_.pull(remaining, name))) {
        cb();
      }
    }

    deps.forEach(function(name) {
      collections[name].on('ready', function() {
        done(name);
      });
    });
  }

  function syncCollection(collection, deps) {
    if(!deps) {
      collection.sync();
    } else {
      waitFor(deps, function() {
        collection.sync();
      });
    }
  }

  for(var name in core.collections()) {
    var options = core.collections()[name];
    var collection = createCollection(name, options);
    collections[name] = collection;
    syncCollection(collection, options.dependencies);
  }

  app.get('/api/database', function(req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    res.send({
      collections: Object.keys(collections)
    });
  });

  this.collection = function(name) {
    return collections[name];
  };

  this.on = function(eventName, listener) {
    eventEmitter.on(eventName, listener);
  };

  return this;
};
