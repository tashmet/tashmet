var Site   = require('../../common/site.js');
var events = require('events');
var util   = require('util');
var _      = require('lodash');

var eventEmitter = new events.EventEmitter();

function SiteService(config) {
  var site = this;

  Site.call(this, eventEmitter);

  config.on('config-changed', function(cfg) {
    if(cfg.__id === 'tashmetu.site') {
      site.siteConfig = cfg;
      eventEmitter.emit('site-config-changed', site.siteConfig);
    }
  });

  this.siteConfig = config.defaults('tashmetu.site');
}

util.inherits(SiteService, Site);

/**
 * @module site
 * @requires express
 * @requires config
 * @requires socket
 *
 * @description
 * This service is responsible for providing basic information about the site.
 * This information can be changed in it's configuration file
 * tashmetu/config/site.yml and is made available at /api/site.
 *
 * @fires site-config-changed
 */
exports = module.exports = function(config) {
  return new SiteService(config);
};
