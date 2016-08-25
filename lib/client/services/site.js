var Site   = require('../../common/site');
var util   = require('../../common/util');
var events = require('events');


function SiteService(config) {
  var site = this;
  var eventEmitter = new events.EventEmitter();

  Site.call(this, eventEmitter);

  config.on('config-changed', function(cfg) {
    if(cfg.__id === 'tashmetu.site') {
      site.siteConfig = cfg;
      eventEmitter.emit('site-config-changed', site.siteConfig);
    }
  });

  config.getByName('tashmetu.site', function(err, obj) {
    if(!err) {
      site.siteConfig = obj;
    }
  });
}

util.inherits(SiteService, Site);

exports = module.exports = SiteService;
