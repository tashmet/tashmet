var async  = require('async');
var chalk  = require('chalk');
var events = require('events');
var marked = require('marked');
var RSS    = require('rss');
var _      = require('lodash');

var eventEmitter = new events.EventEmitter();


function Feed(post) {

  this.generate = function(site, rss, cb) {
    var feed = new RSS({
      title: site.title,
      description: site.description,
      feed_url: site.url
    });

    post.findAll(function(err, posts) {
      posts = _.orderBy(posts, 'published', 'desc')
        .slice(0, rss.itemLimit);

      async.eachSeries(posts, function(post, done) {
        feed.item({
          title: post.title,
          description: post.excerpt || marked(post.__content),
          url: site.url + '/' + post.name,
          categories: post.tags,
          author: post.author.firstname + ' ' + post.author.lastname,
          date: post.published,
        });
        done();
      }, function(err) {
        cb(feed.xml());
      });
    });
  };
}

/**
 * @module rss
 * @requires express
 * @requires post
 * @requires config
 *
 * @description
 * This service is responsible for providing an rss feed at /rss
 *
 * The rss feed can be configured in tashmetu/config/rss.yml with the
 * following properties:
 *   - itemLimit: Number of items to display (default is 30)
 *
 * @fires rss-feed-updated
 */
exports = module.exports = function(app, post, config) {
  var feed = new Feed(post);
  var xml;
  var siteConfig = {};
  var rssConfig = {};

  config.on('config-changed', function(ev) {
    if(ev.__id === 'tashmetu.site') {
      siteConfig = ev;
      update();
    }

    else if(ev.__id === 'tashmetu.rss') {
      rssConfig = ev.config;
      update();
    }
  });

  post.on('ready', function() {
    update();
    post.on('post-added',   update);
    post.on('post-changed', update);
    post.on('post-removed', update);
  });

  function update() {
    feed.generate(siteConfig, rssConfig, function(output) {
      xml = output;
      eventEmitter.emit('rss-feed-updated', xml);
    });
  }

  app.get('/rss', function(req, res, next) {
    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  });

  /**
   * Register an event handler.
   */
  this.on = function(event, fn) {
    eventEmitter.on(event, fn);
  };
};
