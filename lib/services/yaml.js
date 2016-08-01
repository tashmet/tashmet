var yaml = require('js-yaml');


/**
 * @module yaml
 *
 * @description
 * Read and write yaml.
 */
exports = module.exports = function() {

  /**
   * Load yaml from string and output an object.
   */
  this.load = function(data, path, query, cb) {
    cb(null, yaml.safeLoad(data));
  };

  /**
   * Write an object to yaml.
   */
  this.serialize = function(obj, path, query, cb) {
    cb(null, yaml.safeDump(obj));
  };

  return this;
};
