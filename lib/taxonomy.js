/**
 * @class
 */
function Taxonomy(collection, eventEmitter) {
  this.collection = collection;
  this.eventEmitter = eventEmitter;

  collection.on('document-added', function(ev) {
    eventEmitter.emit('taxonomy-added', ev);
  });
  collection.on('document-changed', function(ev) {
    eventEmitter.emit('taxonomy-changed', ev);
  });
  collection.on('document-removed', function(ev) {
    eventEmitter.emit('taxonomy-removed', ev);
  });
  collection.on('document-error', function(ev) {
    eventEmitter.emit('taxonomy-error', ev);
  });
}

/**
 * Get a taxonomy by its name.
 *
 * @param {String} name - Name of the taxonomy
 * @param {Function} cb - Callback delivering the taxonomy.
 * @param {Boolean} forceLoad - Read the taxonomy from data source rather than
 * returning the cached version.
 */
Taxonomy.prototype.getByName = function(name, cb, forceLoad) {
  this.collection.get(name, cb, forceLoad);
};

/**
 * Get all taxonomies.
 *
 * @param {Function} cb - Callback delivering a list of taxonomies.
 */
Taxonomy.prototype.findAll = function(cb) {
  this.collection.findAll(cb);
};

/**
 * Store a taxonomy.
 */
Taxonomy.prototype.store = function(taxonomy, cb) {
  this.collection.store(taxonomy, cb);
};

/**
 * Register an event handler.
 */
Taxonomy.prototype.on = function(event, fn) {
  this.eventEmitter.on(event, fn);
};

exports = module.exports = Taxonomy;
