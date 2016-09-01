/**
 * @class
 */
function Socket(io) {
  this.io = io;
}

/**
 * Emit a message on the socket.
 *
 * @param {String} eventName - Name of the event.
 * @param {} message - The message to send.
 */
Socket.prototype.emit = function(eventName, message) {
  this.io.emit(eventName, message);
};

/**
 * Register an event handler.
 *
 * @param {String} eventName - The name of the event.
 * @param {Function} listener - The callback function.
 */
Socket.prototype.on = function(eventName, listener) {
  this.io.on(eventName, listener);
};


exports = module.exports = Socket;
