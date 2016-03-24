var post     = require('./src/server/post.js');
var taxonomy = require('./src/server/taxonomy.js');
var express  = require('express');
var chokidar = require('chokidar');
var chalk    = require('chalk');
var log      = require('fancy-log');

var posts = [];

function watch() {
  var postWatcher = chokidar.watch('./content/posts', {ignored: /[\/\\]\./});

  postWatcher.on('change', function(path) {
    var postName = path.split('/')[2];
    try {
      var postObj = post.load(postName);
      for(var i=0; i<posts.length; i++) {
        if(posts[i].name == postName) {
          posts[i] = postObj;
          log("Updated post '" + chalk.cyan(postName) + "'");
          break;
        }
      }
    } catch(e) {
      log(chalk.red('YAML Parsing error:'));
      console.log(' > ' + chalk.cyan(path) + ' line ' + chalk.magenta(e.mark.line));
      console.log(' > ' + e.message);
    }
  });
}

function main(server) {
  posts = post.loadAll();

  posts.forEach(function(post) {
    server.use('/' + post.name + '/attachments',
      express.static('./content/posts/' + post.name + '/attachments'));
  });

  server.get('/posts', function(req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    res.send(posts);
  });

  server.get('/taxonomies/:taxonomy', function(req, res, next) {
    var tax = taxonomy.load(req.params.taxonomy);
    res.setHeader('Content-Type', 'application/json');
    res.send(tax);
  });
}

function getPosts() {
  return posts;
}

module.exports = {
  configure: main,
  watch: watch,
  posts: getPosts
}
