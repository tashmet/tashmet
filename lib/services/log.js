var log = require('../log');

exports = module.exports = function() {
  return log;
};

exports['@singleton'] = true;
