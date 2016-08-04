var async  = require('async');
var events = require('events');
var fs     = require('fs');
var join   = require('path').join;
var util   = require('util');
var _      = require('lodash');

var eventEmitter = new events.EventEmitter();

var meta = {
  input: function(post, path, query, cb) {
    try {
      var stat = fs.lstatSync(path);
      post.name = query.name;
      post.modified = stat.mtime;
      cb(null, post);
    } catch(e) {
      cb(new Error('Adding post meta information: ' + e.message));
    }
  },

  output: function(post, path, query, cb) {
    delete post.name;
    delete post.modified;
    cb(null, post);
  }
};


/**
 * @module post
 * @requires express
 * @requires storage
 * @requires database
 * @requires factory
 * @requires yaml
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
  app, storage, db, factory, yaml, validator, socket)
{
  var postService = this;

  var process = {
    input: function(post, path, query, cb) {
      factory.process(post, function(result) {
        cb(null, post);
      });
    },

    output: function(post, path, query, cb) {
      cb(null, post);
    }
  };

  var validate = validator.createPipe();

  validate.schema(function(obj, cb) {
    var type = obj.type || 'post';
    var schema = factory.schema(type);
    if(schema) {
      cb(null, schema);
    } else {
      cb(new Error('Could not find schema: "' + type + '"'));
    }
  });


  var collection = db.collection(storage.resource('post', {
    pattern: 'posts/{name}.md',
    pipeline: [yaml, meta, validate, process]
  }));

  collection.exclude(function(obj) {
    return obj.status !== 'published';
  });

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

  storage.on('ready', function() {
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


  app.get('/api/posts', function getPosts(req, res, next) {
    eventEmitter.emit('post-list-requested', req);
    res.setHeader('Content-Type', 'application/json');
    postService.findAll(function(err, posts) {
      res.send(posts);
      eventEmitter.emit('post-list-sent', posts);
    });
  });

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

  /**
   * Get a post by its name.
   *
   * @param {String} name - Name of the post
   * @param {module:post.getByNameCallback} cb - Callback delivering the post.
   * @param {Boolean} forceLoad - Ignore cached data and force it to be loaded
   *    from the resource.
   */
  this.getByName = function(name, cb, forceLoad) {
    collection.get({name: name}, cb, forceLoad);
  };

  /**
   * Get all posts.
   *
   * @param {module:post.findAllCallback} cb - Callback delivering a list of posts.
   */
  this.findAll = function(cb) {
    collection.findAll(cb);
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
    collection.store({name: post.name}, post, cb);
  };


  /**
   * Register an event handler.
   */
  this.on = function(event, fn) {
    eventEmitter.on(event, fn);
  };

  socket.forward(this, ['post-added', 'post-changed', 'post-removed']);

  return this;
};
