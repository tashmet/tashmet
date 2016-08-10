exports = module.exports = function() {
  var index = {};
  var list = [];

  function indexOf(params) {
    var hash = hashOf(params);
    if(hash in index) {
      return index[hash];
    } else {
      return -1;
    }
  }

  function hashOf(params) {
    return JSON.stringify(params);
  }

  this.get = function(params) {
    var i = indexOf(params);
    if(i < 0) {
      return null;
    } else {
      return list[i];
    }
  };

  this.put = function(obj) {
    var i = indexOf(obj.__params);
    if(i >= 0) {
      list[i] = obj;
      return false;
    } else {
      index[hashOf(obj.__params)] = list.length;
      list.push(obj);
    }
  };

  this.remove = function(params) {
    var i = indexOf(params);
    if(i >= 0) {
      delete index[hashOf(params)];
      list.splice(i, 1);
      return true;
    } else {
      return false;
    }
  };

  this.list = function() {
    return list;
  };
};
