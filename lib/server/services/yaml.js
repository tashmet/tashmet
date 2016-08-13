var yaml      = require('js-yaml');
var yamlFront = require('yaml-front-matter');
var _         = require('lodash');


/**
 * @module yaml
 *
 * @description
 * Read and write yaml.
 */
exports = module.exports = function() {

  /**
   * Parse yaml from string and output an object.
   *
   * @param {string} data - Raw yaml data
   * @param {Function} cb - Callback delivering a parsed data object.
   * @param {boolean} [frontMatter] - If set to true, data will be parsed as
   *    yaml front matter and any content following it will be stored in a
   *    propery named __content.
   */
  this.parse = function(data, cb, frontMatter) {
    try {
      if(frontMatter) {
        cb(null, yamlFront.loadFront(data));
      } else {
        cb(null, yaml.safeLoad(data));
      }
    } catch(e) {
      cb(e);
    }
  };

  /**
   * Write an object to yaml. If the __content property is set on the object
   * the output will be yaml front-matter with the content appended.
   *
   * @param {Object} obj - Object to serialize.
   * @param {Function} cb - Callback.
   */
  this.serialize = function(obj, cb) {
    var metaKeys = _.filter(Object.keys(obj), function(value) {
      return _.startsWith(value, '__');
    });

    try {
      var frontMatter = yaml.safeDump(_.omit(obj, metaKeys));
      var output = '---\n' + frontMatter + '---';
      if(obj.__content) {
        output += '\n' + obj.__content.replace(/^\s+|\s+$/g, '');
      }
      cb(null, output);
    } catch(e) {
      cb(new Error(e.message));
    }
  };

  return this;
};
