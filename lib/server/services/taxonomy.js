var Taxonomy = require('../../taxonomy.js');
var events   = require('events');
var util     = require('util');

var eventEmitter = new events.EventEmitter();


function TaxonomyService(app, storage, cache, yaml, pipe) {
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

  Taxonomy.call(this, collection, eventEmitter);

  app.get('/api/taxonomies/:taxonomy', function(req, res, next) {
    eventEmitter.emit('taxonomy-requested', req);
    taxonomyService.getByName(req.params.taxonomy, function(err, taxonomy) {
      res.setHeader('Content-Type', 'application/json');
      res.send(taxonomy);
      eventEmitter.emit('taxonomy-sent', taxonomy);
    });
  });

  collection.sync();
}

util.inherits(TaxonomyService, Taxonomy);

/**
 * @module taxonomy
 * @requires express
 * @requires storage
 * @requires cache
 * @requires yaml
 * @requires pipeline
 *
 * @description
 * This service is responsible for loading taxonomies from the storage into the
 * cache. It also provides the routes necessary for a basic taxonomy api.
 *
 * @fires taxonomy-requested
 * @fires taxonomy-sent
 */
exports = module.exports = function(app, storage, cache, yaml, pipe) {

  return new TaxonomyService(app, storage, cache, yaml, pipe);

  /**
   * Taxonomy requested event.
   * Fired when a taxonomy have been requested and contains the request object.
   *
   * @event taxonomy-requested
   * @type {Object}
   */

  /**
   * Taxonomy sent event.
   * Fired when a taxonomy has been sent and contains the terms in the
   * taxonomy sent.
   *
   * @event taxonomy-sent
   * @type {Array}
   */
};
