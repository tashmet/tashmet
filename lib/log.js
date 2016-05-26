var chalk = require('chalk');
var log   = require('fancy-log');
var _     = require('lodash');

module.exports = function(type, msg) {
  var padded = _.padEnd(type, 4);
  var color;
  switch(type) {
    case 'ADD':
    case 'UPD':
    case 'REM':
    case 'SEND':
      color = chalk.green;
      break;
    case 'ERR':
      color = chalk.red;
      break;
    default:
      color = chalk.cyan;
      break;
  }
  log('[ ' + color(padded) + ' ] ' + msg);
}
