var util      = require('util');
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

exports = module.exports = App;
