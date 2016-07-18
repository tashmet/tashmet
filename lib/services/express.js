var express = require('express');
var app = express();

/**
 * @module express
 *
 * @description
 * Provides a single instance of an express app.
 *
 * @see {@link http://expressjs.com/en/api.html}
 */
exports = module.exports = function() {
  return app;
};
