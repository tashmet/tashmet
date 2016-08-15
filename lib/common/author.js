/**
 * @class
 */
function Author(collection, eventEmitter) {
  this.collection = collection;
  this.eventEmitter = eventEmitter;

  collection.on('document-added', function(ev) {
    eventEmitter.emit('author-added', ev);
  });
  collection.on('document-changed', function(ev) {
    eventEmitter.emit('author-changed', ev);
  });
  collection.on('document-removed', function(ev) {
    eventEmitter.emit('author-removed', ev);
  });
  collection.on('document-error', function(ev) {
    eventEmitter.emit('author-error', ev);
  });
  collection.on('ready', function(ev) {
    eventEmitter.emit('ready', ev);
  });
}

/**
 * Get a author by its name.
 *
 * @param {String} name - Name of the author
 * @param {Author~getByNameCallback} cb - Callback delivering the author.
 * @param {Boolean} forceLoad - Ignore cached data and force it to be loaded
 * from the resource.
 */
Author.prototype.getByName = function(name, cb, forceLoad) {
  this.collection.get(name, cb, forceLoad);
};

/**
 * Get all authors.
 *
 * @param {Author~findAllCallback} cb - Callback delivering a list of authors.
 */
Author.prototype.findAll = function(cb) {
  this.collection.findAll(cb);
};

/**
 * Store a author.
 *
 * @param {Object} author - The author to store.
 * @param {Function} cb - Callback
 */
Author.prototype.store = function(author, cb) {
  this.collection.store(author, cb);
};

/**
 * Register an event handler.
 */
Author.prototype.on = function(event, fn) {
  this.eventEmitter.on(event, fn);
};

/**
 * Callback supplying result of author.findAll operation
 *
 * @callback Author~findAllCallback
 * @param {Array.<Error>} errors - List of errors.
 * @param {Array} authors - List of authors.
 */

/**
 * Callback supplying result of author.getByName operation
 *
 * @callback Author~getByNameCallback
 * @param {Error} err - Error if failed.
 * @param {Object} author - Author object if successful.
 */

exports = module.exports = Author;
