var chalk  = require('chalk');
var join   = require('path').join;
var log    = require('./log');
var system = require('./system');

function existsSync(path) {
  try {
    fs.accessSync(path, fs.F_OK);
    return true;
  } catch(e) {
    return false;
  }
}

exports = module.exports = function(id) {
  var delegate = id;
  if(system.delegates[id]) {
    delegate = system.delegates[id];
  }
  if(!system.silent) {
    if(delegate === id) {
      log('LOAD', 'module: ' + chalk.grey(delegate));
    } else {
      log('LOAD', 'module: ' + chalk.grey(id) + ' -> ' + chalk.grey(delegate));
    }
  }
  if(delegate.indexOf('.') > 0) {
    var service = delegate.substr(delegate.indexOf('.')+1);
    var module  = delegate.substr(0, delegate.indexOf('.'));

    if(system.components[module]) {
      return system.components[module].services[service];
    } else {
      return;
    }
  } else {
    path = join(process.cwd(), 'node_modules', delegate);
    if(existsSync(path)) {
      return system.load(path);
    } else {
      return system.load(delegate);
    }
  }
};
