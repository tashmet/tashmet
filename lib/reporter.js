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

  storage.watch('posts', {
    error: function(e) {
      entry('ERR', 'post: ' + chalk.grey(e.name));
      if(e instanceof storage.ValidationException) {
        e.errors.forEach(function(error) {
          console.log('\n    ' + chalk.red(error.message) + '\n');
        });
      } else if(e instanceof storage.ParseException) {
        console.log('\n    ' + chalk.red(e.message) + '\n');
      }
    },
  });

  cache.watch('posts', {
    add:    function(post) { entry('ADD', 'post: ' + chalk.grey(post.name)); },
    change: function(post) { entry('UPD', 'post: ' + chalk.grey(post.name)); },
    remove: function(post) { entry('REM', 'post: ' + chalk.grey(post.name)); },
  });

  cache.watch('taxonomies', {
    add:    function(taxonomy) { entry('ADD', 'taxonomy: ' + chalk.grey(taxonomy.name)); },
    change: function(taxonomy) { entry('UPD', 'taxonomy: ' + chalk.grey(taxonomy.name)); },
  });

  tashmetu.watch('posts', {
    query: function(req)   { entry('GET', 'url: ' + chalk.grey(req.url)); },
    send:  function(posts) { entry('SEND', posts.length + ' posts'); },
  });

  tashmetu.watch('taxonomies', {
    get:  function(req)   { entry('GET', 'url: ' + chalk.grey(req.url)); },
    send: function(terms) { entry('SEND', terms.length + ' terms'); },
  });

  tashmetu.watch('content', {
    get:  function(req)  { entry('GET', 'url: ' + chalk.grey(req.url)); },
    send: function(path) { entry('SEND', 'file: ' + chalk.grey(path)); },
  });

  tashmetu.ready(function(port) {
    entry('INFO', 'Tashmetu listens on post ' + port);
  });

  entry('INFO', 'Starting Tashmetu, scanning content...');
}

module.exports = reporter;
