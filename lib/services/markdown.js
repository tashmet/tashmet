var fs        = require('fs');
var yaml      = require('js-yaml');
var yamlFront = require('yaml-front-matter');
var _         = require('lodash');


/**
 * @module markdown
 *
 * @description
 * Read and write markdown with yaml front-matter.
 */
exports = module.exports = function() {

  /**
   * Read a markdown file with front-matter from file system.
   *
   * @param {String} data - Input data string.
   * @returns {Object}
   */
  this.load = function(data) {
    try {
      return yamlFront.loadFront(data);
    } catch(e) {
      throw Error('Parsing YAML front-matter: ' + e.message);
    }
  };

  /**
   * Write a markdown file with front-matter to file system.
   *
   * @param obj
   * @returns {String}
   */
  this.serialize = function(obj) {
    var frontMatter = yaml.safeDump(_.omit(obj, ['name', '__content']));
    var output = '---\n' + frontMatter + '---';
    if(obj.__content) {
      output += '\n' + obj.__content.replace(/^\s+|\s+$/g, '');
    }
    return output;
  };

  return this;
};
