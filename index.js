var App       = require('./lib/app');
var Component = require('./lib/component');
var resolve   = require('./lib/resolve');
var system    = require('./lib/system');
var tashmetu  = require('./lib/tashmetu');
var join      = require('path').join;
var _         = require('lodash');

system.delegates = {
  'tashmetu.storage': 'tashmetu-fs',
  'tashmetu.cache': 'tashmetu-cache'
};

exports = module.exports = function(main, silent, customDelegates) {
  _.assign(system.delegates, customDelegates);

  system.silent = silent;
  system.use(resolve);

  return system.load(main);
}

exports.Component = function() {
  return new Component();
}

exports.App = function(name, deps) {
  system.loadComponent(require('./lib/tashmetu'), 'tashmetu');
  if(deps) {
    deps.forEach(function(cmp) {
      system.loadComponent(require(join(process.cwd(), 'node_modules', cmp)), cmp);
    });
  }
  return new App(name, deps);
}
