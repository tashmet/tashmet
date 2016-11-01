var ioc       = require('electrolyte');
var Component = require('./component');
var _         = require('lodash');

var components = {};

function load(component) {
  try {
    if(_.isString(component)) {
      component = require(component);
    }
    if(component instanceof Component) {
      components[component.name] = component;
    }
    return component;
  } catch(e) {
    console.log(e);
    return;
  }
}

exports = module.exports = {
  load: load,

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
