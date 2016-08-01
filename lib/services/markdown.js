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
   * Load markdown with front-matter from string and output an object.
   * The markdown content is stored in the __content property.
   */
  this.load = function(data, path, query, cb) {
    try {
      cb(null, yamlFront.loadFront(data));
    } catch(e) {
      cb(new Error('Parsing YAML front-matter: ' + e.message));
    }
  };

  /**
   * Serialize an object to markdown with front-matter.
   */
  this.serialize = function(obj, path, query, cb) {
    var frontMatter = yaml.safeDump(_.omit(obj, ['name', '__content']));
    var output = '---\n' + frontMatter + '---';
    if(obj.__content) {
      output += '\n' + obj.__content.replace(/^\s+|\s+$/g, '');
    }
    cb(null, output);
  };

  return this;
};
