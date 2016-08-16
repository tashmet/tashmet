/**
 * @class
 */
function Site(eventEmitter) {
  this.siteConfig = {};
  this.eventEmitter = eventEmitter;
}

/**
 * Get the site title.
 *
 * @return {String}
 */
Site.prototype.title = function() {
  return this.siteConfig.title;
};

/**
 * Get the site description.
 *
 * @return {String}
 */
Site.prototype.description = function() {
  return this.siteConfig.description;
};

/**
 * Get the site url.
 *
 * @return {String}
 */
Site.prototype.url = function() {
  return this.siteConfig.url;
};

/**
 * Register an event handler.
 */
Site.prototype.on = function(event, fn) {
  this.eventEmitter.on(event, fn);
};

exports = module.exports = Site;
