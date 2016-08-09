var async = require('async');
var util  = require('util');
var _     = require('lodash');


/**
 * Process error returned when a step failes in the pipeline.
 *
 * @typedef ProcessError
 * @property {Pipeline} pipeline - The pipeline where the error occured.
 * @property {string} step - The title of the step that failed.
 * @property {Object} options - The options that were passed to the step.
 * @property {string} message - Error message.
 */
ProcessError = function(pipeline, step, options, message) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.message = message;
  this.name = 'ProcessError';
  this.pipeline = pipeline;
  this.step = step;
  this.options = options;
};

util.inherits(ProcessError, Error);


/**
 * @class Pipeline
 */
function Pipeline() {
  var pipeline = this;
  var steps = [];

  /**
   * Get a list of names of all steps in this pipeline.
   *
   * @return {Array<string>}
   */
  this.steps = function() {
    return _.map(steps, function(step) {
      return step.title;
    });
  };

  /**
   * Add a step to the pipeline.
   *
   * @param {string} title - Step title string.
   * @param {Function} fn - The function that should be executed when this
   *    step is run.
   * @return {Pipeline} Returns the pipeline so that calls to this function
   *    can be chained.
   */
  this.step = function(title, fn) {
    steps.push({title: title, run: fn});
    return this;
  };

  /**
   * Run all the steps in the pipeline.
   *
   * @param {} data - Input data.
   * @param {Object} options - An object with arbitrary options you might want
   *    to pass along. These options will be available in every step.
   * @param {Function} cb - Callback delivering the output.
   */
  this.run = function(data, options, cb) {
    async.eachSeries(steps, function(step, done) {
      step.run(data, options, function(err, result) {
        if(err) {
          err = new ProcessError(pipeline, step.title, options, err.message);
        }
        data = result;
        done(err);
      });
    }, function(err) {
      cb(err, data);
    });
  };
}

exports = module.exports = function() {

  this.Pipeline = Pipeline;

  this.ProcessError = ProcessError;

  return this;
};
