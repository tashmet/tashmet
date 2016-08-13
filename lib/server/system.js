var ioc       = require('electrolyte');
var Component = require('./component');

var components = {};

function loadComponent(cmp, id) {
  components[id] = cmp;
  var fact = ioc.create('tashmetu.factory');
  var conf = ioc.create('tashmetu.config');
  for(var i in cmp.types) {
    fact.define(i, cmp.types[i]);
  }
  for(var j  in cmp.factories) {
    fact.handle(j, cmp.factories[j]);
  }
  for(var name in cmp.configs) {
    conf.schema(id + '.' + name, cmp.configs[name]);
  }
}

function load(module, id) {
  try {
    var component = require(module);
    if(component instanceof Component) {
      if(component._name) {
        id = component._name;
      }
      loadComponent(component, id);
    }
    return component;
  } catch(e) {
    console.log(e);
    return;
  }
}

exports = module.exports = {
  load: load,
  loadComponent: loadComponent,

  use: function(fn) {
    ioc.use(fn);
  },
  create: function(id) {
    return ioc.create(id);
  },

  components: components,
  delegates: {},
  silent: false
};
