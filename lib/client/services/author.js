var Author   = require('../../common/author');
var util     = require('../../common/util');
var events   = require('events');


function AuthorService(remote, cache, sync) {
  var remoteCol = remote.collection('authors');

  var collection = cache.collection(remoteCol);

  sync.collection('authors', remoteCol);

  Author.call(this, collection, new events.EventEmitter());
}

util.inherits(AuthorService, Author);

exports = module.exports = AuthorService;
