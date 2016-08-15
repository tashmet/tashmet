exports = module.exports = function(socket) {
  var collections = {};

  socket.on('sync-document-added', function(ev) {
    if(collections[ev.name]) {
      collections[ev.name].emit('document-added', ev.item);
    }
  });
  socket.on('sync-document-changed', function(ev) {
    if(collections[ev.collection]) {
      collections[ev.collection].emit('document-changed', ev.item);
    }
  });

  this.collection = function(name, collection) {
    collections[name] = collection;
  };
};
