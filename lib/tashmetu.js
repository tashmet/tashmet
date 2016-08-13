var author    = require('./services/author');
var config    = require('./services/config');
var content   = require('./services/content');
var cache  = require('./services/cache');
var express   = require('./services/express');
var factory   = require('./services/factory');
var log       = require('./services/log');
var pipeline  = require('./services/pipeline');
var post      = require('./services/post');
var reporter  = require('./services/reporter');
var rss       = require('./services/rss');
var server    = require('./services/server');
var site      = require('./services/site');
var socket    = require('./services/socket');
var storage   = require('./services/storage');
var taxonomy  = require('./services/taxonomy');
var validator = require('./services/validator');
var yaml      = require('./services/yaml');
var _         = require('lodash');

var Component = require('./component');

exports = module.exports = new Component()

  .service('author', [
    'tashmetu.express',
    'tashmetu.storage',
    'tashmetu.cache',
    'tashmetu.yaml',
    'tashmetu.validator',
    'tashmetu.socket',
    'tashmetu.pipeline'
  ], author)

  .service('cache', [], cache)

  .service('config', [
    'tashmetu.express',
    'tashmetu.storage',
    'tashmetu.cache',
    'tashmetu.yaml',
    'tashmetu.pipeline'
  ], config)

  .service('content', [
    'tashmetu.express'
  ], content)

  .service('express', [], express)

  .service('factory', [], factory)

  .service('log', [], log)

  .service('pipeline', [], pipeline)

  .service('post', [
    'tashmetu.express',
    'tashmetu.storage',
    'tashmetu.cache',
    'tashmetu.factory',
    'tashmetu.yaml',
    'tashmetu.validator',
    'tashmetu.socket',
    'tashmetu.author',
    'tashmetu.pipeline'
  ], post)

  .service('reporter', [
    'tashmetu.log',
    'tashmetu.socket',
    'tashmetu.post',
    'tashmetu.taxonomy',
    'tashmetu.author',
    'tashmetu.content',
    'tashmetu.config'
  ], reporter)

  .service('rss', [
    'tashmetu.express',
    'tashmetu.site',
    'tashmetu.post',
    'tashmetu.config'
  ], rss)

  .service('server', [
    'tashmetu.express'
    ], server)

  .service('site', [
    'tashmetu.express',
    'tashmetu.config',
    'tashmetu.socket'
    ], site)

  .service('socket', [
    'tashmetu.server',
    'tashmetu.log'
    ], socket)

  .service('storage', [], storage)

  .service('taxonomy', [
    'tashmetu.express',
    'tashmetu.storage',
    'tashmetu.cache',
    'tashmetu.yaml',
    'tashmetu.pipeline'
  ], taxonomy)

  .service('validator', [], validator)

  .service('yaml', [], yaml)

  .config('rss', require('../schema/config/rss.json'))
  .config('site', require('../schema/config/site.json'))

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
