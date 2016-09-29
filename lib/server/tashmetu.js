var author    = require('./services/author');
var config    = require('./services/config');
var content   = require('./services/content');
var cache     = require('../common/services/cache');
var core      = require('./services/core');
var database  = require('./services/database');
var express   = require('./services/express');
var factory   = require('./services/factory');
var log       = require('./services/log');
var pipeline  = require('./services/pipeline');
var post      = require('./services/post');
var rest      = require('./services/rest');
var reporter  = require('./services/reporter');
var rss       = require('./services/rss');
var server    = require('./services/server');
var socket    = require('./services/socket');
var storage   = require('./services/storage');
var sync      = require('./services/sync');
var taxonomy  = require('./services/taxonomy');
var validator = require('./services/validator');
var yaml      = require('./services/yaml');

var Component = require('./component');

exports = module.exports = new Component('tashmetu')

  .collection('authors', [], function() {
    return {
      schema: require('../../schema/author.json'),
      share: true,
      sync: true
    };
  })

  .collection('configs', [
    'tashmetu.core',
    'tashmetu.storage'
  ], require('./collections/configs'))

  .collection('posts', [
    'tashmetu.factory'
  ], require('./collections/posts'))

  .collection('taxonomies', [], function() {
    return {
      share: true,
      sync: true
    };
  })

  .service('author', [
    'tashmetu.database'
  ], author)

  .service('cache', [], cache)

  .service('config', ['tashmetu.database'], config)

  .service('content', [
    'tashmetu.express'
  ], content)

  .service('core', [], core)

  .service('database', [
    'tashmetu.core',
    'tashmetu.cache',
    'tashmetu.storage',
    'tashmetu.pipeline',
    'tashmetu.yaml',
    'tashmetu.rest',
    'tashmetu.sync',
    'tashmetu.express',
    'tashmetu.validator'
  ], database)

  .service('express', [], express)

  .service('factory', [], factory)

  .service('log', [], log)

  .service('pipeline', [], pipeline)

  .service('post', [
    'tashmetu.database',
  ], post)

  .service('reporter', [
    'tashmetu.log',
    'tashmetu.socket',
    'tashmetu.content',
    'tashmetu.rest',
    'tashmetu.database'
  ], reporter)

  .service('rest', [
    'tashmetu.express'
  ], rest)

  .service('rss', [
    'tashmetu.express',
    'tashmetu.post',
    'tashmetu.config'
  ], rss)

  .service('server', [
    'tashmetu.express'
    ], server)

  .service('socket', [
    'tashmetu.server'
    ], socket)

  .service('storage', [], storage)

  .service('sync', [
    'tashmetu.socket'
  ], sync)

  .service('taxonomy', [
    'tashmetu.database',
  ], taxonomy)

  .service('validator', [], validator)

  .service('yaml', [], yaml)

  .config('rss', {
    schema: require('../../schema/config/rss.json'),
    shared: false
  })

  .config('site', {
    schema: require('../../schema/config/site.json'),
    shared: true
  })

  .type('post', {
    schema: require('../../schema/post.json'),

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
