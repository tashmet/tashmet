var reporter = require('./lib/reporter')
var cache    = require('tashmetu-cache');
var storage  = require('tashmetu-fs');
var events   = require('events');
var express  = require('express');
var fs       = require('fs');
var _        = require('lodash');

var eventEmitter = new events.EventEmitter();
var modules = [];
var postTypes = {};
var factories = {};

function loadPost(name) {
  try {
    var post = storage.post(name, schema);
    if(post.status === 'published') {
      cache.storePost(postTypes[post.type].process(post));
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

function listen(port) {
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
    res.sendFile(path, {root: '.'}, function(err) {
      if(err) {
        eventEmitter.emit('content-error', path);
      } else {
        eventEmitter.emit('content-sent', path);
      }
    });
  });

  app.get('/taxonomies/:taxonomy', function(req, res, next) {
    eventEmitter.emit('taxonomy-requested', req);
    var terms = cache.taxonomy(req.params.taxonomy).terms;
    res.setHeader('Content-Type', 'application/json');
    res.send(terms);
    eventEmitter.emit('taxonomy-sent', terms);
  });

  modules.forEach(function(module) {
    if(module.route) {
      module.route(app, storage, cache);
    }
  });

  reporter(this, storage, cache);

  storage.on('post-added', loadPost);
  storage.on('post-changed', loadPost);

  storage.on('taxonomy-added', loadTaxonomy);
  storage.on('taxonomy-changed', loadTaxonomy);

  storage.on('ready', function() {
    var posts = cache.posts();
    posts.forEach(function(post, index) {
      post.related = findRelated(index, posts);
    });
    app.listen(port);
    eventEmitter.emit('ready', port);
  });

  storage.listen();
}

function findRelated(post, posts) {
  var index = _.isString(post) ? _.findIndex(posts, ['name', post]) : post;
  var related = [];
  var post = posts[index];
  var rest = posts.slice(0);

  rest.splice(index, 1);
  rest.forEach(function(other) {
    var score = postTypes[post.type].compare(post, other);
    if (score > 0) {
      related.push({name: other.name, score: score});
    }
  });
  related = _.orderBy(related, 'score', 'desc');

  return _.transform(related, function(result, value, key) {
    result.push(value.name);
  });
}

function load(module) {
  if(_.isString(module)) {
    module = require(module);
  }
  if(module.posts) {
    module.posts.forEach(function(postType) {
      postTypes[postType.name] = postType;
    });
  }
  if(module.factories) {
    module.factories.forEach(function(factory) {
      factories[factory.name] = factory;
    });
  }
  modules.push(module);
  if(module.dependencies) {
    module.dependencies.forEach(function(dep) {
      load(dep);
    });
  }
}

function schema(type) {
  if(postTypes[type]) {
    return postTypes[type].schema;
  } else {
    return null;
  }
}

module.exports = {
  listen: listen,
  load: load,
  on: function(event, fn) {
    eventEmitter.on(event, fn);
  },
  factories: function() {
    return factories;
  },
  schema: schema,
  findRelated: findRelated,
}
