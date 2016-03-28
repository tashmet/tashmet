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

function onPost(actions, callback) {
  actions.forEach(function(action) {
    postHandlers[action].push(callback);
  });
}

function onPostData(actions, matcher, callback) {
  actions.forEach(function(action) {
    postDataHandlers[action].push({
      matcher: matcher,
      callback: callback
    });
  });
}

module.exports = {
  post: post,
  postData: postData,

  onPost: onPost,
  onPostData: onPostData
}
