var join     = require('path').join;
var tashmetu = require('../../index');
var _        = require('lodash');

exports = module.exports = tashmetu.Component()

  .type('post', {
    schema: require('../../schema/post.json'),

    compare: function(a, b) {
      return _.intersection(a.tags, b.tags).length;
    },

    process: function(post, done) {
      done(post);
    }
  })

  .factory('postFactory', function(data) {
    return {
      title: data.title,
      type: 'post'
    };
  })

  .cli('post', {
    description: 'Create a post',
    factory: 'postFactory',
    input: [
      {
        name: 'title',
        type: 'string',
        required: true
      }
    ]
  });

