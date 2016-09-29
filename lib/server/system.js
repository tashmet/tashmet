var ioc       = require('electrolyte');
var Component = require('./component');

var components = {};

function loadComponent(cmp) {
  if(!components[cmp.name]) {
    components[cmp.name] = cmp;
    var fact = ioc.create('tashmetu.factory');
    var core = ioc.create('tashmetu.core');
    core.load(cmp);
    for(var i in cmp.types) {
      fact.define(i, cmp.types[i]);
    }
    for(var j  in cmp.factories) {
      fact.handle(j, cmp.factories[j]);
    }
  }
}

function load(module, id) {
  try {
    var component = require(module);
    if(component instanceof Component) {
      loadComponent(component);
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
