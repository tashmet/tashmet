var chalk = require('chalk');
var log   = require('fancy-log');

function reporter(tashmetu, storage, cache) {
  var errors = [];
  var loading = true;

  function indent(indents) {
    return Array(indents + 1).join('  ');
  }

  function ok(msg, indents) {
    print(chalk.green('✓') + ' ' + chalk.grey(msg), indents);
  }

  function print(msg, indents) {
    console.log(indent(indents) + msg);
  }

  function storageError(e, index) {
    if(e instanceof storage.ValidationException) {
      e.errors.forEach(function(error) {
        console.log('    ' + chalk.red(error.message));
      });
    } else if(e instanceof storage.ParseException) {
      console.log('    ' + chalk.red(e.message));
    }
  }

  storage.watch('schemas', {
    start: function() { print('schemas', 1); },
  });

  storage.watch('posts', {
    start: function() { console.log('  posts'); },
    add: function(name) {
      if(!loading) {
        log('Loading post:\n');
        console.log('  ' + name);
      }
    },
    change: function(name) {
      log('Loading post:\n');
      console.log('  ' + name);
    },
    error: function(error) {
      errors.push(error);
      if(loading) {
        print(chalk.red((errors.length) + ') ' + error.name), 2);
      } else {
        storageError(error);
        console.log();
      }
    },
    ready: function() {
      console.log();
      errors.forEach(function(e, i) {
        print((i + 1) + ') ' + e.name + ':', 1);
        storageError(e, i);
      });
    }
  });

  cache.watch('posts', {
    add: function(post) {
      if(loading) {
        ok(post.name, 2);
      } else {
        ok('Added to cache', 2);
        console.log();
      }
    },
    change: function(post) {
      ok('Updated in cache', 2);
      console.log();
    },
  });

  cache.watch('schemas', {
    add: function(schema) {
      ok(schema.id, 2);
    },
  });

  tashmetu.ready(function(port) {
    console.log();
    log("Tashmetu listens on port " + chalk.magenta(port));
    loading = false;
  });

  log('Starting Tashmetu, scanning content...\n');
}

module.exports = reporter;
