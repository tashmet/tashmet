#! /usr/bin/env node

var express = require('express');
var fs      = require('fs');
var path    = require('path');

var app = express();

function getDirectories(srcPath) {
  return fs.readdirSync(srcPath).filter(function(file) {
    return fs.statSync(path.join(srcPath, file)).isDirectory();
  });
}

app.use('/attachments', express.static('./attachments'));

app.all('/posts', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
 });

app.get('/posts', function(req, res, next) {
	var posts = [];

	dir = getDirectories('./posts');
	dir.forEach(function(postDir) {
		postString = fs.readFileSync('./posts/' + postDir + '/post.json', 'utf8');
		post = JSON.parse(postString);
		post.name = postDir;
		posts.push(post);
	});

	res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(posts));
});

app.listen(3001, function() {
	console.log('Tashmetu listens on port 3001');
});