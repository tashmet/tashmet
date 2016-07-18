var chalk  = require('chalk');
var events = require('events');
var http   = require('http');
var _      = require('lodash');

var eventEmitter = new events.EventEmitter();


/**
 * @module socket
 * @requires server
 * @requires log
 *
 * @description
 * Provides event-based communication with clients
 *
 * @fires client-connected
 * @fires client-disconnected
 */
exports = module.exports = function(server, log) {
  var io = require('socket.io').listen(server);

  /**
   * Client connected event.
   * Fired when a client has established a connection.
   *
   * @event client-connected
   * @type {Object}
   * @see {@link http://socket.io/docs/server-api/#socket}
   *
   * @example
   * socket.on('client-connected', function(socket) {
   *   console.log('Client connected. Session ID: ' + socket.id);
   * });
   */

  /**
   * Client disconnected event.
   * Fired when a client was disconnected.
   *
   * @event client-disconnected
   * @type {Object}
   * @see {@link http://socket.io/docs/server-api/#socket}
   *
   * @example
   * socket.on('client-disconnected', function(socket) {
   *   console.log('Client disconnected. Session ID: ' + socket.id);
   * });
   */

  /**
   * @description
   * Forward events from an emitter to the socket.
   *
   * This function will subscribe to the given event on the given emitter.
   * When a message is recieved it will be sent to the socket.
   *
   * @example
   * <caption>Notify clients when a post is added</caption>
   * socket.forward(cache, 'post-added');
   *
   * @param {Object} emitter - An emitter
   * @param {String} eventName - Name of the event to forward.
   */
  this.forward = function(emitter, eventName) {
    emitter.on(eventName, function() {
      var args = [eventName].concat(_.map(arguments, function(arg) {
        return arg;
      }));
      io.emit.apply(io, args);
    });
  };


  io.on('connection', function(socket) {
    eventEmitter.emit('client-connected', socket);
    socket.on('disconnect', function() {
      eventEmitter.emit('client-disconnected', socket);
    });
  });

  eventEmitter.on('client-connected', function(socket) {
    log('INFO', 'Client connected: ' + chalk.grey(socket.id));
  });
  eventEmitter.on('client-disconnected', function(socket) {
    log('INFO', 'Client disconnected: ' + chalk.grey(socket.id));
  });

  return this;
};
