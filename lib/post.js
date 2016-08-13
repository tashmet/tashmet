/**
 * @class
 */
function Post(collection, eventEmitter) {
  this.collection = collection;
  this.eventEmitter = eventEmitter;

  collection.on('document-added', function(ev) {
    eventEmitter.emit('post-added', ev);
  });
  collection.on('document-changed', function(ev) {
    eventEmitter.emit('post-changed', ev);
  });
  collection.on('document-removed', function(ev) {
    eventEmitter.emit('post-removed', ev);
  });
  collection.on('document-error', function(ev) {
    eventEmitter.emit('post-error', ev);
  });
}

/**
 * Get a post by its name.
 *
 * @param {String} name - Name of the post
 * @param {Post~getByNameCallback} cb - Callback delivering the post.
 * @param {Boolean} forceLoad - Ignore cached data and force it to be loaded
 * from the resource.
 */
Post.prototype.getByName = function(name, cb, forceLoad) {
  this.collection.get(name, cb, forceLoad);
};

/**
 * Get all posts.
 *
 * @param {Post~findAllCallback} cb - Callback delivering a list of posts.
 */
Post.prototype.findAll = function(cb) {
  this.collection.findAll(cb);
};

/**
 * Find other posts that are related to the given one.
 *
 * This function will look for the post given among the total collection of
 * posts and compare it to the rest of the posts in that collection.
 *
 * @param {String|Number} post - Name or index of post.
 * @param {Function} cb - Callback with related posts.
 */
Post.prototype.findRelated = function(post, cb) {
  throw Error('Post.findRelated not implemented');
};

/**
 * Store a post.
 *
 * @param {Object} post - The post to store.
 * @param {Function} cb - Callback
 */
Post.prototype.store = function(post, cb) {
  this.collection.store(post, cb);
};

/**
 * Register an event handler.
 */
Post.prototype.on = function(event, fn) {
  this.eventEmitter.on(event, fn);
};

/**
 * Callback supplying result of post.findAll operation
 *
 * @callback Post~findAllCallback
 * @param {Array.<Error>} errors - List of errors.
 * @param {Array} posts - List of posts.
 */

/**
 * Callback supplying result of post.getByName operation
 *
 * @callback Post~getByNameCallback
 * @param {Error} err - Error if failed.
 * @param {Object} post - Post object if successful.
 */

exports = module.exports = Post;
