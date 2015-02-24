/**
 * Promise object.
 */
var Promise = function(callbacks, errbacks) {
  var _this = this;

  _this.then = function (callback) {
    if ('function' != typeof callback) return _this;
    callbacks.push(callback);
    return _this;
  };

  _this.catch = function (errback) {
    if ('function' != typeof errback) return _this;
    errbacks.push(errback);
    return _this;
  };

  return {
    then: _this.then,
    catch: _this.catch
  }
};

/**
 * Deferred object.
 */
var Deferred = function() {
  var _this = this,
      resolved = false,
      callbacks = [],
      errbacks = [];

  _this.execute = function (list, args) {
    if (resolved) throw new Error('Deferred object has already been delivered.');

    list.forEach(function(callback) {
      callback.apply(_this, args);
    });

    resolved = true;
  };

  _this.resolve = function () {
    _this.execute(callbacks, arguments);
  };

  _this.reject = function () {
    _this.execute(errbacks, arguments);
  };

  _this.promise = function () {
    return new Promise(callbacks, errbacks);
  };

  return {
    resolve: _this.resolve,
    reject: _this.reject,
    promise: _this.promise
  };
};
