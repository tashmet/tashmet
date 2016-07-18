var http = require('http');

/**
 * @module server
 *
 * @description
 * Provides a single instance to an http server.
 */
exports = module.exports = function(app) {
  return http.createServer(app);
};
