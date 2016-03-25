var post     = require('./src/server/post.js');
var taxonomy = require('./src/server/taxonomy.js');
var cache    = require('./src/server/cache.js');
var express  = require('express');
var chokidar = require('chokidar');
var chalk    = require('chalk');
var log      = require('fancy-log');

var app = null;

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
  } catch(e) {
    log(chalk.red('YAML Parsing error:'));
    console.log(' > ' + chalk.cyan(path) + ' line ' + chalk.magenta(e.mark.line));
    console.log(' > ' + e.message);
  }
}

function listen(port, wireup) {
  app = express();
  var server = null;

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
    .on('add', loadPost)
    .on('ready', function() {
      if(!server) {
        server = app.listen(port);
        log("Tashmetu listens on port " + chalk.magenta(port));
      }
    });
  chokidar.watch('./content/posts').on('change', loadPost);
}

module.exports = {
  listen: listen,
  log: log,
  posts: cache.posts
}
