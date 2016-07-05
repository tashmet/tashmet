var chalk  = require('chalk');
var events = require('events');
var _      = require('lodash');

var eventEmitter = new events.EventEmitter();

function loaderService(storage, cache, factory, log) {
  function loadPost(name) {
    try {
      var post = storage.post(name, factory.schema);
      if(post.status === 'published') {
        factory.process(post, function(result) {
          cache.storePost(result);
        });
      } else {
        if(cache.post(name)) {
          cache.removePost(name);
        }
      }
    } catch(e) {}
  }

  function loadTaxonomy(name) {
    cache.storeTaxonomy(storage.taxonomy(name));
  }

  function findRelated(post, posts) {
    var index = _.isString(post) ? _.findIndex(posts, ['name', post]) : post;
    var related = [];
    var post = posts[index];
    var rest = posts.slice(0);

    rest.splice(index, 1);
    rest.forEach(function(other) {
      var score = factory.compare(post, other);
      if (score > 0) {
        related.push({name: other.name, score: score});
      }
    });
    related = _.orderBy(related, 'score', 'desc');

    return _.transform(related, function(result, value, key) {
      result.push(value.name);
    });
  }

  storage.on('post-added', loadPost);
  storage.on('post-changed', loadPost);
  storage.on('post-removed', cache.removePost);

  storage.on('taxonomy-added', loadTaxonomy);
  storage.on('taxonomy-changed', loadTaxonomy);

  storage.on('ready', function() {
    var posts = cache.posts();
    posts.forEach(function(post, index) {
      post.related = findRelated(index, posts);
    });

    eventEmitter.emit('ready');
  });

  storage.on('post-error', function(e) {
    log('ERR', 'post: ' + chalk.grey(e.name));
    if(e instanceof storage.ValidationException) {
      e.errors.forEach(function(error) {
        console.log('\n    ' + chalk.red(error.message) + '\n');
      });
    } else if(e instanceof storage.ParseException) {
      console.log('\n    ' + chalk.red(e.message) + '\n');
    }
  });

  cache.on('post-added', function(post) {
    log('ADD', 'post: ' + chalk.grey(post.name));
  });
  cache.on('post-changed', function(post) {
    log('UPD', 'post: ' + chalk.grey(post.name));
  });
  cache.on('post-removed', function(post) {
    log('REM', 'post: ' + chalk.grey(post.name));
  });
  cache.on('taxonomy-added', function(taxonomy) {
    log('ADD', 'taxonomy: ' + chalk.grey(taxonomy.name));
  });
  cache.on('taxonomy-changed', function(taxonomy) {
    log('UPD', 'taxonomy: ' + chalk.grey(taxonomy.name));
  });
  cache.on('taxonomy-removed', function(taxonomy) {
    log('REM', 'taxonomy: ' + chalk.grey(taxonomy.name));
  });

  return {
    run: function() {
      storage.listen();
    },

    load: loadPost,

    findRelated: findRelated,

    on: function(event, fn) {
      eventEmitter.on(event, fn);
    }
  };
}

exports = module.exports = loaderService;
