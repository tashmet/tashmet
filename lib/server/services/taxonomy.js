var Taxonomy = require('../../common/taxonomy.js');
var events   = require('events');
var util     = require('util');


function TaxonomyService(rest, storage, cache, yaml, pipe) {
  var taxonomyService = this;

  var inputPipe = new pipe.Pipeline()
    .step('parse yaml', function(data, options, cb) {
      yaml.parse(data, cb);
    });

  var outputPipe = new pipe.Pipeline()
    .step('serialize yaml', function(obj, options, cb) {
      yaml.serialize(obj, cb);
    });

  var collection = cache.collection(storage.directory('taxonomies', {
    extension: 'yml',
    input: inputPipe,
    output: outputPipe
  }));

  Taxonomy.call(this, collection, new events.EventEmitter());

  rest.collection('taxonomies', collection);

  collection.sync();
}

util.inherits(TaxonomyService, Taxonomy);

/**
 * @module taxonomy
 * @requires rest
 * @requires storage
 * @requires cache
 * @requires yaml
 * @requires pipeline
 *
 * @description
 * This service is responsible for loading taxonomies from the storage into the
 * cache. It also provides the routes necessary for a basic taxonomy api.
 */
exports = module.exports = function(rest, storage, cache, yaml, pipe) {
  return new TaxonomyService(rest, storage, cache, yaml, pipe);
};
