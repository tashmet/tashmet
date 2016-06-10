var chalk  = require('chalk');
var events = require('events');

var eventEmitter = new events.EventEmitter();

module.exports = {
  init: function(tashmetu, storage, cache, app) {
    app.get('/posts', function(req, res, next) {
      eventEmitter.emit('post-list-requested', req);
      res.setHeader('Content-Type', 'application/json');
      res.send(cache.posts());
      eventEmitter.emit('post-list-sent', cache.posts());
    });

    app.get('/:post/attachments/*', function(req, res){
      eventEmitter.emit('content-requested', req);
      var path = 'tashmetu/content/posts/' + req.params.post + '/attachments/' + req.params[0];
      res.sendFile(path, {root: '.'}, function(err) {
        if(err) {
          eventEmitter.emit('content-error', path);
          res.status(err.status).end();
        } else {
          eventEmitter.emit('content-sent', path);
        }
      });
    });

    app.get('/taxonomies/:taxonomy', function(req, res, next) {
      eventEmitter.emit('taxonomy-requested', req);
      var terms = cache.taxonomy(req.params.taxonomy).terms;
      res.setHeader('Content-Type', 'application/json');
      res.send(terms);
      eventEmitter.emit('taxonomy-sent', terms);
    });

    eventEmitter.on('post-list-requested', function(req) {
      tashmetu.log('GET', 'url: ' + chalk.grey(req.url));
    });
    eventEmitter.on('post-list-sent', function(posts) {
      tashmetu.log('SEND', posts.length + ' posts');
    });
    eventEmitter.on('taxonomy-requested', function(req) {
      tashmetu.log('GET', 'url: ' + chalk.grey(req.url));
    });
    eventEmitter.on('taxonomy-sent', function(terms) {
      tashmetu.log('SEND', terms.length + ' terms');
    });
    eventEmitter.on('content-requested', function(req) {
      tashmetu.log('GET', 'url: ' + chalk.grey(req.url));
    });
    eventEmitter.on('content-sent', function(path) {
      tashmetu.log('SEND', 'file: ' + chalk.grey(path));
    });
    eventEmitter.on('content-error', function(path) {
      tashmetu.log('ERR', 'file: ' + chalk.grey(path));
    });
  },
}
