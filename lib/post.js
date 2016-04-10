var util      = require('./util.js')
var fs        = require('fs');
var path      = require('path');
var yaml      = require('js-yaml');
var yamlFront = require('yaml-front-matter');
var _         = require('lodash');

function loadDirectory(path) {
   var content = {};

   util.files(path).forEach(function(file) {
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

function load(name) {
  var path = './tashmetu/content/posts/' + name;
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

function loadAll() {
  var posts = [];
  util.directories('./tashmetu/content/posts').forEach(function(dir) {
    posts.push(load(dir));
  });
  return posts;
}

function store(post) {
  var yamlOut = '---\n' + yaml.safeDump(post) + '---';
  var dir = './tashmetu/content/posts/' + slug(post.title);
  var path = dir + '/post.md';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    fs.writeFileSync(path, yamlOut);
    return path;
  } else {
    throw 'A post with that name already exists';
  }
}

function findRelated(post, rest, compare) {
  var related = [];
  rest.forEach(function(other) {
    var score = compare(post, other);
    if (score > 0) {
      related.push({name: other.name, score: score});
    }
  });
  related = _.orderBy(related, 'score', 'desc');

  return _.transform(related, function(result, value, key) {
    result.push(value.name);
  });
}

function slug(str) {
  str = str.toLowerCase();
  str = str.replace(/[^a-z0-9]+/g, '-');
  str = str.replace(/^-|-$/g, '');
  return str;
}

module.exports = {
  load: load,
  loadAll: loadAll,
  store: store,
  findRelated: findRelated
}
