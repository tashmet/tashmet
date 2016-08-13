var chalk = require('chalk');

/**
 * @module reporter
 * @requires log
 * @requires socket
 * @requires post
 * @requires taxonomy
 * @requires content
 * @requires config
 * @requires rest
 *
 * @description
 * Provides a reporter which logs events from all event-emitting tashmetu
 * services to the console.
 *
 * @listens post-added
 * @listens post-changed
 * @listens post-removed
 * @listens post-error
 * @listens taxonomy-added
 * @listens taxonomy-changed
 * @listens taxonomy-removed
 * @listens content-requested
 * @listens content-sent
 * @listens content-error
 * @listens config-changed
 * @listens client-connected
 * @listens client-disconnected
 * @listens item-requested
 * @listens item-sent
 * @listens collection-requested
 * @listens collection-sent
 */
exports = module.exports = function(
  log, socket, post, taxonomy, author, content, config, rest)
{
  function processError(type, err) {
    log('ERR', type + ': ' + chalk.grey(err.options.query.id));
    console.log();
    var pastCurrent = false;
    var output = '';
    err.pipeline.steps().forEach(function(step) {
      if(step === err.step) {
        step = chalk.red(step);
        pastCurrent = true;
      } else if(!pastCurrent) {
        step = chalk.green(step);
      } else {
        step = chalk.grey(step);
      }
      output = output + ' -> ' + step;
    });
    console.log(output);
    console.log('\n    ' + chalk.red(err) + '\n');
  }

  function resourceError(type, err) {
    log('ERR', type + ': ' + chalk.grey(err.query.id));
    console.log('\n    ' + chalk.red(err) + '\n');
  }

  function collectionError(name, err) {
    switch(err.name) {
      case 'ProcessError':
        processError(name, err);
        break;
      case 'ResourceError':
        resourceError(name, err);
        break;
    }
  }

  post.on('post-added', function(post) {
    log('ADD', 'post: ' + chalk.grey(post.__id));
  });
  post.on('post-changed', function(post) {
    log('UPD', 'post: ' + chalk.grey(post.__id));
  });
  post.on('post-removed', function(post) {
    log('REM', 'post: ' + chalk.grey(post.__id));
  });
  post.on('post-error', function(err) {
    collectionError('post', err);
  });

  taxonomy.on('taxonomy-added', function(taxonomy) {
    log('ADD', 'taxonomy: ' + chalk.grey(taxonomy.__id));
  });
  taxonomy.on('taxonomy-changed', function(taxonomy) {
    log('UPD', 'taxonomy: ' + chalk.grey(taxonomy.__id));
  });
  taxonomy.on('taxonomy-removed', function(taxonomy) {
    log('REM', 'taxonomy: ' + chalk.grey(taxonomy.__id));
  });
  taxonomy.on('taxonomoy-error', function(err) {
    collectionError('taxonomy', err);
  });

  author.on('author-added', function(author) {
    log('ADD', 'author: ' + chalk.grey(author.__id));
  });
  author.on('author-changed', function(author) {
    log('UPD', 'author: ' + chalk.grey(author.__id));
  });
  author.on('author-removed', function(author) {
    log('REM', 'author: ' + chalk.grey(author.__id));
  });
  author.on('author-error', function(err) {
    collectionError('author', err);
  });

  config.on('config-changed', function(config) {
    log('UPD', 'config: ' + chalk.grey(config.__id));
  });

  content.on('content-requested', function(req) {
    log('GET', 'url: ' + chalk.grey(req.url));
  });
  content.on('content-sent', function(path) {
    log('SEND', 'file: ' + chalk.grey(path));
  });
  content.on('content-error', function(path) {
    log('ERR', 'file: ' + chalk.grey(path));
  });

  socket.on('client-connected', function(socket) {
    log('INFO', 'Client connected: ' + chalk.grey(socket.id));
  });
  socket.on('client-disconnected', function(socket) {
    log('INFO', 'Client disconnected: ' + chalk.grey(socket.id));
  });

  rest.on('item-requested', function(req) {
    log('GET', 'rest endpoint: ' + chalk.grey(req.url));
  });
  rest.on('item-sent', function(item) {
    log('SEND', '1 item');
  });
  rest.on('collection-requested', function(req) {
    log('GET', 'rest endpoint: ' + chalk.grey(req.url));
  });
  rest.on('collection-sent', function(items) {
    log('SEND', items.length + ' items');
  });
};
