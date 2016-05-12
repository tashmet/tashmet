var chalk = require('chalk');
var log   = require('fancy-log');

function reporter(tashmetu, storage, cache) {
  storage.watch('posts', {
    error: function(e) {
      log('[ ' + chalk.red('ERR') + '  ] ' + chalk.grey(e.name));
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
    add: function(post) {
      log('[ ' + chalk.green('ADD') + '  ] post: ' + chalk.grey(post.name));
    },
    change: function(post) {
      log('[ ' + chalk.green('UPD') + '  ] post: ' + chalk.grey(post.name));
    },
    remove: function(post) {
      log('[ ' + chalk.green('REM') + '  ] post: ' + chalk.grey(post.name));
    },
  });

  cache.watch('taxonomies', {
    add: function(taxonomy) {
      log('[ ' + chalk.green('ADD') + '  ] taxonomy: ' + chalk.grey(taxonomy.name));
    },
    change: function(taxonomy) {
      log('[ ' + chalk.green('UPD') + '  ] taxonomy: ' + chalk.grey(taxonomy.name));
    }
  });

  tashmetu.watch('posts', {
    query: function(req) {
      log('[ ' + chalk.cyan('GET') + '  ] url: ' + chalk.grey(req.url));
    },
    send: function(posts) {
      log('[ ' + chalk.green('SEND') + ' ] ' + posts.length + ' posts');
    },
  });

  tashmetu.watch('taxonomies', {
    get: function(req) {
      log('[ ' + chalk.cyan('GET') + '  ] url: ' + chalk.grey(req.url));
    },
    send: function(terms) {
      log('[ ' + chalk.green('SEND') + ' ] ' + terms.length + ' terms');
    },
  });

  tashmetu.watch('content', {
    get: function(req) {
      log('[ ' + chalk.cyan('GET') + '  ] url: ' + chalk.grey(req.url));
    },
    send: function(path) {
      log('[ ' + chalk.green('SEND') + ' ] file: ' + chalk.grey(path));
    },
  });

  tashmetu.ready(function(port) {
    log('[ ' + chalk.cyan('INFO') + ' ] Tashmetu listens on port ' + port);
  });

  log('[ ' + chalk.cyan('INFO') + ' ] Starting Tashmetu, scanning content...');
}

module.exports = reporter;
