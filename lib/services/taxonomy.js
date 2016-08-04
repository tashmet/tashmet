var events = require('events');
var join   = require('path').join;
var _      = require('lodash');

var eventEmitter = new events.EventEmitter();


/**
 * @module taxonomy
 * @requires express
 * @requires storage
 * @requires database
 * @requires yaml
 *
 * @description
 * This service is responsible for loading taxonomies from the storage into the
 * cache. It also provides the routes necessary for a basic taxonomy api.
 *
 * @fires taxonomy-requested
 * @fires taxonomy-sent
 */
exports = module.exports = function(app, storage, db, yaml) {
  var taxonomyService = this;

  var pipe = {
    input: function(data, path, query, cb) {
      cb(null, { name: query.name, terms: data });
    },

    output: function(obj, path, query, cb) {
      cb(null, obj.terms);
    }
  };

  var collection = db.collection(storage.resource('taxonomy', {
    pattern: 'taxonomies/{name}.yml',
    pipeline: [yaml, pipe],
  }));

  collection.on('document-added', function(ev) {
    eventEmitter.emit('taxonomy-added', ev);
  });
  collection.on('document-changed', function(ev) {
    eventEmitter.emit('taxonomy-changed', ev);
  });
  collection.on('document-removed', function(ev) {
    eventEmitter.emit('taxonomy-removed', ev);
  });


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


  /**
   * Get a taxonomy by its name.
   *
   * @param {String} name - Name of the taxonomy
   * @param {Function} cb - Callback delivering the taxonomy.
   * @param {Boolean} forceLoad - Read the taxonomy from data source rather than
   *    returning the cached version.
   */
  this.getByName = function(name, cb, forceLoad) {
    collection.get({name: name}, cb, forceLoad);
  };

  /**
   * Get all taxonomies.
   *
   * @param {Function} cb - Callback delivering a list of taxonomies.
   */
  this.findAll = function(cb) {
    collection.findAll(cb);
  };

  /**
   * Store a taxonomy.
   */
  this.store = function(taxonomy) {
    collection.store({name: taxonomy.name}, taxonomy);
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
  app.get('/api/taxonomies/:taxonomy', function(req, res, next) {
    eventEmitter.emit('taxonomy-requested', req);
    taxonomyService.getByName(req.params.taxonomy, function(err, taxonomy) {
      res.setHeader('Content-Type', 'application/json');
      res.send(taxonomy.terms);
      eventEmitter.emit('taxonomy-sent', taxonomy.terms);
    });
  });

  return this;
};
