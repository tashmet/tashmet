var Post   = require('../../common/post');
var util   = require('../../common/util');
var events = require('events');


function PostService(remote, cache) {
  var collection = cache.collection(remote.collection('posts'));

  Post.call(this, collection, new events.EventEmitter());
}

util.inherits(PostService, Post);

exports = module.exports = PostService;
