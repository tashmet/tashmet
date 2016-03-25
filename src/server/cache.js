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

module.exports = {
  storePost: storePost,

  posts: function() {
    return posts;
  }
}
