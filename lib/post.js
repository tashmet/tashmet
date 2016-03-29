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
      ending = file.substr(file.lastIndexOf('.') + 1);
      buffer = fs.readFileSync(path + '/' + file, 'utf8');

      if (ending == 'md') {
        content[key] = yamlFront.loadFront(buffer);
      }
      else if (ending == 'yml') {
        content[key] = yaml.safeLoad(buffer);
      }
  });

  return content;
}

function loadPost(name) {
  var path = './content/posts/' + name;
  var content = loadDirectory(path);
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

function findRelated(post, rest, compare) {
  var related = [];
  rest.forEach(function(other) {
    var score = compare(post, other);
    if (score > 0) {
      related.push([score, other.name]);
    }
  });
  related.sort(function(a, b) {
    a = a[0];
    b = b[0];
    return a > b ? -1 : (a > b ? 1 : 0);
  });
  var result = [];
  related.forEach(function(relationship) {
    result.push(relationship[1]);
  });
  return result;
}

module.exports = {
  load: loadPost,
  loadAll: loadAllPosts,
  findRelated: findRelated
}
