var events = require('events');

/**
 * @module rest
 * @requires express
 * @requires storage
 * @requires cache
 * @requires log
 *
 * @description
 * Provides a rest API for retrieving posts, taxonomies, attachments etc.
 *
 * @fires content-requested
 * @fires content-sent
 * @fires content-error
 * @fires post-list-requested
 * @fires post-list-sent
 * @fires taxonomy-requested
 * @fires taxonomy-sent
 */
exports = module.exports = function(app, storage, cache, log) {
  var eventEmitter = new events.EventEmitter();

  /**
   * Content requested event.
   * Fired when content has been requested and contains the request object.
   *
   * @event content-requested
   * @type {Object}
   */

  /**
   * Content sent event.
   * Fired when content has been sent and contains the path to the file sent.
   *
   * @event content-sent
   * @type {String}
   */

  /**
   * Content error event.
   *
   * @event content-error
   * @type {String}
   */

  /**
   * Post list requested event.
   * Fired when posts have been requested and contains the request object.
   *
   * @event post-list-requested
   * @type {Object}
   */

  /**
   * Post list sent event.
   * Fired when posts have been sent and contains the list of posts sent.
   *
   * @event post-list-sent
   * @type {Array}
   *
   * @example
   * rest.on('post-list-sent', function(posts) {
   *   console.log(posts.length + ' posts sent.');
   * });
   */

  /**
   * Taxonomy requested event.
   * Fired when a taxonomy have been requested and contains the request object.
   *
   * @event taxonomy-requested
   * @type {Object}
   */

  /**
   * Taxonomy sent event.
   * Fired when a taxonomy has been sent and contains the terms in the
   * taxonomy sent.
   *
   * @event taxonomy-sent
   * @type {Array}
   */


  /**
   * Register an event handler.
   *
   * @param {String} eventName - The name of the event.
   * @param {Function} listener - The callback function.
   */
  this.on = function(eventName, listener) {
    eventEmitter.on(eventName, listener);
  };


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

  return this;
};
