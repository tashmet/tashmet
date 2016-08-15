function TashmetuClient() {
  var services = {
    cache  : require('../common/services/cache'),
    remote : require('../common/services/remote'),
    post   : require('../client/services/post')
  };

  var cache = new services.cache();
  var remote = new services.remote();
  var post = new services.post(remote, cache);

  return {
    cache: cache,
    remote: remote,
    post: post
  };
}

exports = module.exports = TashmetuClient();
