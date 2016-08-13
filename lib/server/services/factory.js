
/**
 * @module factory
 *
 * @description
 * Provides the system of post types, allowing for posts to be defined,
 * created, processed and compared.
 */
exports = module.exports = function() {
  factories = {};

  /**
   * @typedef PostType
   *
   * @description
   * This object represents a post type.
   *
   * @type Object
   * @property {Boolean} success - True if validation was successful.
   * @property {Object} schema - The schema used for validation.
   */
  types = {};

  /**
   * @description
   * Define a factory.
   *
   * @param {String} name - Name of the factory
   * @param {Object} factory - The factory function. This function should
   *    take an object as input and
   */
  this.handle = function(name, factory) {
    factories[name] = factory;
  };

  /**
   * @description
   * Define a post type.
   *
   * @param {String} name - Name of the post type.
   * @param {module:factory~PostType} type
   */
  this.define = function(name, type) {
    types[name] = type;
  };

  /**
   * @description
   * Process a post.
   *
   * @param {Object} post - The post to be processed.
   * @param {Function} done - Callback delivering the processed result.
   */
  this.process = function(post, done) {
    types[post.type].process(post, done);
  };

  /**
   * @description
   * Compare two posts.
   *
   * @param {Object} a - First post
   * @param {Object} b - Second post
   * @returns {Number} A number indicating how much the two posts have in
   *    common. A higher number means they are more similar while 0 means they
   *    have nothing in common.
   */
  this.compare = function(a, b) {
    var type = a.type === b.type ? a.type : false;
    if(type) {
      return types[type].compare(a, b);
    } else {
      return 0;
    }
  };

  /**
   * @description
   * Get a schema by type name.
   *
   * @param {String} type - Name of the post type.
   */
  this.schema = function(type) {
    return types[type] ? types[type].schema : null;
  };

  return this;


};
