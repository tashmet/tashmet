var Taxonomy = require('../../common/taxonomy.js');
var events   = require('events');

/**
 * @module taxonomy
 * @requires database
 *
 * @description
 * This service is responsible for loading taxonomies from the storage into the
 * cache. It also provides the routes necessary for a basic taxonomy api.
 */
exports = module.exports = function(database) {
  return new Taxonomy(database.collection('taxonomies'), new events.EventEmitter());
};
