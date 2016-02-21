var post     = require('./src/server/post.js');
var taxonomy = require('./src/server/taxonomy.js');
var express  = require('express');

function main(server) {
  var posts = post.loadAll();

  posts.forEach(function(post) {
    server.use('/' + post.name + '/attachments',
      express.static('./content/posts/' + post.name + '/attachments'));
  });

  server.get('/posts', function(req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    res.send(posts);
  });

  server.get('/taxonomies/:taxonomy', function(req, res, next) {
    var tax = taxonomy.load(req.params.taxonomy);
    res.setHeader('Content-Type', 'application/json');
    res.send(tax);
  });
}

module.exports = {
  configure: main
}
