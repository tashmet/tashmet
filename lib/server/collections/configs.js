var defaults = require('json-schema-defaults');
var _        = require('lodash');

/**
 * Configs collection
 */
exports = module.exports = function(core, storage) {
  return {
    share: function(obj) {
      return core.configs()[obj.__id].shared;
    },
    sync: true,
    done: function(collection) {
      storage.on('ready', function() {
        var defs = core.configs();
        Object.keys(defs).forEach(function(name) {
          var defaultValues = defaults(defs[name].schema);

          if(!collection.isCached(name)) {
            var obj = defaultValues;
            obj.__id = name;
            collection.cache(obj);
          } else {
            collection.get(name, function(err, obj) {
              collection.cache(_.merge({}, defaultValues, obj));
            });
          }
        });
      });
    }
  };
};
