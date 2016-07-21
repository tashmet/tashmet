var events = require('events');

var eventEmitter = new events.EventEmitter();


/**
 * @module taxonomy
 * @requires express
 * @requires storage
 * @requires cache
 *
 * @description
 * This service is responsible for loading taxonomies from the storage into the
 * cache. It also provides the routes necessary for a basic taxonomy api.
 *
 * @fires taxonomy-requested
 * @fires taxonomy-sent
 */
exports = module.exports = function(app, storage, cache) {
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


  function load(name) {
    var taxonomy = storage.taxonomy(name);
    if(taxonomy) {
      cache.storeTaxonomy(taxonomy);
      return taxonomy;
    }
    return undefined;
  }

  /**
   * Get a taxonomy by its name.
   *
   * @param {String} name - Name of the taxonomy
   * @param {Boolean} forceLoad - Read the taxonomy from data source rather than
   *    returning the cached version.
   */
  this.getByName = function(name, forceLoad) {
    if(forceLoad) {
      return load(name);
    } else {
      return cache.taxonomy(name);
    }
  };

  /**
   * Get all taxonomies.
   *
   * @returns {Array} A list of taxonomies.
   */
  this.findAll = function() {
    return cache.taxonomies();
  };

  /**
   * Store a taxonomy.
   */
  this.store = function(taxonomy) {
    storage.storeTaxonomy(taxonomy);
  };

  /**
   * Register an event handler.
   */
  this.on = function(event, fn) {
    eventEmitter.on(event, fn);
  };


  /*
   * Wire-up event handlers
   */
  storage.on('taxonomy-added', load);
  storage.on('taxonomy-changed', load);

  /*
   * Wire-up routes
   */
  app.get('/taxonomies/:taxonomy', function(req, res, next) {
    eventEmitter.emit('taxonomy-requested', req);
    var terms = cache.taxonomy(req.params.taxonomy).terms;
    res.setHeader('Content-Type', 'application/json');
    res.send(terms);
    eventEmitter.emit('taxonomy-sent', terms);
  });

  return this;
};
