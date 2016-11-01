var util      = require('util');
var system    = require('./system');
var Component = require('./component');
var _         = require('lodash');

function App(name, deps) {
  Component.call(this, name, deps);
}

util.inherits(App, Component);

App.prototype.controller = function(inject, fn) {
  this.services.controller = fn;
  this.services.controller['@singleton'] = true;
  this.services.controller['@require'] = inject;
  return this;
};

App.prototype.run = function(args) {
  system.components.tashmetu.services.args = args;

  system.create(this.name + '.controller');
};

App.prototype.plugin = function(name) {
  return system.create(name);
};

App.prototype.schema = function(type) {
  var types = {};
  for(var key in system.components) {
    var component = system.components[key];
    if(component.types) {
      _.assign(types, component.types);
    }
  }
  return types[type].schema;
};

App.prototype.clis = function() {
  var clis = {};
  for(var key in system.components) {
    var component = system.components[key];
    if(component.clis) {
      _.assign(clis, component.clis);
    }
  }
  return clis;
};

App.prototype.factories = function() {
  var factories = {};
  for(var key in system.components) {
    var component = system.components[key];
    if(component.factories) {
      _.assign(factories, component.factories);
    }
  }
  return factories;
};

exports = module.exports = App;
