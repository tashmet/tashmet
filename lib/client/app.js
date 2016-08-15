function TashmetuClient() {
  var services = {
    cache    : require('../common/services/cache'),
    remote   : require('../common/services/remote'),
    post     : require('../client/services/post'),
    taxonomy : require('../client/services/taxonomy'),
    sync     : require('../client/services/sync')
  };

  var socket = io();

  var cache    = new services.cache();
  var remote   = new services.remote();
  var sync     = new services.sync(socket);
  var post     = new services.post(remote, cache, sync);
  var taxonomy = new services.taxonomy(remote, cache);

  return {
    cache    : cache,
    remote   : remote,
    post     : post,
    taxonomy : taxonomy
  };
}

exports = module.exports = TashmetuClient();
