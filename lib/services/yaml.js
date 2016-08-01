var fs   = require('fs');
var yaml = require('js-yaml');


/**
 * @module yaml
 *
 * @description
 * Read and write yaml.
 */
exports = module.exports = function() {

  /**
   * Read a yaml file from the file system.
   *
   * @param {String} path
   * @param {Function} fn - Callback
   */
  this.load = function(data) {
    return yaml.safeLoad(data);
/*
    fs.readFile(path, function(err, data) {
      if(err) {
        // throw
      }
      fn(yaml.safeLoad(data));
    });
*/
  };

  /**
   * Write an object to markdown with front-matter.
   *
   * @param obj
   * @param {String} path
   * @param {Function} fn
   */
  this.serialize = function(obj) {
    return yaml.safeDump(obj);
    //fs.writeFile(path, yaml.safeDump(obj), fn);
  };

  return this;
};
