function Component() {
  this._controller = null;
  this.services = {};
  this.types = {};
  this.factories = {};
  this.clis = {};
}

Component.prototype.controller = function(deps, fn) {
  this._controller = { deps: deps, fn: fn };
  return this;
};

Component.prototype.service = function(name, inject, fn) {
  this.services[name] = fn;
  this.services[name]['@singleton'] = true;
  this.services[name]['@require'] = inject;
  return this;
};

Component.prototype.type = function(name, obj) {
  this.types[name] = obj;
  return this;
};

Component.prototype.factory = function(name, fn) {
  this.factories[name] = fn;
  return this;
};

Component.prototype.cli = function(name, obj) {
  this.clis[name] = obj;
  return this;
};

exports = module.exports = Component;
