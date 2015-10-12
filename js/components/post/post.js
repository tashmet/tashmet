angular.module('tashmetu.post', ['ngResource'])

  .service("$stPost", stPostService);

function stPostService($resource) {
  var url = "http://localhost:3001";
  var postResource = $resource(url + "/posts");

  var postCache = [];

  return {
    get: function(name, callback) {
      console.log("Get: " + name);
      this.findPosts({}, function(posts) {
        angular.forEach(posts, function(post, index) {
          if(post.name == name) {
            callback(post);
          }
        });
      });
    },

    findPosts: function(query, callback) {
      if(postCache.length != 0) {
        return callback(postCache);
      }

      postResource.query(query, function(posts) {
        angular.forEach(posts, function(post, index) {
          post.attachmentUrl = function(name) {
            return url + "/attachments/posts/" + post.name + "/" + name;
          }
        });
        postCache = posts;
        callback(posts);
      });
    }
  }
}