var log   = require('../lib/log.js');
var chalk = require('chalk');
var _     = require('lodash');

function reporter(tashmetu, storage, cache) {
  storage.on('post-error', function(e) {
    log('ERR', 'post: ' + chalk.grey(e.name));
    if(e instanceof storage.ValidationException) {
      e.errors.forEach(function(error) {
        console.log('\n    ' + chalk.red(error.message) + '\n');
      });
    } else if(e instanceof storage.ParseException) {
      console.log('\n    ' + chalk.red(e.message) + '\n');
    }
  });

  cache.on('post-added', function(post) {
    log('ADD', 'post: ' + chalk.grey(post.name));
  });
  cache.on('post-changed', function(post) {
    log('UPD', 'post: ' + chalk.grey(post.name));
  });
  cache.on('post-removed', function(post) {
    log('REM', 'post: ' + chalk.grey(post.name));
  });
  cache.on('taxonomy-added', function(taxonomy) {
    log('ADD', 'taxonomy: ' + chalk.grey(taxonomy.name));
  });
  cache.on('taxonomy-changed', function(taxonomy) {
    log('UPD', 'taxonomy: ' + chalk.grey(taxonomy.name));
  });
  cache.on('taxonomy-removed', function(taxonomy) {
    log('REM', 'taxonomy: ' + chalk.grey(taxonomy.name));
  });

  tashmetu.on('post-list-requested', function(req) {
    log('GET', 'url: ' + chalk.grey(req.url));
  });
  tashmetu.on('post-list-sent', function(posts) {
    log('SEND', posts.length + ' posts');
  });
  tashmetu.on('taxonomy-requested', function(req) {
    log('GET', 'url: ' + chalk.grey(req.url));
  });
  tashmetu.on('taxonomy-sent', function(terms) {
    log('SEND', terms.length + ' terms');
  });
  tashmetu.on('content-requested', function(req) {
    log('GET', 'url: ' + chalk.grey(req.url));
  });
  tashmetu.on('content-sent', function(path) {
    log('SEND', 'file: ' + chalk.grey(path));
  });
  tashmetu.on('content-error', function(path) {
    log('ERR', 'file: ' + chalk.grey(path));
  });
  tashmetu.on('ready', function(port) {
    log('INFO', 'Tashmetu listens on post ' + port);
  });

  log('INFO', 'Starting Tashmetu, scanning content...');
}

module.exports = reporter;
