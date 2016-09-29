var fs = require('fs');
var _  = require('lodash');

/**
 * Posts collection
 */
exports = module.exports = function(factory) {
  function input(pipe, database) { pipe
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
    .step('add author details', function(post, options, cb) {
      database.collection('authors').get(post.author, function(err, obj) {
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
  }

  function output(pipe, database) { pipe
    .step('remove author details', function(post, options, cb) {
      post.author = post.author.__id;
      cb(null, post);
    })
    .step('remove meta data', function(post, options, cb) {
      delete post.modified;
      cb(null, post);
    });
  }

  function findRelated(post, collection, cb) {
    collection.findAll(function(err, posts) {
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
  }

  function calculateRelationships(collection) {
    collection.findAll(function(err, posts) {
      posts.forEach(function(post, index) {
        findRelated(index, collection, function(err, related) {
          post.related = _.map(related, function(post) {
            return post.__id;
          });
        });
      });
    });
  }

  return {
    dependencies: ['authors'],
    share: true,
    sync: true,
    frontMatter: true,
    extension: 'md',
    input: input,
    schema: function(obj) {
      return factory.schema(obj.type || 'post');
    },
    exclude: function(obj) {
      return obj.status !== 'published';
    },
    done: function(collection) {
      calculateRelationships(collection);
    }
  };
};
