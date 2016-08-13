var events = require('events');
var _      = require('lodash');

var eventEmitter = new events.EventEmitter();


/**
 * @module site
 * @requires express
 * @requires config
 * @requires socket
 *
 * @description
 * This service is responsible for providing basic information about the site.
 * This information can be changed in it's configuration file
 *  tashmetu/config/site.yml and is made available at /api/site.
 *
 * @fires site-config-changed
 */
exports = module.exports = function(app, config, socket) {
  var siteConfig = {};

  config.on('config-changed', function(ev) {
    if(ev.name === 'tashmetu.site') {
      siteConfig = ev.config;
      eventEmitter.emit('site-config-changed', siteConfig);
    }
  });

  socket.forward(eventEmitter, 'site-config-changed');

  app.get('/api/site', function(req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    res.send(siteConfig);
  });

  /**
   * Get the site title.
   *
   * @return {String}
   */
  this.title = function() {
    return siteConfig.title;
  };

  /**
   * Get the site description.
   *
   * @return {String}
   */
  this.description = function() {
    return siteConfig.description;
  };

  /**
   * Get the site url.
   *
   * @return {String}
   */
  this.url = function() {
    return siteConfig.url;
  };

  /**
   * Register an event handler.
   */
  this.on = function(event, fn) {
    eventEmitter.on(event, fn);
  };

  return this;
};
