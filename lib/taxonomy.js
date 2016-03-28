var fs        = require('fs');
var yaml      = require('js-yaml');

function loadTaxonomy(name) {
  var path = './content/taxonomies/' + name + '.yml';
  return yaml.safeLoad(fs.readFileSync(path, 'utf8'));
}

module.exports = {
  load: loadTaxonomy
}
