var Config = require('../../common/config');
var util   = require('../../common/util');
var events = require('events');


function ConfigService(remote, cache, sync) {
  var remoteCol = remote.collection('configs');

  var collection = cache.collection(remoteCol);

  sync.collection('configs', remoteCol);

  Config.call(this, collection, new events.EventEmitter());
}

util.inherits(ConfigService, Config);

exports = module.exports = ConfigService;

