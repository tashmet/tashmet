var Taxonomy = require('../../common/taxonomy');
var util     = require('../../common/util');
var events   = require('events');


function TaxonomyService(remote, cache) {
  var collection = cache.collection(remote.collection('taxonomies'));

  Taxonomy.call(this, collection, new events.EventEmitter());
}

util.inherits(TaxonomyService, Taxonomy);

exports = module.exports = TaxonomyService;
