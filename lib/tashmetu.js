var express = require('./services/express');
var factory = require('./services/factory');
var loader  = require('./services/loader');
var log     = require('./services/log');
var rest    = require('./services/rest');
var server  = require('./services/server');
var socket  = require('./services/socket');
var storage = require('./services/storage');
var _       = require('lodash');

var Component = require('./component');

exports = module.exports = new Component()
  .service('express', [], express)

  .service('factory', [], factory)

  .service('loader', [
    'tashmetu.storage',
    'tashmetu.cache',
    'tashmetu.factory',
    'tashmetu.log'
  ], loader)

  .service('log', [], log)

  .service('rest', [
    'tashmetu.express',
    'tashmetu.storage',
    'tashmetu.cache',
    'tashmetu.log'
    ], rest)

  .service('server', [
    'tashmetu.express'
    ], server)

  .service('socket', [
    'tashmetu.server',
    'tashmetu.log'
    ], socket)

  .service('storage', [], storage)

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
