var booleanOperators = require("mingo/operators/expression/boolean");
var comparisonOperators = require("mingo/operators/expression/comparison");
var projectionOperators = require("mingo/operators/projection");
var queryOperators = require("mingo/operators/query");
var $match = require("mingo/operators/pipeline/match");
var $limit = require("mingo/operators/pipeline/limit");
var $project = require("mingo/operators/pipeline/project");
var $skip = require("mingo/operators/pipeline/skip");
var $sort = require("mingo/operators/pipeline/sort");

module.exports = {
  accumulator: {},
  expression: Object.assign({}, booleanOperators, comparisonOperators),
  pipeline: Object.assign({}, $match, $limit, $project, $skip, $sort),
  projection: projectionOperators,
  query: queryOperators,
};
