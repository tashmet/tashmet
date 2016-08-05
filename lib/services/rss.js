var async  = require('async');
var chalk  = require('chalk');
var events = require('events');
var marked = require('marked');
var RSS    = require('rss');
var _      = require('lodash');

var eventEmitter = new events.EventEmitter();


function Feed(site, post) {

  this.generate = function(itemLimit, cb) {
    var feed = new RSS({
      title: site.title(),
      description: site.description(),
      feed_url: site.url()
    });

    post.findAll(function(err, posts) {
      posts = _.orderBy(posts, 'published', 'desc')
        .slice(0, itemLimit);

      async.eachSeries(posts, function(post, done) {
        feed.item({
          title: post.title,
          description: post.excerpt || marked(post.__content),
          url: site.url() + '/' + post.name,
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
 * @requires site
 * @requires post
 *
 * @description
 * This service is responsible for providing an rss feed at /rss
 *
 * The rss feed can be configured in tashmetu/config/rss.yml with the
 * following properties:
 *   - itemLimit: Number of items to display (default is 30)
 *
 * @fires rss-feed-updated
 * @fires rss-config-changed
 */
exports = module.exports = function(app, site, post, config) {
  var feed = new Feed(site, post);
  var xml;
  var rssConfig = {};

  config.defaults('rss', {
    itemLimit: 30,
  });

  config.on('config-changed', function(ev) {
    if(ev.name === 'rss') {
      rssConfig = ev.config;
      eventEmitter.emit('rss-config-changed', rssConfig);
      update();
    }
  });

  post.on('ready', function() {
    update();
    post.on('post-added',          update);
    post.on('post-changed',        update);
    post.on('post-removed',        update);
    site.on('site-config-changed', update);
  });

  function update() {
    feed.generate(rssConfig.itemLimit, function(output) {
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
