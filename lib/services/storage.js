var chokidar  = require('chokidar');
var events    = require('events');
var fs        = require('fs');
var path      = require('path');
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

function ValidationException(obj, verdict) {
  this.obj = obj;
  this.schema = verdict.schema;
  this.errors = verdict.errors;
}

function postName(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
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

/**
 * @module storage
 * @requires validator
 *
 * @description
 * Storage service responsible for loading and storing posts and taxnomomies
 * on the filesystem. This service also listens for file changes and emits
 * events when files are added, changed or removed
 */
exports = module.exports = function(validator) {
  var storage = this;

  function assertPostValid(post) {
    var verdict = validator.checkPost(post);
    if(!verdict.success) {
      var err = new ValidationException(post, verdict);
      eventEmitter.emit('post-error', err);
      throw err;
    }
  }


  /**
   * Start listening for file changes
   */
  this.listen = function() {
    watch();
  };

  /**
   * @description
   * Load a post given its name. Something
   *
   * @example
   * <caption>Load a post, catching exceptions</caption>
   * try {
   *   var post = storage.post('example-post');
   * } catch(e) {
   *
   * }
   *
   * @param {String} name - Name of the post
   * @throws {ParseException}
   * @throws {ValidationException}
   */
  this.post = function(name) {
    var file = path.join(basePath('posts'), name + '.md');
    var obj;

    try {
      var stat = fs.lstatSync(file);
      obj = yamlFront.loadFront(fs.readFileSync(file));
      obj.name = name;
      obj.modified = stat.mtime;
    } catch(e) {
      var parseException = new ParseException(name, file, e.message);
      eventEmitter.emit('post-error', parseException);
      throw parseException;
    }

    assertPostValid(obj);

    return obj;
  };

  /**
   * @description
   * Load all posts
   *
   * @example
   * <caption>Load all posts, catching exceptions</caption>
   * try {
   *   var posts = storage.posts();
   * } catch(e) {}
   *
   * @example
   * <caption>Load all posts, suppressing errors</caption>
   * var posts = storage.posts(true);
   *
   * @param {Boolean} [suppressErrors] - If set, posts that fail to be parsed
   *    or validated will simply be omitted from the results and this function
   *    will not throw any exceptions.
   *
   * @throws {ParseException}
   * @throws {ValidationException}
   * @returns {Array} List of posts loaded.
   */
  this.posts = function(suppressErrors) {
    if(suppressErrors === undefined) {
      suppressErrors = false;
    }
    return loadAll('posts', function(file) {
      if(file.match(/^(.*\.md$)$/)) {
        if(suppressErrors) {
          try {
            return storage.post(path.basename(file, '.md'));
          } catch(e) {
            return false;
          }
        } else {
          return storage.post(path.basename(file, '.md'));
        }
      } else {
        return false;
      }
    });
  };

  /**
   * Load all posts asynchronously.
   *
   * TODO: This function needs to be rethought
   */
  this.postsAsync = function(fn) {
    var errors = {};
    var posts = loadAll('posts', function(file) {
      var name = path.basename(file, '.md');
      if(file.match(/^(.*\.md$)$/)) {
        try {
          return storage.post(name);
        } catch(e) {
          errors[name] = e;
          return false;
        }
      } else {
        return false;
      }
    });
    fn(posts, errors);
  };

  /**
   * @description
   * Write a post to the file system.
   *
   * @example
   * try {
   *   var path = storage.store({
   *     title: "Example post",
   *     __content: "Post content"
   *   });
   * } catch(e) {}
   *
   * @param {Object} post - Post to store
   * @throws ValidationException
   * @returns {String} Path of post file relative to running directory.
   */
  this.storePost = function(post) {
    assertPostValid(post);

    var output = '---\n' + yaml.safeDump(_.omit(post, ['name', '__content'])) + '---';
    if(post.__content) {
      output += '\n' + post.__content.replace(/^\s+|\s+$/g, '');
    }
    var postPath = path.join(basePath('posts'), postName(post.title) + '.md');
    fs.writeFileSync(postPath, output);
    return path.relative(process.cwd(), postPath);
  };

  /**
   * @description
   * Load a taxonomy by name from the file system.
   *
   * @param {String} name - Name of taxonomy
   * @returns {Object}
   */
  this.taxonomy = function(name) {
    var terms = loadYaml(path.join(basePath('taxonomies'), name + '.yml'));
    return { name: name, terms: terms };
  };

  /**
   * @description
   * Load all taxonomies on the file system.
   *
   * @returns {Array}
   */
  this.taxonomies = function() {
    return loadAll('taxonomies', function(file) {
      if(file.match(/^(.*\.yml$)$/)) {
        return storage.taxonomy(path.basename(file, '.yml'));
      } else {
        return false;
      }
    });
  };

  /**
   * @description
   * Add a content filter that will trigger events when a content file
   * matching a given pattern has been added, changed or removed.
   *
   * @example
   *    <caption>
   *      Listen for .jpg attachments.
   *    </caption>
   *    storage.contentFilter('attachment',
   *      /^posts\/([a-z0-9\-]*)\/attachments\/(.*\.jpg)$/g);
   *
   *    storage.on('attachment-added', function(postName, fileName) {
   *      console.log(fileName + ' added for post ' + postName);
   *    });
   *
   * @param {String} eventName - Name of event
   * @param {String} pattern - Regex pattern
   */
  this.contentFilter = function(eventName, pattern) {
    contentFilters.push({eventName: eventName, pattern: pattern});
  };

  /**
   * Register an event handler.
   *
   * @param {String} eventName - The name of the event.
   * @param {Function} listener - The callback function.
   */
  this.on = function(eventName, listener) {
    eventEmitter.on(eventName, listener);
  };

  this.ParseException = ParseException;

  this.ValidationException = ValidationException;

  return this;
};
