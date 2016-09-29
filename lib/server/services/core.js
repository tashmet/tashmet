var ioc = require('electrolyte');

exports = module.exports = function() {
  var collections = {};
  var configs = {};

  this.load = function(component) {
    if(component.collections) {
      component.collections.forEach(function(name) {
        collections[name] = ioc.create(component.name + '.' + name);
      });
    }
    for(var name in component.configs) {
      configs[component.name + '.' + name] = component.configs[name];
    }
  };

  this.collections = function() {
    return collections;
  };

  this.configs = function() {
    return configs;
  };

  return this;
};
