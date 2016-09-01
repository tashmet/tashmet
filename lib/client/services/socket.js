var Socket = require('../../common/socket');
var io     = require('socket.io-client')();

exports = module.exports = function() {
  return new Socket(io);
};
