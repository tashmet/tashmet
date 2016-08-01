var chalk = require('chalk');

/**
 * @module reporter
 * @requires log
 * @requires socket
 * @requires post
 * @requires taxonomy
 * @requires content
 *
 * @description
 * Provides a reporter which logs events from all event-emitting tashmetu
 * services to the console.
 *
 * @listens post-added
 * @listens post-changed
 * @listens post-removed
 * @listens post-list-requested
 * @listens post-list-sent
 * @listens taxonomy-added
 * @listens taxonomy-changed
 * @listens taxonomy-removed
 * @listens taxonomy-requested
 * @listens taxonomy-sent
 * @listens content-requested
 * @listens content-sent
 * @listens content-error
 * @listens client-connected
 * @listens client-disconnected
 * @listens post-error
 */
exports = module.exports = function(log, socket, post, taxonomy, content) {
  post.on('post-added', function(post) {
    log('ADD', 'post: ' + chalk.grey(post.name));
  });
  post.on('post-changed', function(post) {
    log('UPD', 'post: ' + chalk.grey(post.name));
  });
  post.on('post-removed', function(post) {
    log('REM', 'post: ' + chalk.grey(post.name));
  });
  post.on('post-list-requested', function(req) {
    log('GET', 'url: ' + chalk.grey(req.url));
  });
  post.on('post-list-sent', function(posts) {
    log('SEND', posts.length + ' posts');
  });
  post.on('post-error', function(ev) {
    log('ERR', 'post: ' + chalk.grey(ev.postName));
    console.log('\n    ' + chalk.red(ev) + '\n');
  });

  taxonomy.on('taxonomy-added', function(taxonomy) {
    log('ADD', 'taxonomy: ' + chalk.grey(taxonomy.name));
  });
  taxonomy.on('taxonomy-changed', function(taxonomy) {
    log('UPD', 'taxonomy: ' + chalk.grey(taxonomy.name));
  });
  taxonomy.on('taxonomy-removed', function(taxonomy) {
    log('REM', 'taxonomy: ' + chalk.grey(taxonomy.name));
  });
  taxonomy.on('taxonomy-requested', function(req) {
    log('GET', 'url: ' + chalk.grey(req.url));
  });
  taxonomy.on('taxonomy-sent', function(terms) {
    log('SEND', terms.length + ' terms');
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
};
