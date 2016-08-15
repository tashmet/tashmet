exports = module.exports = function(socket) {
  this.collection = function(name, collection) {
    collection.on('ready', function() {
      collection.on('document-added', function(obj) {
        socket.emit('sync-document-added', { collection: name, item: obj});
      });
      collection.on('document-changed', function(obj) {
        socket.emit('sync-document-changed', { collection: name, item: obj});
      });
    });
  };

  return this;
};
