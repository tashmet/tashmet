exports = module.exports = function() {
  factories = {};
  types = {};

  return {
    handle: function(name, factory) {
      factories[name] = factory;
    },
    define: function(name, type) {
      types[name] = type;
    },
    process: function(post, done) {
      types[post.type].process(post, done);
    },
    compare: function(a, b) {
      var type = a.type === b.type ? a.type : false;
      if(type) {
        return types[type].compare(a, b);
      } else {
        return 0;
      }
    },
    schema: function(type) {
      return types[type] ? types[type].schema : null;
    }
  };
};

exports['@singleton'] = true;
