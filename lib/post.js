var _ = require('lodash');

var factory = {
  name: 'post',
  description: 'Create a post',
  cli: [
    {
      name: 'title',
      type: 'string',
      required: true
    }
  ],
  create: function(data) {
    return {
      title: data.title,
      type: 'post'
    };
  }
}

var post = {
  name: 'post',
  schema: require('../schema/post.json'),

  compare: function(a, b) {
    return _.intersection(a.tags, b.tags).length;
  },

  process: function(post, done) {
    done(post);
  }
}

module.exports = {
  posts: [post],
  factories: [factory]
}
