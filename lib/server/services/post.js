var Post   = require('../../common/post.js');
var events = require('events');

/**
 * @module post
 * @requires database
 *
 * @description
 * This service is responsible for loading posts from the storage into the
 * cache. During loading posts are processed and their relationships are
 * determined. This service also provides the routes necessary for a basic
 * post api.
 */
exports = module.exports = function(database) {
  return new Post(database.collection('posts'), new events.EventEmitter());
};
