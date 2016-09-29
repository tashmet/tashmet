var chalk = require('chalk');

/**
 * @module reporter
 * @requires log
 * @requires socket
 * @requires content
 * @requires rest
 *
 * @description
 * Provides a reporter which logs events from all event-emitting tashmetu
 * services to the console.
 *
 * @listens document-added
 * @listens document-changed
 * @listens document-removed
 * @listens content-requested
 * @listens content-sent
 * @listens content-error
 * @listens config-changed
 * @listens client-connected
 * @listens client-disconnected
 * @listens item-requested
 * @listens item-sent
 * @listens collection-requested
 * @listens collection-sent
 */
exports = module.exports = function(log, socket, content, rest, database) {
  function processError(type, err) {
    log('ERR', type + ': ' + chalk.grey(err.options.query.id));
    console.log();
    var pastCurrent = false;
    var output = '';
    err.pipeline.steps().forEach(function(step) {
      if(step === err.step) {
        step = chalk.red(step);
        pastCurrent = true;
      } else if(!pastCurrent) {
        step = chalk.green(step);
      } else {
        step = chalk.grey(step);
      }
      output = output + ' -> ' + step;
    });
    console.log(output);
    console.log('\n    ' + chalk.red(err) + '\n');
  }

  function resourceError(type, err) {
    log('ERR', type + ': ' + chalk.grey(err.query.id));
    console.log('\n    ' + chalk.red(err) + '\n');
  }

  function collectionError(name, err) {
    switch(err.name) {
      case 'ProcessError':
        processError(name, err);
        break;
      case 'ResourceError':
        resourceError(name, err);
        break;
    }
  }

  var collections = database.collections();

  function monitorCollection(name, collection) {
    collection.on('document-added', function(obj) {
      log('ADD', 'to: ' + chalk.grey(name) +  ' document: ' + chalk.grey(obj.__id));
    });
    collection.on('document-changed', function(obj) {
      log('UPD', 'in: ' + chalk.grey(name) +  ' document: ' + chalk.grey(obj.__id));
    });
    collection.on('document-removed', function(obj) {
      log('UPD', 'from: ' + chalk.grey(name) +  ' document: ' + chalk.grey(obj.__id));
    });
    collection.on('document-error', function(err) {
      collectionError(name, err);
    });
  }

  for(var name in collections) {
    monitorCollection(name, collections[name]);
  }
  content.on('content-requested', function(req) {
    log('GET', 'url: ' + chalk.grey(req.url));
  });

  content.on('content-sent', function(path) {
    log('SEND', 'file: ' + chalk.grey(path));
  });
  content.on('content-error', function(path) {
    log('ERR', 'file: ' + chalk.grey(path));
  });

  socket.on('client-connected', function(socket) {
    log('INFO', 'Client connected: ' + chalk.grey(socket.id));
  });
  socket.on('client-disconnected', function(socket) {
    log('INFO', 'Client disconnected: ' + chalk.grey(socket.id));
  });

  rest.on('item-requested', function(req) {
    log('GET', 'rest endpoint: ' + chalk.grey(req.url));
  });
  rest.on('item-sent', function(item) {
    log('SEND', '1 item');
  });
  rest.on('collection-requested', function(req) {
    log('GET', 'rest endpoint: ' + chalk.grey(req.url));
  });
  rest.on('collection-sent', function(items) {
    log('SEND', items.length + ' items');
  });
};
