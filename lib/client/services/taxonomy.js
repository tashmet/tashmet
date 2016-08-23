var Taxonomy = require('../../common/taxonomy');
var util     = require('../../common/util');
var events   = require('events');


function TaxonomyService(remote, cache, sync) {
  var remoteCol = remote.collection('taxonomies');

  var collection = cache.collection(remoteCol);

  sync.collection('taxonomies', remoteCol);

  Taxonomy.call(this, collection, new events.EventEmitter());
}

util.inherits(TaxonomyService, Taxonomy);

exports = module.exports = TaxonomyService;
