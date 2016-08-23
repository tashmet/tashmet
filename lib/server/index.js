var App       = require('./app');
var Component = require('./component');
var resolve   = require('./resolve');
var system    = require('./system');
var tashmetu  = require('./tashmetu');
var join      = require('path').join;
var _         = require('lodash');

system.delegates = {};

exports = module.exports = function(main, silent, customDelegates) {
  _.assign(system.delegates, customDelegates);

  system.silent = silent;
  system.use(resolve);

  return system.load(main);
};

exports.Component = function(name) {
  return new Component(name);
};

exports.App = function(name, deps) {
  system.loadComponent(tashmetu);
  if(deps) {
    deps.forEach(function(cmp) {
      system.loadComponent(cmp);
    });
  }
  return new App(name, deps);
};
