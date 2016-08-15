var Author = require('../../common/author.js');
var events = require('events');
var util   = require('util');


function AuthorService(rest, storage, cache, yaml, validator, socket, pipe) {
  var schema = require('../../../schema/author.json');

  function validate(author, options, cb) {
    validator.check(author, schema, function(err) {
      cb(err, author);
    });
  }

  var inputPipe = new pipe.Pipeline()
    .step('parse yaml', function(data, options, cb) {
      yaml.parse(data, cb);
    })
    .step('validate', validate);

  var outputPipe = new pipe.Pipeline()
    .step('validate', validate)
    .step('serialize yaml', function(author, options, cb) {
      yaml.serialize(obj, cb);
    });

  var collection = cache.collection(storage.directory('authors', {
    extension: 'yml',
    input: inputPipe,
    output: outputPipe
  }));

  rest.collection('authors', collection);

  Author.call(this, collection, new events.EventEmitter());

  socket.forward(this, [
    'author-added',
    'author-changed',
    'author-removed'
  ]);

  collection.sync();
}

util.inherits(AuthorService, Author);

/**
 * @module author
 * @requires rest
 * @requires storage
 * @requires cache
 * @requires yaml
 * @requires validator
 * @requires socket
 * @requires pipeline
 *
 * @description
 * This service is responsible for loading authors from the storage into the
 * cache. It also provides the routes necessary for a basic author api.
 */
exports = module.exports = function(
  rest, storage, cache, yaml, validator, socket, pipe)
{
  return new AuthorService(
    rest, storage, cache, yaml, validator, socket, pipe);
};
