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
   * Load yaml from string and output an object. If the file-ending of the
   * data source is not '.yml' we will assume the data stream contains yaml
   * front-matter and try to load it as such. Any content will be stored in
   * the __content property.
   */
  this.load = function(data, path, query, cb) {
    try {
      if(path.endsWith('.yml')) {
        cb(null, yaml.safeLoad(data));
      } else {
        cb(null, yamlFront.loadFront(data));
      }
    } catch(e) {
      cb(new Error('Parsing YAML: ' + e.message));
    }
  };

  /**
   * Write an object to yaml. If the __content property is set on the object
   * the output will be yaml front-matter with the content appended.
   */
  this.serialize = function(obj, path, query, cb) {
    try {
      var frontMatter = yaml.safeDump(_.omit(obj, ['__content']));
      var output = '---\n' + frontMatter + '---';
      if(obj.__content) {
        output += '\n' + obj.__content.replace(/^\s+|\s+$/g, '');
      }
      cb(null, output);
    } catch(e) {
      cb(new Error('Serializing YAML: ' + e.message));
    }
  };

  return this;
};
