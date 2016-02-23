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

function loadPost(name) {
  var root = './content/posts/' + name;
  var post = yamlFront.loadFront(fs.readFileSync(root + '/post.md', 'utf8'));

  getFiles(root).forEach(function(file) {
    if (file != 'post.md') {
      key = file.substr(0, file.lastIndexOf('.'));
      format = file.substr(file.lastIndexOf('.') + 1);
      if (format == 'md') {
        post[dir][key] = yamlFront.loadFront(fs.readFileSync(root + '/' + file, 'utf8'));
      }
      else if (format == 'yml') {
        post[key] = yaml.safeLoad(fs.readFileSync(root + '/' + file, 'utf8'));
      }
    }
  });

  getDirectories(root).forEach(function(dir) {
    if (dir == 'attachments') {
      post.attachments = getFiles(root + '/' + dir);
    }
    else {
      post[dir] = {};
      getFiles(root + '/' + dir).forEach(function(file) {
        key = file.substr(0, file.indexOf('.'));
        post[dir][key] = yamlFront.loadFront(fs.readFileSync(root + '/' + dir + '/' + file, 'utf8'));
      });
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
