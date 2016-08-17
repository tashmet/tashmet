var Site   = require('../../common/site');
var util   = require('../../common/util');
var events = require('events');


function SiteService(remote, socket) {
  var site = this;
  var eventEmitter = new events.EventEmitter();

  Site.call(this, eventEmitter);

  remote.get('site', function(err, obj) {
    site.siteConfig = obj;
    eventEmitter.emit('site-config-changed', obj);
    eventEmitter.emit('ready');
  });

  socket.on('site-config-changed', function(obj) {
    site.siteConfig = obj;
    eventEmitter.emit('site-config-changed', obj);
  });
}

util.inherits(SiteService, Site);

exports = module.exports = SiteService;
