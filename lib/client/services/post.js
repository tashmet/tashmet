var Post   = require('../../common/post');
var util   = require('../../common/util');
var events = require('events');


function PostService(remote, cache, sync) {
  var remoteCol = remote.collection('posts');

  var collection = cache.collection(remoteCol);

  sync.collection('posts', remoteCol);

  Post.call(this, collection, new events.EventEmitter());
}

util.inherits(PostService, Post);

exports = module.exports = PostService;
