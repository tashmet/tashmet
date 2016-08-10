exports = module.exports = function() {
  var index = {};
  var list = [];

  function indexOf(params) {
    var string = JSON.stringify(params);
    if(string in index) {
      return index[string];
    } else {
      return -1;
    }
  }

  this.get = function(params) {
    var i = indexOf(params);
    if(i < 0) {
      return null;
    } else {
      return list[i];
    }
  };

  this.put = function(params, obj) {
    var i = indexOf(params);
    if(i > 0) {
      list[i] = obj;
      return false;
    } else {
      index[JSON.stringify(params)] = list.length;
      list.push(obj);
    }
  };

  this.list = function() {
    return list;
  };
};
