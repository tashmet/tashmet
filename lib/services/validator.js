var validate = require('jsonschema').validate;
var _        = require('lodash');


/**
 * @module tashmetu.validator
 * @requires tashmetu.factory
 *
 * @description
 * A service that validates objects used by tashmetu.
 */
exports = module.exports = function(factory) {

  /**
   * @typedef Verdict
   *
   * @description
   * This object describes the outcome of a validation.
   *
   * @type Object
   * @property {Boolean} success - True if validation was successful.
   * @property {Object} schema - The schema used for validation.
   * @property {Array.<string>} errors - List of error messages.
   */
  function verdict(success, schema, errors) {
    return { success: success, schema: schema, errors: errors };
  }

  /**
   * @description
   * Validates a post. If the post has the type-property set, a schema with
   * that name will be used for validation, otherwise the default 'post' schema
   * will be used.
   *
   * @param {Object} post - The post to validate
   * @return {Verdict}
   *    The return value after a completed validation is a verdict object
   *    representing the outcome.
   */
  this.checkPost = function(post) {
    if(typeof post != 'object') {
      return verdict(false, null, ['Could not validate non-object']);
    }
    var type = post.type || 'post';
    var schema = factory.schema(type);
    if(!schema) {
      return verdict(false, null, ['Could not find schema: ' + type]);
    }
    var errors = _.map(validate(post, schema).errors, 'message');
    if(errors.length > 0) {
      return verdict(false, schema, errors);
    }
    return verdict(true, schema, errors);
  };

  return this;
};
