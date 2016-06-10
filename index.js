var log      = require('./lib/log');
var reporter = require('./lib/reporter');
var rest     = require('./lib/rest');
var socket   = require('./lib/socket');
var cache    = require('tashmetu-cache');
var storage  = require('tashmetu-fs');
var events   = require('events');
var express  = require('express');
var fs       = require('fs');
var http     = require('http');
var _        = require('lodash');

var eventEmitter = new events.EventEmitter();
var modules = [];
var postTypes = {};
var factories = {};

load(rest);
load(socket);

function loadPost(name) {
  try {
    var post = storage.post(name, schema);
    if(post.status === 'published') {
      postTypes[post.type].process(post, function(result) {
        cache.storePost(result);
      });
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
  var tashmetu = this;

  modules.forEach(function(module) {
    if(module.init) {
      module.init(tashmetu, storage, cache, app);
    }
  });

  reporter(this, storage, cache);

  socket.forward(cache, 'post-changed');

  storage.on('post-added', loadPost);
  storage.on('post-changed', loadPost);

  storage.on('taxonomy-added', loadTaxonomy);
  storage.on('taxonomy-changed', loadTaxonomy);

  storage.on('ready', function() {
    var posts = cache.posts();
    posts.forEach(function(post, index) {
      post.related = findRelated(index, posts);
    });

    var server = http.Server(app);
    server.listen(port);

    eventEmitter.emit('ready', server, port);
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
  log: log,
  refresh: loadPost,
}
