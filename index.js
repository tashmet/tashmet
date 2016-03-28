var post     = require('./lib/post.js');
var taxonomy = require('./lib/taxonomy.js');
var cache    = require('./lib/cache.js');
var notify   = require('./lib/notification.js');
var express  = require('express');
var chokidar = require('chokidar');
var chalk    = require('chalk');
var log      = require('fancy-log');

function postName(path) {
  return path.split('/')[2];
}

function loadPost(path) {
  try {
    var obj = post.load(postName(path));
    if(cache.storePost(obj)) {
      log("Added post: " + chalk.cyan(obj.name));
    } else {
      log("Updated post: " + chalk.cyan(obj.name));
    }
    return obj;
  } catch(e) {
    log(chalk.red('YAML Parsing error:'));
    console.log(' > ' + chalk.cyan(path) + ' line ' + chalk.magenta(e.mark.line));
    console.log(' > ' + e.message);
    return false;
  }
}

function listen(port, wireup) {
  app = express();

  app.get('/posts', function(req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    res.send(cache.posts());
  });

  app.get('/:post/attachments/*', function(req, res){
    var path = 'posts/' + req.params.post + '/attachments/' + req.params[0];
    res.sendFile(path, {root: './content'});
  });

  app.get('/taxonomies/:taxonomy', function(req, res, next) {
    var tax = taxonomy.load(req.params.taxonomy);
    res.setHeader('Content-Type', 'application/json');
    res.send(tax);
  });

  wireup(app);

  chokidar.watch('./content/posts/*/post.md')
    .on('add', function(path) {
      var obj = loadPost(path);
      if(obj) {
        notify.post('add', obj);
      }
    })
    .on('ready', function() {
      log("Finished loading " + chalk.magenta(cache.posts().length) + " posts");

      // watch for changes to post (*.md or *.yml files)
      // TODO: Fix ignore pattern {ignored: /^(.*\.(?!(md|yml)$))?[^.]*$/ig})
      chokidar.watch('./content/posts')
        .on('change', loadPost)

      // watch for changes to post data (not *.md or *.yml files)
      chokidar.watch('./content/posts', {ignored: /^(.*\.((md|yml)$))/})
        .on('change', function(path) { onPostData('change', path); })
        .on('add',    function(path) { onPostData('add', path); })
        .on('unlink', function(path) { onPostData('remove', path); })
        .on('ready',  function() {
          app.listen(port);
          log("Tashmetu listens on port " + chalk.magenta(port));
        })
    });
}

function onPostData(action, path) {
  var obj = cache.post(postName(path));
  notify.postData(action, obj, path);
}

module.exports = {
  listen: listen,
  log: log,
  posts: cache.posts,
  onPost: notify.onPost,
  onPostData: notify.onPostData,
}
