var validate = require('jsonschema').validate;
var _        = require('lodash');


/**
 * @module validator
 * @requires factory
 *
 * @description
 * A service that validates objects used by tashmetu.
 */
exports = module.exports = function(factory) {

  /**
   * Check object against schema.
   */
  this.check = function(obj, schema, cb) {
    if(typeof obj != 'object') {
      cb('Could not validate non-object');
    }
    var errors = _.map(validate(obj, schema).errors, 'message');
    if(errors.length > 0) {
      cb(new Error(errors[0]));
    } else {
      cb();
    }
  };

  return this;
};
