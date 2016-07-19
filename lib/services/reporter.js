var chalk = require('chalk');

/**
 * @module reporter
 * @requires cache
 * @requires log
 * @requires rest
 * @requires socket
 *
 * @description
 * Provides a reporter which logs events from all event-emitting tashmetu
 * services to the console.
 *
 * @listens post-added
 * @listens post-changed
 * @listens post-removed
 * @listens taxonomy-added
 * @listens taxonomy-changed
 * @listens taxonomy-removed
 * @listens content-requested
 * @listens content-sent
 * @listens content-error
 * @listens post-list-requested
 * @listens post-list-sent
 * @listens taxonomy-requested
 * @listens taxonomy-sent
 * @listens client-connected
 * @listens client-disconnected
 * @listens post-error
 */
exports = module.exports = function(cache, log, rest, socket, storage) {
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

  rest.on('content-requested', function(req) {
    log('GET', 'url: ' + chalk.grey(req.url));
  });
  rest.on('content-sent', function(path) {
    log('SEND', 'file: ' + chalk.grey(path));
  });
  rest.on('content-error', function(path) {
    log('ERR', 'file: ' + chalk.grey(path));
  });
  rest.on('post-list-requested', function(req) {
    log('GET', 'url: ' + chalk.grey(req.url));
  });
  rest.on('post-list-sent', function(posts) {
    log('SEND', posts.length + ' posts');
  });
  rest.on('taxonomy-requested', function(req) {
    log('GET', 'url: ' + chalk.grey(req.url));
  });
  rest.on('taxonomy-sent', function(terms) {
    log('SEND', terms.length + ' terms');
  });

  socket.on('client-connected', function(socket) {
    log('INFO', 'Client connected: ' + chalk.grey(socket.id));
  });
  socket.on('client-disconnected', function(socket) {
    log('INFO', 'Client disconnected: ' + chalk.grey(socket.id));
  });

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
};
