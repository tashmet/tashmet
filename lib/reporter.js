var chalk = require('chalk');
var log   = require('fancy-log');
var _     = require('lodash');

function reporter(tashmetu, storage, cache) {
  function entry(type, msg) {
    var padded = _.padEnd(type, 4);
    var color;
    switch(type) {
      case 'ADD':
      case 'UPD':
      case 'REM':
      case 'SEND':
        color = chalk.green;
        break;
      case 'ERR':
        color = chalk.red;
        break;
      default:
        color = chalk.cyan;
        break;
    }
    log('[ ' + color(padded) + ' ] ' + msg);
  }

  storage.on('post-error', function(e) {
    entry('ERR', 'post: ' + chalk.grey(e.name));
    if(e instanceof storage.ValidationException) {
      e.errors.forEach(function(error) {
        console.log('\n    ' + chalk.red(error.message) + '\n');
      });
    } else if(e instanceof storage.ParseException) {
      console.log('\n    ' + chalk.red(e.message) + '\n');
    }
  });

  cache.on('post-added', function(post) {
    entry('ADD', 'post: ' + chalk.grey(post.name));
  });
  cache.on('post-changed', function(post) {
    entry('UPD', 'post: ' + chalk.grey(post.name));
  });
  cache.on('post-removed', function(post) {
    entry('REM', 'post: ' + chalk.grey(post.name));
  });
  cache.on('taxonomy-added', function(taxonomy) {
    entry('ADD', 'taxonomy: ' + chalk.grey(taxonomy.name));
  });
  cache.on('taxonomy-changed', function(taxonomy) {
    entry('UPD', 'taxonomy: ' + chalk.grey(taxonomy.name));
  });
  cache.on('taxonomy-removed', function(taxonomy) {
    entry('REM', 'taxonomy: ' + chalk.grey(taxonomy.name));
  });

  tashmetu.on('post-list-requested', function(req) {
    entry('GET', 'url: ' + chalk.grey(req.url));
  });
  tashmetu.on('post-list-sent', function(posts) {
    entry('SEND', posts.length + ' posts');
  });
  tashmetu.on('taxonomy-requested', function(req) {
    entry('GET', 'url: ' + chalk.grey(req.url));
  });
  tashmetu.on('taxonomy-sent', function(terms) {
    entry('SEND', terms.length + ' terms');
  });
  tashmetu.on('content-requested', function(req) {
    entry('GET', 'url: ' + chalk.grey(req.url));
  });
  tashmetu.on('content-sent', function(path) {
    entry('SEND', 'file: ' + chalk.grey(path));
  });
  tashmetu.on('content-error', function(path) {
    entry('ERR', 'file: ' + chalk.grey(path));
  });
  tashmetu.on('ready', function(port) {
    entry('INFO', 'Tashmetu listens on post ' + port);
  });

  entry('INFO', 'Starting Tashmetu, scanning content...');
}

module.exports = reporter;
