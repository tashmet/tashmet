var events = require('events');

/**
 * @module rest
 * @requires express
 *
 * @description
 * This service is responsible for maintaining REST end-points.
 *
 * @fires item-requested
 * @fires item-sent
 * @fires collection-requested
 * @fires collection-sent
 */
exports = module.exports = function(app) {
  var eventEmitter = new events.EventEmitter();

  /**
   * Expose a collection to the rest api.
   *
   * @param {String} name - The name of the endpoint. The resulting url will be
   *    /api/<name>
   * @param {Object} collection - The collection.
   */
  this.collection = function(name, collection, options) {
    app.get('/api/' + name + '/:id', function(req, res, next) {
      eventEmitter.emit('item-requested', req);
      collection.get(req.params.id, function(err, obj) {
        if(!err) {
          if(options.filter && options.filter(obj)) {
            res.setHeader('Content-Type', 'application/json');
            res.send(obj);
            eventEmitter.emit('item-sent', obj);
          } else {
            res.status(404).send('Not found');
          }
        } else {
          res.send(err);
        }
      });
    });

    app.get('/api/' + name, function(req, res, next) {
      eventEmitter.emit('collection-requested', req);
      res.setHeader('Content-Type', 'application/json');
      collection.findAll(function(err, objects) {
        if(!err) {
          res.send(objects);
          eventEmitter.emit('collection-sent', objects);
        } else {
          res.send(err);
        }
      });
    });
  };

  /**
   * Register an event handler.
   */
  this.on = function(event, fn) {
    eventEmitter.on(event, fn);
  };

  return this;
};
