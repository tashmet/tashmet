var App       = require('./app');
var Component = require('./component');
var resolve   = require('./resolve');
var system    = require('./system');
var join      = require('path').join;
var _         = require('lodash');

system.delegates = {};

exports = module.exports = function(main, silent, customDelegates) {
  _.assign(system.delegates, customDelegates);

  system.silent = silent;
  system.use(resolve);

  var tashmetu = system.load('./tashmetu');
  var app = system.load(main);

  var fact = system.create('tashmetu.factory');
  var core = system.create('tashmetu.core');

  function dependencies(component) {
    var deps = component.deps;
    deps.forEach(function(dep) {
      var children = dependencies(dep);
      deps.push.apply(children);
    });
    return deps;
  }

  function load(cmp) {
    core.load(cmp);
    for(var i in cmp.types) {
      fact.define(i, cmp.types[i]);
    }
    for(var j  in cmp.factories) {
      fact.handle(j, cmp.factories[j]);
    }
  }

  load(tashmetu);
  load(app);

  dependencies(app).forEach(function(dep) {
    var cmp = system.load(dep);
    load(cmp);
  });

  return app;
};

exports.Component = function(name, deps) {
  return new Component(name, deps);
};

exports.App = function(name, deps) {
  return new App(name, deps);
};
