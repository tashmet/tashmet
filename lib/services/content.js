var events = require('events');

var eventEmitter = new events.EventEmitter();


/**
 * @module content
 * @requires express
 *
 * @description
 * Service responsible for serving content, ie pictures or other media
 * belonging to posts.
 *
 * @fires content-requested
 * @fires content-sent
 * @fires content-error
 */
exports = module.exports = function(app) {
  /**
   * Content requested event.
   * Fired when content has been requested, contains the request object.
   *
   * @event content-requested
   * @type {Object}
   */

  /**
   * Content sent event.
   * Fired when content has been sent, contains the path to the file sent.
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

  /*
   * Wire-up routes
   */
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

  /**
   * Register an event handler.
   */
  this.on = function(event, fn) {
    eventEmitter.on(event, fn);
  };

  return this;
};
