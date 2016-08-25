function TashmetuClient() {
  var services = {
    cache    : require('../common/services/cache'),
    remote   : require('../common/services/remote'),
    post     : require('../client/services/post'),
    taxonomy : require('../client/services/taxonomy'),
    author   : require('../client/services/author'),
    sync     : require('../client/services/sync'),
    config   : require('../client/services/config')
  };

  var socket = io();

  var cache    = new services.cache();
  var remote   = new services.remote();
  var sync     = new services.sync(socket);
  var post     = new services.post(remote, cache, sync);
  var taxonomy = new services.taxonomy(remote, cache, sync);
  var author   = new services.author(remote, cache, sync);
  var config   = new services.config(remote, cache, sync);

  return {
    cache    : cache,
    remote   : remote,
    post     : post,
    taxonomy : taxonomy,
    author   : author,
    config   : config
  };
}

exports = module.exports = TashmetuClient();
