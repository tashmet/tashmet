var events = require('events');
var join   = require('path').join;
var _      = require('lodash');

var eventEmitter = new events.EventEmitter();


/**
 * @module taxonomy
 * @requires express
 * @requires storage
 * @requires cache
 * @requires yaml
 *
 * @description
 * This service is responsible for loading taxonomies from the storage into the
 * cache. It also provides the routes necessary for a basic taxonomy api.
 *
 * @fires taxonomy-requested
 * @fires taxonomy-sent
 */
exports = module.exports = function(app, storage, cache, yaml) {
  var taxonomyService = this;

  /*
   * Setup resource.
   */
  var resource = storage.resource('taxonomy', {
    pattern: 'taxonomies/{name}.yml',
    loaders: [yaml],
  });

  resource.on('resource-added', function(ev) { load(ev.name); });
  resource.on('resource-changed', function(ev) { load(ev.name); });

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


  function load(name, fn) {
    resource.get({ name: name }, function(err, terms) {
      var taxonomy = { name: name, terms: terms };
      cache.put('taxonomy', name, taxonomy);
      eventEmitter.emit('taxonomy-added', taxonomy);
      if(fn) {
        fn(taxonomy);
      }
    });
  }

  /**
   * Get a taxonomy by its name.
   *
   * @param {String} name - Name of the taxonomy
   * @param {Function} fn - Callback delivering the taxonomy.
   * @param {Boolean} forceLoad - Read the taxonomy from data source rather than
   *    returning the cached version.
   */
  this.getByName = function(name, fn, forceLoad) {
    if(forceLoad) {
      load(name, fn);
    } else {
      fn(cache.get('taxonomy', name));
    }
  };

  /**
   * Get all taxonomies.
   *
   * @param {Function} fn - Callback delivering a list of taxonomies.
   */
  this.findAll = function(fn) {
    fn(cache.list('taxonomy'));
  };

  /**
   * Store a taxonomy.
   */
  this.store = function(taxonomy) {
    resource.store(taxonomy);
  };

  /**
   * Register an event handler.
   */
  this.on = function(event, fn) {
    eventEmitter.on(event, fn);
  };



  /*
   * Wire-up routes
   */
  app.get('/taxonomies/:taxonomy', function(req, res, next) {
    eventEmitter.emit('taxonomy-requested', req);
    taxonomyService.getByName(req.params.taxonomy, function(taxonomy) {
      res.setHeader('Content-Type', 'application/json');
      res.send(taxonomy.terms);
      eventEmitter.emit('taxonomy-sent', taxonomy.terms);
    });
  });

  return this;
};
