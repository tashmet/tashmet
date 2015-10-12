#! /usr/bin/env node

var express = require('express');
var fs      = require('fs');
var path    = require('path');
var yaml    = require('js-yaml');

var app = express();

function getDirectories(srcPath) {
  return fs.readdirSync(srcPath).filter(function(file) {
    return fs.statSync(path.join(srcPath, file)).isDirectory();
  });
}

function getFiles(srcPath) {
  return fs.readdirSync(srcPath).filter(function(file) {
    return fs.statSync(path.join(srcPath, file)).isFile();
  });
}

function loadYaml(path) {
	return yaml.safeLoad(fs.readFileSync(path, 'utf8'));
}

app.use('/attachments', express.static('./attachments'));

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
 });

app.get('/posts', function(req, res, next) {
	var posts = [];

	getFiles('./posts').forEach(function(file) {
		var post = yaml.safeLoad(fs.readFileSync('./posts/' + file, 'utf8'));
		post.name = file.substr(0, file.indexOf('.'));
		posts.push(post);
	});

	res.setHeader('Content-Type', 'application/json');
	res.send(posts);
});

app.get('/taxonomies/:taxonomy', function(req, res, next) {
	var taxonomies = [];
	var taxonomy = loadYaml('./taxonomies/' + req.params.taxonomy + '.yml', 'utf8');
	res.setHeader('Content-Type', 'application/json');
	res.send(taxonomy);
});

app.listen(3001, function() {
	console.log('Tashmetu listens on port 3001');
});