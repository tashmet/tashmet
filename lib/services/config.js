var _ = require('lodash');

exports = module.exports = function(app, storage, cache, yaml) {
  var _config = null;
  var _configPublic = {};

  var resource = storage.resource('config', {
    pattern: 'config/{name}.yml',
    loaders: [yaml]
  });

  function getConfig(cb) {
    if(_config) {
      cb(_config);
    } else {
      resource.get({name: 'server'}, function(err, obj) {
        _config = obj || {};
        resource.get({name: 'public'}, function(err, obj) {
          if(!err) {
            _config = _.merge(_config, obj);
            _configPublic = obj;
          }
          cb(_config);
        });
      });
    }
  }

  /**
   * Get configuration for a service.
   *
   * @param {String} name - Name of the service.
   * @param {Function} cb - Callback delivering the configuration.
   */
  this.service = function(name, cb) {
    getConfig(function(config) {
      if(config.services) {
        cb(config.services[name] || {});
      } else {
        cb({});
      }
    });
  };

  app.get('/config', function(req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    getConfig(function(config) {
      res.send(_configPublic);
    });
  });

  return this;
};
