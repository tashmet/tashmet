var events = require('events');
var _      = require('lodash');

var eventEmitter = new events.EventEmitter();


/**
 * @module post
 * @requires express
 * @requires storage
 * @requires cache
 * @requires factory
 *
 * @description
 * This service is responsible for loading posts from the storage into the
 * cache. During loading posts are processed and their relationships are
 * determined. This service also provides the routes necessary for a basic
 * post api.
 *
 * @fires post-list-requested
 * @fires post-list-sent
 */
exports = module.exports = function(app, storage, cache, factory) {
  var postService = this;

  /**
   * Post list requested event.
   * Fired when posts have been requested and contains the request object.
   *
   * @event post-list-requested
   * @type {Object}
   */

  /**
   * Post list sent event.
   * Fired when posts have been sent and contains the list of posts sent.
   *
   * @event post-list-sent
   * @type {Array}
   *
   * @example
   * post.on('post-list-sent', function(posts) {
   *   console.log(posts.length + ' posts sent.');
   * });
   */


  function load(name) {
    var post = storage.post(name, factory.schema);
    if(post.status === 'published') {
      factory.process(post, function(result) {
        cache.storePost(result);
        eventEmitter.emit('post-added', result);
      });
      return post;
    } else {
      if(cache.post(name)) {
        cache.removePost(name);
        eventEmitter.emit('post-removed', result);
      }
      return undefined;
    }
  }

  function loadPostSilent(name) {
    try {
      load(name);
    } catch(e) {}
  }

  /**
   * Get a post by its name.
   *
   * @param {String} name - Name of the post
   * @param {Boolean} forceLoad - Read the post from data source rather than
   *    returning the cached version.
   */
  this.getByName = function(name, forceLoad) {
    if(forceLoad) {
      return load(name);
    } else {
      return cache.post(name);
    }
  };

  /**
   * Get all posts.
   *
   * @returns {Array} A list of posts.
   */
  this.findAll = function() {
    return cache.posts();
  };

  /**
   * Store a post.
   *
   * TODO: This, rather than storage, should handle validation.
   */
  this.store = function(post) {
    storage.storePost(post);
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


  /*
   * Wire-up event handlers
   */
  storage.on('post-added', loadPostSilent);
  storage.on('post-changed', loadPostSilent);
  storage.on('post-removed', cache.removePost);

  storage.on('ready', function() {
    postService.findAll().forEach(function(post, index) {
      post.related = postService.findRelated(index);
    });

    eventEmitter.emit('ready');
  });

  /*
   * Wire-up routes
   */
  app.get('/posts', function getPosts(req, res, next) {
    eventEmitter.emit('post-list-requested', req);
    res.setHeader('Content-Type', 'application/json');
    res.send(postService.findAll());
    eventEmitter.emit('post-list-sent', postService.findAll());
  });

  return this;
};
