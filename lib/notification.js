var anymatch = require('anymatch');

var postHandlers = {
  'add': [],
  'remove': [],
  'change': []
}
var postDataHandlers = {
  'add': [],
  'remove': [],
  'change': []
}

function post(action, obj) {
  postHandlers[action].forEach(function(callback) {
    callback(obj);
  });
}

function postData(action, post, path) {
  postDataHandlers[action].forEach(function(handler) {
    var root = 'content/posts/' + post.name + '/';
    var rel = path.substr(root.length);
    if(post && anymatch(handler.matcher, rel)) {
      handler.callback(post, rel);
    }
  });
}

function watchPosts(handlers) {
  for(var action in handlers) {
    postHandlers[action].push(handlers[action]);
  }
}

function watchPostData(matcher, handlers) {
  for(var action in handlers) {
    postDataHandlers[action].push({
      matcher: matcher,
      callback: handlers[action]
    });
  }
}

module.exports = {
  post: post,
  postData: postData,
  watchPosts: watchPosts,
  watchPostData: watchPostData,
}
