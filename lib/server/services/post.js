var Post   = require('../../common/post.js');
var events = require('events');
var fs     = require('fs');
var util   = require('util');
var _      = require('lodash');

var eventEmitter = new events.EventEmitter();

function PostService(
  rest, storage, cache, factory, yaml, validator, socket, author, pipe)
{
  var postService = this;

  function validate(post, options, cb) {
    var type = post.type || 'post';
    var schema = factory.schema(type);
    if(schema) {
      validator.check(post, schema, function(err) {
        cb(err, post);
      });
    } else {
      cb(new Error('Could not find schema: "' + type + '"'));
    }
  }

  var inputPipe = new pipe.Pipeline()
    .step('parse yaml', function(data, options, cb) {
      yaml.parse(data, cb, true);
    })
    .step('add meta data', function(post, options, cb) {
      try {
        var stat = fs.lstatSync(options.path);
        post.modified = stat.mtime;
        post.__id = options.query.id;
        cb(null, post);
      } catch(e) {
        cb(new Error('Adding post meta information: ' + e.message));
      }
    })
    .step('validate', validate)
    .step('add author details', function(post, options, cb) {
      author.getByName(post.author, function(err, obj) {
        if(!err) {
          post.author = obj;
          cb(null, post);
        } else {
          cb(new Error('Could not find author: ' + post.author));
        }
      });
    })
    .step('process', function(post, options, cb) {
      factory.process(post, function(result) {
        cb(null, post);
      });
    });

  var outputPipe = new pipe.Pipeline()
    .step('remove author details', function(post, options, cb) {
      post.author = post.author.__id;
      cb(null, post);
    })
    .step('remove meta data', function(post, options, cb) {
      delete post.modified;
      cb(null, post);
    })
    .step('validate', validate)
    .step('serialize yaml', function(post, options, cb) {
      yaml.serialize(post, cb);
    });

  var collection = cache.collection(storage.directory('posts', {
    extension: 'md',
    input: inputPipe,
    output: outputPipe
  }));

  collection.exclude(function(obj) {
    return obj.status !== 'published';
  });

  author.on('ready', function() {
    collection.sync();
  });

  collection.on('ready', function() {
    postService.findAll(function(err, posts) {
      posts.forEach(function(post, index) {
        postService.findRelated(index, function(err, related) {
          post.related = _.map(related, function(post) {
            return post.__id;
          });
        });
      });
      eventEmitter.emit('ready');
    });
  });

  rest.collection('posts', collection);

  Post.call(this, collection, eventEmitter);

  socket.forward(this, ['post-added', 'post-changed', 'post-removed']);

  this.findRelated = function(post, cb) {
    Post.prototype.findAll.call(this, function(err, posts) {
      var index = _.isString(post) ? _.findIndex(posts, ['__id', post]) : post;
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
}

util.inherits(PostService, Post);

/**
 * @module post
 * @requires rest
 * @requires storage
 * @requires cache
 * @requires factory
 * @requires yaml
 * @requires validator
 * @requires socket
 * @requires author
 * @requires pipeline
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
  rest, storage, cache, factory, yaml, validator, socket, author, pipe)
{
  return new PostService(
    rest, storage, cache, factory, yaml, validator, socket, author, pipe);

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
};
