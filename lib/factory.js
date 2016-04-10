var util = require('./util.js');
var path = require('path');

var factoriesDir = path.join(process.cwd(), 'tashmetu/factories');

function load(name) {
  return require(path.join(factoriesDir, name + '.js'));
}

function loadAll() {
  var facts = [];
  util.files(factoriesDir).forEach(function(file) {
    var name = file.substr(0, file.lastIndexOf('.'));
    var fact = require(path.join(factoriesDir, file));
    fact.name = name;
    facts.push(fact);
  });
  return facts;
}

module.exports = {
  load: load,
  loadAll: loadAll
}
