var chalk    = require('chalk');
var events   = require('events');

function restService(app, storage, cache, log) {
  var eventEmitter = new events.EventEmitter();

  function getPosts(req, res, next) {
    eventEmitter.emit('post-list-requested', req);
    res.setHeader('Content-Type', 'application/json');
    res.send(cache.posts());
    eventEmitter.emit('post-list-sent', cache.posts());
  }

  function getAttachment(req, res){
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
  }

  function getTaxonomy(req, res, next) {
    eventEmitter.emit('taxonomy-requested', req);
    var terms = cache.taxonomy(req.params.taxonomy).terms;
    res.setHeader('Content-Type', 'application/json');
    res.send(terms);
    eventEmitter.emit('taxonomy-sent', terms);
  }

  app.get('/posts', getPosts);
  app.get('/:post/attachments/*', getAttachment);
  app.get('/taxonomies/:taxonomy', getTaxonomy);

  eventEmitter.on('post-list-requested', function(req) {
    log('GET', 'url: ' + chalk.grey(req.url));
  });
  eventEmitter.on('post-list-sent', function(posts) {
    log('SEND', posts.length + ' posts');
  });
  eventEmitter.on('taxonomy-requested', function(req) {
    log('GET', 'url: ' + chalk.grey(req.url));
  });
  eventEmitter.on('taxonomy-sent', function(terms) {
    log('SEND', terms.length + ' terms');
  });
  eventEmitter.on('content-requested', function(req) {
    log('GET', 'url: ' + chalk.grey(req.url));
  });
  eventEmitter.on('content-sent', function(path) {
    log('SEND', 'file: ' + chalk.grey(path));
  });
  eventEmitter.on('content-error', function(path) {
    log('ERR', 'file: ' + chalk.grey(path));
  });

  return {
    on: eventEmitter.on
  };
}

exports = module.exports = restService;
