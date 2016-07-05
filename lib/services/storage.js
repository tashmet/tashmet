var chokidar  = require('chokidar');
var events    = require('events');
var fs        = require('fs');
var path      = require('path');
var validate  = require('jsonschema').validate;
var yaml      = require('js-yaml');
var yamlFront = require('yaml-front-matter');
var _         = require('lodash');

var eventEmitter = new events.EventEmitter();
var contentFilters = [];


function files(srcPath) {
  return fs.readdirSync(srcPath).filter(function(file) {
    return fs.statSync(path.join(srcPath, file)).isFile();
  });
}

function directories(srcPath) {
  return fs.readdirSync(srcPath).filter(function(file) {
    return fs.statSync(path.join(srcPath, file)).isDirectory();
  });
}

function basePath(category) {
  return path.join(process.cwd(), 'tashmetu', category);
}

function loadYaml(path) {
  return yaml.safeLoad(fs.readFileSync(path, 'utf8'));
}

function loadAll(type, load) {
  var collection = [];
  files(basePath(type)).forEach(function(file) {
    var obj = load(file);
    if(obj) {
      collection.push(obj);
    }
  });
  return collection;
}

function ParseException(name, file, message) {
  this.name = name;
  this.file = file;
  this.message = message;
}

function ValidationException(name, obj, schema, errors) {
  this.name = name;
  this.obj = obj;
  this.schema = schema;
  this.errors = errors;
}

function post(name, getSchema) {
  getSchema = getSchema || function(name) { return false; };

  try {
    var file = path.join(basePath('posts'), name + '.md');
    var stat = fs.lstatSync(file);
    var obj = yamlFront.loadFront(fs.readFileSync(file));
    obj.name = name;
    obj.modified = stat.mtime;
  } catch(e) {
    var exception = new ParseException(name, file, e.message);
    eventEmitter.emit('post-error', exception)
    throw exception;
  }

  var schema = getSchema(obj.type || 'post');
  if(schema) {
    var errors = validate(obj, schema).errors;
    if(errors.length > 0) {
      var exception = new ValidationException(name, obj, schema, errors);
      eventEmitter.emit('post-error', exception)
      throw exception;
    }
  }
  return obj;
}

function taxonomy(name) {
  var terms = loadYaml(path.join(basePath('taxonomies'), name + '.yml'));
  return { name: name, terms: terms };
}

function posts(getSchema, suppressErrors) {
  if(suppressErrors === undefined) {
    suppressErrors = false;
  }
  return loadAll('posts', function(file) {
    if(file.match(/^(.*\.md$)$/)) {
      if(suppressErrors) {
        try {
          return post(path.basename(file, '.md'), getSchema);
        } catch(e) {
          return false;
        }
      } else {
        return post(path.basename(file, '.md'), getSchema);
      }
    } else {
      return false;
    }
  });
}

function postsAsync(getSchema, fn) {
  var errors = {};
  var posts = loadAll('posts', function(file) {
    var name = path.basename(file, '.md');
    if(file.match(/^(.*\.md$)$/)) {
      try {
        return post(name, getSchema);
      } catch(e) {
        errors[name] = e;
        return false;
      }
    } else {
      return false;
    }
  });
  fn(posts, errors);
}

function taxonomies() {
  return loadAll('taxonomies', function(file) {
    if(file.match(/^(.*\.yml$)$/)) {
      return taxonomy(path.basename(file, '.yml'));
    } else {
      return false;
    }
  });
}

function storePost(post) {
  var output = '---\n' + yaml.safeDump(_.omit(post, ['name', '__content'])) + '---';
  if(post.__content) {
    output += post.__content;
  }
  var postPath = path.join(basePath('posts'), postName(post.title) + '.md');
  fs.writeFileSync(postPath, output);
  return path.relative(process.cwd(), postPath);
}

function postName(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function contentFilter(eventName, pattern) {
  contentFilters.push({eventName: eventName, pattern: pattern});
}

var watchingOrder = [
  'posts',
  'taxonomies',
  'content',
];

var single = {
  posts:      'post',
  taxonomies: 'taxonomy',
  content:    'content'
};

function processFile(type, filePath, action) {
  var name = '';
  if(type == 'content') {
    name = path.relative(basePath('content'), filePath);
  } else {
    name = path.basename(filePath).split('.')[0];
  }
  eventEmitter.emit(single[type] + '-' + action, name);
}

function watch(index) {
  index = index || 0;
  var section = watchingOrder[index];
  eventEmitter.emit(section + '-start');
  chokidar.watch(basePath(section), {awaitWriteFinish: {stabilityThreshold: 500}})
    .on('add',    function(path) { processFile(section, path, 'added'); })
    .on('change', function(path) { processFile(section, path, 'changed'); })
    .on('unlink', function(path) { processFile(section, path, 'removed'); })
    .on('ready',  function() {
      eventEmitter.emit(section + '-ready');
      if(index + 1 < watchingOrder.length) {
        watch(index + 1);
      } else {
        eventEmitter.emit('ready');
      }
  });

  var actions = ['added', 'changed', 'removed'];
  actions.forEach(function(action) {
    eventEmitter.on('content-' + action, function(path) {
      contentFilters.forEach(function(filter) {
        var match = filter.pattern.exec(path);
        if(match) {
          var args = [];
          args.push(filter.eventName + '-' + action);
          for(var i=0; i<match.length; i++) {
            args.push(match[i]);
          }
          eventEmitter.emit.apply(eventEmitter, args);
        }
      });
    });
  });
}

exports = module.exports = function() {
  return {
    basePath: basePath,
    listen: watch,

    post: post,
    posts: posts,
    postsAsync: postsAsync,
    storePost: storePost,

    taxonomy: taxonomy,
    taxonomies: taxonomies,

    contentFilter: contentFilter,

    on: function(event, fn) {
      eventEmitter.on(event, fn);
    },

    ParseException: ParseException,
    ValidationException: ValidationException,
  }
};
