angular.module('tashmetu.post', ['ngResource'])

  .service("$stPost", stPostService);

function stPostService($resource) {
  var url = "http://localhost:3001";
  var postResource = $resource(url + "/posts");

  return {
    findPosts: function(query, callback) {
      postResource.query(query, function(posts) {
        angular.forEach(posts, function(post, index) {
          post.attachmentUrl = function(name) {
            return url + "/attachments/posts/" + post.name + "/" + name;
          }
        });
        callback(posts);
      });
    }
  }
}