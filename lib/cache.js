var posts = [];

function storePost(post) {
  for(var i=0; i<posts.length; i++) {
    if(posts[i].name == post.name) {
      posts[i] = post;
      return false;
    }
  }
  posts.push(post);
  return true;
}

function post(name) {
  for(var i=0; i<posts.length; i++) {
    if(posts[i].name == name) {
      return posts[i];
    }
  }
  return null;
}

module.exports = {
  storePost: storePost,

  post: post,
  posts: function() {
    return posts;
  }
}
