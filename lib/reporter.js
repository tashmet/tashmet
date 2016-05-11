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
      log('[ ' + chalk.green('ADD') + '  ] ' + chalk.grey(post.name));
    },
    change: function(post) {
      log('[ ' + chalk.green('UPD') + '  ] ' + chalk.grey(post.name));
    },
    remove: function(post) {
      log('[ ' + chalk.green('REM') + '  ] ' + chalk.grey(post.name));
    },
  });

  tashmetu.ready(function(port) {
    log('[ ' + chalk.cyan('INFO') + ' ] Tashmetu listens on port ' + port);
  });

  log('[ ' + chalk.cyan('INFO') + ' ] Starting Tashmetu, scanning content...');
}

module.exports = reporter;
