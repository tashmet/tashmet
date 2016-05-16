var reporter = require('./lib/reporter')
var cache    = require('tashmetu-cache');
var storage  = require('tashmetu-fs');
var events   = require('events');
var express  = require('express');
var _        = require('lodash');

var eventEmitter = new events.EventEmitter();

function loadPost(name) {
  try {
    var post = storage.post(name, cache.schema);
    if(post.status === 'published') {
      cache.storePost(processPost(post));
    } else {
      if(cache.post(name)) {
        cache.removePost(name);
      }
    }
  } catch(e) {}
}

function loadTaxonomy(name) {
  cache.storeTaxonomy(storage.taxonomy(name));
}

function listen(port, wireup) {
  var app = express();

  app.get('/posts', function(req, res, next) {
    eventEmitter.emit('post-list-requested', req);
    res.setHeader('Content-Type', 'application/json');
    res.send(cache.posts());
    eventEmitter.emit('post-list-sent', cache.posts());
  });

  app.get('/:post/attachments/*', function(req, res){
    eventEmitter.emit('content-requested', req);
    var path = 'tashmetu/content/posts/' + req.params.post + '/attachments/' + req.params[0];
    res.sendFile(path, {root: '.'});
    eventEmitter.emit('content-sent', path);
  })

  app.get('/taxonomies/:taxonomy', function(req, res, next) {
    eventEmitter.emit('taxonomy-requested', req);
    var terms = cache.taxonomy(req.params.taxonomy).terms;
    res.setHeader('Content-Type', 'application/json');
    res.send(terms);
    eventEmitter.emit('taxonomy-sent', terms);
  });

  wireup(app, storage, cache);

  reporter(this, storage, cache);

  storage.on('schema-added', function(name) {
    cache.storeSchema(storage.schema(name));
  });

  storage.on('post-added', loadPost);
  storage.on('post-changed', loadPost);

  storage.on('taxonomy-added', loadTaxonomy);
  storage.on('taxonomy-changed', loadTaxonomy);

  storage.on('ready', function() {
    setupPostRelationships(cache.posts());
    app.listen(port);
    eventEmitter.emit('ready', port);
  });

  storage.listen();
}

function findRelatedPosts(post, rest, compare) {
  var related = [];
  rest.forEach(function(other) {
    var score = compare(post, other);
    if (score > 0) {
      related.push({name: other.name, score: score});
    }
  });
  related = _.orderBy(related, 'score', 'desc');

  return _.transform(related, function(result, value, key) {
    result.push(value.name);
  });
}

function setupPostRelationships(posts) {
  posts.forEach(function(obj, index) {
    var rest = posts.slice(0);
    rest.splice(index, 1);
    obj.related = findRelatedPosts(obj, rest, comparePosts);
  });
}

// Default post comparison function
var comparePosts = function(a, b) {
  return _.intersection(a.tags, b.tags).length;
}

// Default post processing funtion
var processPost = function(post) {
  return post;
}

module.exports = {
  listen: listen,
  comparePosts: function(compare) { comparePosts = compare; },
  processPost: function(process) { processPost = process; },
  on: function(event, fn) {
    eventEmitter.on(event, fn);
  },
}
