var chalk  = require('chalk');
var events = require('events');
var http   = require('http');
var _      = require('lodash');

exports = module.exports = function(server, log) {
  var io = require('socket.io').listen(server);
  var eventEmitter = new events.EventEmitter();

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

  var socket = {
    forward: function(emitter, eventName) {
      emitter.on(eventName, function() {
        var args = [eventName].concat(_.map(arguments, function(arg) { return arg }));
        io.emit.apply(io, args);
      });
    },
  }

  return socket;
}
