var fs        = require('fs');
var path      = require('path');
var yaml      = require('js-yaml');
var yamlFront = require('yaml-front-matter');

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

function loadDirectory(path) {
   var content = {};

   getFiles(path).forEach(function(file) {
      key = file.substr(0, file.lastIndexOf('.'));
      format = file.substr(file.lastIndexOf('.') + 1);
      if (format == 'md') {
        content[key] = yamlFront.loadFront(fs.readFileSync(path + '/' + file, 'utf8'));
      }
      else if (format == 'yml') {
        content[key] = yaml.safeLoad(fs.readFileSync(path + '/' + file, 'utf8'));
      }
  });

  return content;
}

function loadPost(name) {
  var root = './content/posts/' + name;
  var content = loadDirectory(root);
  var post = content['post'];

  Object.keys(content).forEach(function(key) {
    if (key != 'post') {
      post[key] = content[key];
    }
  });

  post.name = name;
  return post;
}

function loadAllPosts() {
  var posts = [];
  getDirectories('./content/posts').forEach(function(dir) {
    posts.push(loadPost(dir));
  });
  return posts;
}

module.exports = {
  load: loadPost,
  loadAll: loadAllPosts
}
