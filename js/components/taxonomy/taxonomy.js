angular.module('tashmetu.taxonomy', ['ngResource'])

  .service("$stTaxonomy", stTaxonomyService);

function stTaxonomyService($resource) {
  var url = "http://localhost:3001";
  var taxonomyResource = $resource(url + '/taxonomies/:taxonomy');

  return {
    getTerms: function(taxonomy, callback) {
      taxonomyResource.query({taxonomy: taxonomy}, function(terms) {
        callback(terms);
      });
    }
  }
}