var validate = require('jsonschema').validate;
var _        = require('lodash');


function Pipe(check) {

  var getSchema = function(obj, cb) {
    cb(new Error('No schema supplied'));
  };

  function validate(obj, cb) {
    getSchema(obj, function(err, schema) {
      if(!err) {
        check(obj, schema, function(err) {
          cb(err, obj);
        });
      } else {
        cb(err);
      }
    });
  }

  this.input = function(obj, path, query, cb) {
    validate(obj, cb);
  };

  this.output = function(obj, path, query, cb) {
    validate(obj, cb);
  };

  this.schema = function(fn) {
    getSchema = fn;
  };
}

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
      cb(new Error('Could not validate non-object'));
    }
    var errors = _.map(validate(obj, schema).errors, 'message');
    if(errors.length > 0) {
      cb(new Error(errors[0]));
    } else {
      cb();
    }
  };

  this.createPipe = function() {
    return new Pipe(this.check);
  };

  return this;
};
