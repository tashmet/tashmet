var cache    = require('samizdat-tashmetu-cache');
var storage  = require('samizdat-tashmetu-fs');
var express  = require('express');
var chalk    = require('chalk');
var _        = require('lodash');

var app = null;
var log = function() {};

function loadPost(name, loading) {
  try {
    var post = storage.post(name, cache.schema);

    if(cache.storePost(post)) {
      log("Added post: " + chalk.cyan(name));
    } else {
      log("Updated post: " + chalk.cyan(name));
    }
  } catch(e) {
    if(e instanceof storage.ValidationException) {
      log(chalk.red('Failed to validate: ') + name);
      e.errors.forEach(function(error) {
        console.log('  ' + error.message);
      });
    } else if(e instanceof storage.ParseException) {
      log(chalk.red('Failed to parse: ') + e.path);
      console.log('  ' + e.message);
    }
    if(loading) {
      process.exit();
    }
  }
}


function listen(port, logger, wireup) {
  var loading = true;
  log = logger;
  app = express();

  app.get('/posts', function(req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    res.send(cache.posts());
  });

  app.get('/:post/attachments/*', function(req, res){
    var path = 'posts/' + req.params.post + '/attachments/' + req.params[0];
    res.sendFile(path, {root: './tashmetu/content'});
  });

  app.get('/taxonomies/:taxonomy', function(req, res, next) {
    var tax = taxonomy.load(req.params.taxonomy);
    res.setHeader('Content-Type', 'application/json');
    res.send(tax);
  });

  wireup(app, storage, cache);

  storage.watch('schemas', {
    add: function(name) {
      var obj = storage.schema(name);
      cache.storeSchema(obj);
      log('Added schema: ' + chalk.cyan(obj.id));
    }
  });

  storage.watch('posts', {
    add:    function(name) { loadPost(name, loading); },
    change: function(name) { loadPost(name, loading); },
  });

  storage.ready(function() {
    setupPostRelationships(cache.posts());
    app.listen(port);
    loading = false;
    log("Tashmetu listens on port " + chalk.magenta(port));
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
  log("Setting up post relationships");
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

module.exports = {
  listen: listen,
  comparePosts: function(compare) { comparePosts = compare; },
}
