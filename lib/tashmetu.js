var content   = require('./services/content');
var express   = require('./services/express');
var factory   = require('./services/factory');
var log       = require('./services/log');
var post      = require('./services/post');
var reporter  = require('./services/reporter');
var server    = require('./services/server');
var socket    = require('./services/socket');
var storage   = require('./services/storage');
var taxonomy  = require('./services/taxonomy');
var validator = require('./services/validator');
var _         = require('lodash');

var Component = require('./component');

exports = module.exports = new Component()
  .service('content', [
    'tashmetu.express'
  ], content)

  .service('express', [], express)

  .service('factory', [], factory)

  .service('log', [], log)

  .service('post', [
    'tashmetu.express',
    'tashmetu.storage',
    'tashmetu.cache',
    'tashmetu.factory'
  ], post)

  .service('reporter', [
    'tashmetu.log',
    'tashmetu.socket',
    'tashmetu.storage',
    'tashmetu.post',
    'tashmetu.taxonomy',
    'tashmetu.content'
  ], reporter)

  .service('server', [
    'tashmetu.express'
    ], server)

  .service('socket', [
    'tashmetu.server',
    'tashmetu.log'
    ], socket)

  .service('storage', [
    'tashmetu.validator'
  ], storage)

  .service('taxonomy', [
    'tashmetu.express',
    'tashmetu.storage',
    'tashmetu.cache'
  ], taxonomy)

  .service('validator', [
    'tashmetu.factory'
  ], validator)

  .type('post', {
    schema: require('../schema/post.json'),

    compare: function(a, b) {
      return _.intersection(a.tags, b.tags).length;
    },

    process: function(post, done) {
      done(post);
    }
  })

  .factory('postFactory', function(data, fn) {
    var post = {
      title: data.title,
      type: 'post'
    };
    fn(post);
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
