var Author = require('../../common/author.js');
var events = require('events');

/**
 * @module author
 * @requires database
 *
 * @description
 * This service is responsible for loading authors from the storage into the
 * cache. It also provides the routes necessary for a basic author api.
 */
exports = module.exports = function(database) {
  return new Author(database.collection('authors'), new events.EventEmitter());
};
