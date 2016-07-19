var events = require('events');
var _      = require('lodash');

var eventEmitter = new events.EventEmitter();


/**
 * @module loader
 * @requires storage
 * @requires cache
 * @requires factory
 * @requires log
 *
 * @description
 * This service is responsible for loading content from the storage into the
 * cache, processing posts and setting up their relationships.
 */
exports = module.exports = function(storage, cache, factory, log) {
  var loader = this;

  /**
   * Start the loader, listening for new content to add.
   *
   * This function will start listening to content from the storage which will
   * scan the content loading files as they are detected. Once the initial scan
   * has been completed and everything has been loaded, a 'ready' event will be
   * emitted.
   *
   * @fires ready
   */
  this.run = function() {
    storage.listen();
  };

  /**
   * Trigger loading of a post given its name.
   *
   * This function will load a post from the storage into the cache. This
   * is automatically called on file changes, but can also be triggered
   * manually. This is useful when content related to the post has changed
   * and we want the post to be processed again.
   *
   * @param {String} name - Name of the post
   */
  this.load = function(name) {
    var post = storage.post(name, factory.schema);
    if(post.status === 'published') {
      factory.process(post, function(result) {
        cache.storePost(result);
      });
    } else if(cache.post(name)) {
      cache.removePost(name);
    }
  };

  /**
   * Find other posts that are related to the given one.
   *
   * This function will look for the post given among the total collection of
   * posts and compare it to the rest of the posts in that collection.
   * The comparison is done by using the 'compare' function for the post type
   * of the post given.
   *
   * @param {String|Number} post - Name or index of post.
   * @param {Array} [other] - Specify The collection of posts to search among.
            If no posts are given this will default to getting all posts in
            the cache.
   * @returns {Array} List of related posts
   */
  this.findRelated = function(post, other) {
    var posts = other || cache.posts();
    var index = _.isString(post) ? _.findIndex(posts, ['name', post]) : post;
    var related = [];
    var rest = posts.slice(0);
    post = posts[index];

    rest.splice(index, 1);
    rest.forEach(function(other) {
      var score = factory.compare(post, other);
      if (score > 0) {
        related.push({name: other.name, score: score});
      }
    });
    related = _.orderBy(related, 'score', 'desc');

    return _.transform(related, function(result, value, key) {
      result.push(value.name);
    });
  };

  /**
   * Register an event handler.
   */
  this.on = function(event, fn) {
    eventEmitter.on(event, fn);
  };

  function loadPostSilent(name) {
    try {
      loader.load(name);
    } catch(e) {}
  }

  function loadTaxonomy(name) {
    cache.storeTaxonomy(storage.taxonomy(name));
  }


  /*
   * Wire-up event handlers
   */
  storage.on('post-added', loadPostSilent);
  storage.on('post-changed', loadPostSilent);
  storage.on('post-removed', cache.removePost);

  storage.on('taxonomy-added', loadTaxonomy);
  storage.on('taxonomy-changed', loadTaxonomy);

  storage.on('ready', function() {
    cache.posts().forEach(function(post, index) {
      post.related = loader.findRelated(index);
    });

    eventEmitter.emit('ready');
  });

  return loader;
};
