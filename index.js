var reporter = require('./lib/reporter')
var cache    = require('samizdat-tashmetu-cache');
var storage  = require('samizdat-tashmetu-fs');
var express  = require('express');
var _        = require('lodash');

var listeners = {
  posts:      { get: [], query: [], send: [] },
  taxonomies: { get: [], send: [] },
  content:    { get: [], send: [] },
};

function notify(type, action, args) {
  listeners[type][action].forEach(function(callback) {
    callback.apply(undefined, args);
  });
}

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
    notify('posts', 'query', [req]);
    res.setHeader('Content-Type', 'application/json');
    res.send(cache.posts());
    notify('posts', 'send', [cache.posts()]);
  });

  app.get('/:post/attachments/*', function(req, res){
    notify('content', 'get', [req]);
    var path = 'tashmetu/content/posts/' + req.params.post + '/attachments/' + req.params[0];
    res.sendFile(path, {root: '.'});
    notify('content', 'send', [path]);
  })

  app.get('/taxonomies/:taxonomy', function(req, res, next) {
    notify('taxonomies', 'get', [req]);
    var terms = cache.taxonomy(req.params.taxonomy).terms;
    res.setHeader('Content-Type', 'application/json');
    res.send(terms);
    notify('taxonomies', 'send', [terms]);
  });

  wireup(app, storage, cache);

  reporter(this, storage, cache);

  storage.watch('schemas', {
    add: function(name) {
      var obj = storage.schema(name);
      cache.storeSchema(obj);
    },
  });

  storage.watch('posts', {
    add:    function(name) { loadPost(name); },
    change: function(name) { loadPost(name); },
  });

  storage.watch('taxonomies', {
    add:    function(name) { loadTaxonomy(name); },
    change: function(name) { loadTaxonomy(name); },
  });

  storage.ready(function() {
    setupPostRelationships(cache.posts());
    app.listen(port);
    readyListeners.forEach(function(callback) {
      callback(port);
    });
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

function watch(type, handlers) {
  for(var action in handlers) {
    listeners[type][action].push(handlers[action]);
  }
};

// Default post comparison function
var comparePosts = function(a, b) {
  return _.intersection(a.tags, b.tags).length;
}

// Default post processing funtion
var processPost = function(post) {
  return post;
}

var readyListeners = [];

module.exports = {
  listen: listen,
  comparePosts: function(compare) { comparePosts = compare; },
  processPost: function(process) { processPost = process; },
  watch: watch,
  ready: function(callback) { readyListeners.push(callback); },
}
