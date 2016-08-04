var async  = require('async');
var events = require('events');
var fs     = require('fs');
var join   = require('path').join;
var util   = require('util');
var _      = require('lodash');

var eventEmitter = new events.EventEmitter();


function PostLoader(cache, factory, validator) {
  var postLoader = this;

  function addCache(post) {
    if(cache.put('post', post.name, post)) {
      eventEmitter.emit('post-added', post);
    } else {
      eventEmitter.emit('post-changed', post);
    }
  }

  function remCache(post) {
    if(cache.get('post', post.name)) {
      cache.remove('post', post.name);
      eventEmitter.emit('post-removed', post);
    }
  }

  function process(post, cb) {
    factory.process(post, function(result) {
      if(result.status === 'published') {
        addCache(result);
      } else {
        remCache(result);
      }
      cb(null, post);
    });
  }

  this.load = function(post, path, query, cb) {
    try {
      var stat = fs.lstatSync(path);
      post.name = query.name;
      post.modified = stat.mtime;
      postLoader.validate(post, cb, function() {
        process(post, cb);
      });
    } catch(e) {
      cb(new Error('Adding post meta information: ' + e.message));
    }
  };

  this.serialize = function(post, path, query, cb) {
    delete post.name;
    delete post.modified;
    cb(null, post);
  };

  this.validate = function(post, fail, success) {
    var schema = factory.schema(post.type || 'post');
    if(!schema) {
      fail(new Error('Could not find schema: "' + post.type + '"'));
    } else {
      validator.check(post, schema, function(err) {
        if(err) {
          fail(err);
        } else {
          success();
        }
      });
    }
  };
}


/**
 * @module post
 * @requires express
 * @requires storage
 * @requires cache
 * @requires factory
 * @requires markdown
 * @requires validator
 * @requires socket
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
exports = module.exports = function(
  app, storage, cache, factory, yaml, validator, socket)
{
  /**
   * Callback supplying result of post.findAll operation
   *
   * @callback module:post.findAllCallback
   * @param {Array.<module:post.PostError>} errors - List of errors.
   * @param {Array} posts - List of posts.
   */

  /**
   * Callback supplying result of post.getByName operation
   *
   * @callback module:post.getByNameCallback
   * @param {Error|module:post.PostError} err - Error if failed.
   * @param {Object} post - Post object if successful.
   */

  var postService = this;
  var allPostsCached = false;
  var postLoader = new PostLoader(cache, factory, validator);

  /*
   * Create our post resource and subscribe to the events it generates.
   */
  var resource = storage.resource('post', {
    pattern: 'posts/{name}.md',
    loaders:  [yaml, postLoader]
  });

  resource.on('resource-added', onPost);
  resource.on('resource-changed', onPost);
  resource.on('resource-removed', remove);

  function onPost(ev) {
    resource.get({name: ev.name}, function(err, post, path) {
      if(err) {
        err = new postService.PostError(ev.name, err.message);
        eventEmitter.emit('post-error', err);
      }
    });
  }

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


  /**
   * Post error
   *
   * @typedef {Object} module:post.PostError
   * @property {String} postName - Name of the post.
   * @property {String} message - Error message.
   */
  this.PostError = function(postName, message) {
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.message = message;
    this.name = 'PostError';
    this.postName = postName;
  };

  util.inherits(this.PostError, Error);

  /**
   * Get a post by its name.
   *
   * @param {String} name - Name of the post
   * @param {module:post.getByNameCallback} cb - Callback delivering the post.
   * @param {Boolean} forceLoad - Ignore cached data and force it to be loaded
   *    from the resource.
   */
  this.getByName = function(name, cb, forceLoad) {
    var post;
    if(!forceLoad) {
      post = cache.get('post', name);
    }
    if(!post) {
      resource.get({name: name}, function(err, post, path) {
        err = err ? new postService.PostError(name, err.message) : err;
        cb(err, post);
      });
    } else {
      cb(null, post);
    }
  };

  /**
   * Get all posts.
   *
   * @param {module:post.findAllCallback} cb - Callback delivering a list of posts.
   * @param {Object} options
   */
  this.findAll = function(cb) {
    if(allPostsCached) {
      cb(false, cache.list('post'));
    } else {
      resource.findAll(function(err, posts) {
        var errors = _.transform(err, function(result, e) {
          result.push(new postService.PostError(e.query.name, e.message));
        });
        cb(errors, posts);
      });
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
   * @param {Function} cb - Callback with related posts.
   */
  this.findRelated = function(post, cb) {
    postService.findAll(function(err, posts) {
      var index = _.isString(post) ? _.findIndex(posts, ['name', post]) : post;
      var related = [];
      var rest = posts.slice(0);

      post = posts[index];
      rest.splice(index, 1);
      rest.forEach(function(other) {
        var score = factory.compare(post, other);
        if (score > 0) {
          related.push({post: other, score: score});
        }
      });
      related = _.orderBy(related, 'score', 'desc');

      var result = _.transform(related, function(result, value, key) {
        result.push(value.post);
      });

      cb(err, result);
    });
  };

  /**
   * Store a post.
   *
   * @param {Object} post - The post to store.
   * @param {Function} cb - Callback
   */
  this.store = function(post, cb) {
    postLoader.validate(post, cb, function() {
      resource.store({name: post.name}, post, cb);
    });
  };


  /**
   * Register an event handler.
   */
  this.on = function(event, fn) {
    eventEmitter.on(event, fn);
  };

  function remove(name) {
    cache.remove('post', name);
  }

  storage.on('ready', function() {
    allPostsCached = true;
    postService.findAll(function(err, posts) {
      posts.forEach(function(post, index) {
        postService.findRelated(index, function(err, related) {
          post.related = _.map(related, function(post) {
            return post.name;
          });
        });
      });
      eventEmitter.emit('ready');
    });
  });

  socket.forward(this, 'post-added');
  socket.forward(this, 'post-changed');
  socket.forward(this, 'post-removed');

  /*
   * Wire-up routes
   */
  app.get('/api/posts', function getPosts(req, res, next) {
    eventEmitter.emit('post-list-requested', req);
    res.setHeader('Content-Type', 'application/json');
    postService.findAll(function(err, posts) {
      res.send(posts);
      eventEmitter.emit('post-list-sent', posts);
    });
  });

  return this;
};
