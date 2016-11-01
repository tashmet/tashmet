var App       = require('./app');
var Component = require('./component');
var log       = require('./log');
var chalk     = require('chalk');
var join      = require('path').join;
var ioc       = require('electrolyte');
var _         = require('lodash');

exports = module.exports = function(main, silent) {
  var components = {};

  function load(component) {
    if(_.isString(component)) {
      component = require(component);
    }
    components[component.name] = component;
    component.deps.forEach(function(dep) {
      load(dep);
    });
    return component;
  }

  ioc.use(function(id) {
    if(!silent) {
      log('LOAD', 'module: ' + chalk.grey(id));
    }
    if(id.indexOf('.') > 0) {
      var service = id.substr(id.indexOf('.')+1);
      var module  = id.substr(0, id.indexOf('.'));

      if(components[module]) {
        return components[module].services[service];
      } else {
        return;
      }
    } else {
      path = join(process.cwd(), 'node_modules', id);
      if(existsSync(path)) {
        return require(path);
      } else {
        return require(id);
      }
    }
  });

  var tashmetu = load('./tashmetu');
  var app      = load(main);

  var fact = ioc.create('tashmetu.factory');
  var core = ioc.create('tashmetu.core');

  for(var name in components) {
    var cmp = components[name];

    core.load(cmp);
    for(var i in cmp.types) {
      fact.define(i, cmp.types[i]);
    }
    for(var j  in cmp.factories) {
      fact.handle(j, cmp.factories[j]);
    }
  };

  return {
    run: function(args) {
      components.tashmetu.services.args = args;

      ioc.create(app.name + '.controller');
    },

    plugin: function(name) {
      return ioc.create(name);
    },

    schema: function(type) {
      var types = {};
      for(var key in components) {
        var component = components[key];
        if(component.types) {
          _.assign(types, component.types);
        }
      }
      return types[type].schema;
    },

    clis: function() {
      var clis = {};
      for(var key in components) {
        var component = components[key];
        if(component.clis) {
          _.assign(clis, component.clis);
        }
      }
      return clis;
    },

    factories: function() {
      var factories = {};
      for(var key in components) {
        var component = components[key];
        if(component.factories) {
          _.assign(factories, component.factories);
        }
      }
      return factories;
    }
  };
};

exports.Component = function(name, deps) {
  return new Component(name, deps);
};

exports.App = function(name, deps) {
  return new App(name, deps);
};
