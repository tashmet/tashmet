angular.module('tashmetu.post', ['ngResource'])

  .service("$stPost", stPostService)


function stPostService($resource) {
  var url = "http://localhost:3001";
  var postResource = $resource(url + "/posts");

  var postCache = [];
  var postProcessFilters = [];

  return {
    get: function(name, callback) {
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
            return url + "/" + post.name + "/attachments/" + name;
          }
          angular.forEach(post.attachments, function(attachment, index) {
            post.__content = post.__content.replace(attachment, post.attachmentUrl(attachment));
          });

          angular.forEach(postProcessFilters, function(filter, index) {
            post = filter(post);
          });
        });
        postCache = posts;
        callback(posts);
      });
    },

    postProcess: function(filter) {
      postProcessFilters.push(filter);
    }
  }
}
