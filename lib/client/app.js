function TashmetuClient() {
  var services = {
    cache    : require('../common/services/cache'),
    remote   : require('../common/services/remote'),
    post     : require('../client/services/post'),
    taxonomy : require('../client/services/taxonomy'),
    sync     : require('../client/services/sync'),
    site     : require('../client/services/site')
  };

  var socket = io();

  var cache    = new services.cache();
  var remote   = new services.remote();
  var sync     = new services.sync(socket);
  var post     = new services.post(remote, cache, sync);
  var taxonomy = new services.taxonomy(remote, cache);
  var site     = new services.site(remote, socket);

  return {
    cache    : cache,
    remote   : remote,
    post     : post,
    taxonomy : taxonomy,
    site     : site
  };
}

exports = module.exports = TashmetuClient();
