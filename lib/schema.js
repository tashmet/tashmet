var fs     = require('fs');
var schema = require('jsonschema');
var yaml   = require('js-yaml');

var validator = new schema.Validator();

function ValidationException(errors) {
  this.errors = errors;
}

function load(path) {
  return yaml.safeLoad(fs.readFileSync(path, 'utf8'));
}

function validate(obj, schema) {
  var errors = validator.validate(obj, schema).errors;
  if(errors.length > 0) {
    throw new ValidationException(errors);
  }
}

module.exports = {
  load: load,
  validate: validate,

  ValidationException: ValidationException
}
