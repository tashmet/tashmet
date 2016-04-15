var post     = require('./lib/post.js');
var taxonomy = require('./lib/taxonomy.js');
var factory  = require('./lib/factory.js');
var schema   = require('./lib/schema.js');
var notify   = require('./lib/notification.js');
var util     = require('./lib/util.js')
var cache    = require('samizdat-tashmetu-cache');
var express  = require('express');
var chokidar = require('chokidar');
var chalk    = require('chalk');
var log      = require('fancy-log');
var _        = require('lodash');

function postName(path) {
  return path.split('/')[3];
}

function loadPost(path) {
  var obj = post.load(postName(path));
  var schemaObj = cache.schema(obj.type || 'Post');
  if(schemaObj) {
    schema.validate(obj, schemaObj);
  }
  if(cache.storePost(obj)) {
    log("Added post: " + chalk.cyan(obj.name));
  } else {
    log("Updated post: " + chalk.cyan(obj.name));
  }
  return obj;
}

function createPost(fact, data) {
  if (_.isString(fact)) {
    fact = factory(fact);
  }
  return post.store(fact.create(data));
}

function listen(port, wireup) {
  var loading = true;
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

  wireup(app);

  chokidar.watch('./tashmetu/schemas')
    .on('add', function(path) {
      var obj = schema.load(path);
      cache.storeSchema(obj);
      log('Added schema: ' + chalk.cyan(obj.id));
    });

  chokidar.watch('./tashmetu/content/posts/*/post.md')
    .on('add', function(path) {
      onPost('add', path, loading);
    })
    .on('ready', function() {
      log("Finished loading " + chalk.magenta(cache.posts().length) + " posts");

      // watch for changes to post (*.md or *.yml files)
      // TODO: Fix ignore pattern {ignored: /^(.*\.(?!(md|yml)$))?[^.]*$/ig})
      chokidar.watch('./tashmetu/content/posts')
        .on('change', function(path) {
          onPost('change', path, false);
        })

      // watch for changes to post data (not *.md or *.yml files)
      chokidar.watch('./tashmetu/content/posts', {ignored: /^(.*\.((md|yml)$))/})
        .on('change', function(path) { onPostData('change', path); })
        .on('add',    function(path) { onPostData('add', path); })
        .on('unlink', function(path) { onPostData('remove', path); })
        .on('ready',  function() {
          setupPostRelationships(cache.posts());
          app.listen(port);
          loading = false;
          log("Tashmetu listens on port " + chalk.magenta(port));
        })
    });
}

function onPost(action, path, loading) {
  try {
    notify.post(action, loadPost(path));
  } catch(e) {
    if(e instanceof schema.ValidationException) {
      log(chalk.red('Failed to validate: ') + path);
      e.errors.forEach(function(error) {
        console.log('  ' + error.message);
      });
    } else if(e instanceof post.ParseException) {
      log(chalk.red('Failed to parse: ') + e.path);
      console.log('  ' + e.message);
    }
    if(loading) {
      process.exit();
    }
  }
}

function onPostData(action, path) {
  var obj = cache.post(postName(path));
  notify.postData(action, obj, path);
}

function setupPostRelationships(posts) {
  log("Setting up post relationships");
  posts.forEach(function(obj, index) {
    var rest = posts.slice(0);
    rest.splice(index, 1);
    obj.related = post.findRelated(obj, rest, comparePosts);
  });
}

// Default post comparison function
var comparePosts = function(a, b) {
  return _.intersection(a.tags, b.tags).length;
}

module.exports = {
  listen: listen,
  log: log,
  posts: cache.posts,
  comparePosts: function(compare) { comparePosts = compare; },
  watchPosts: notify.watchPosts,
  watchPostData: notify.watchPostData,
  factory: factory.load,
  factories: factory.loadAll,
  createPost: createPost,
}
