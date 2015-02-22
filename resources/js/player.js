/**
 * Deferred object.
 */
var Deferred = function() {
  var resolved, callbacks = [], errbacks = [], _this = this;

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

  _this.than = function (callback) {
    if ('function' != typeof callback) return _this.promise();
    callbacks.push(callback);
    return _this.promise();
  };

  _this.catch = function (errback) {
    if ('function' != typeof errback) return _this.promise();
    errbacks.push(errback);
    return _this.promise();
  };

  _this.promise = function () {
    return {
      than: _this.than,
      catch: _this.catch
    }
  };

  return {
    resolve: _this.resolve,
    reject: _this.reject,
    promise: _this.promise
  };
};

/**
 * Vkontakte API.
 */
var Vk = function() {
  var credentials, _this = this;

  (function () {
    credentials = {};
    chrome.storage.local.get('credentials', function(result) {
      if (result.credentials.access_token) {
        credentials = result.credentials;
      }
    });
  })();

  /**
   * Returns credentials data.
   *
   * @return object {'access_token': str, 'expires_in': int, 'user_id': int}
   */
  _this.getCredentials = function() {
    return credentials;
  };


  /**
   * Saves credentials data.
   *
   * @param object values {'access_token': str, 'expires_in': int, 'user_id': int}
   */
  _this.setCredentials = function(values) {
    chrome.storage.local.set({'credentials': values});
    credentials = values;
  };

  /**
   * Trying to authenticate user.
   *
   * @return Deferred
   */
  _this.auth = function() {
    var d = new Deferred(),
        url = 'https://oauth.vk.com/authorize'
            + '?client_id=' + vk_config.app_id
            + '&scope=audio'
            + '&redirect_uri=' + chrome.identity.getRedirectURL('')
            + '&display=page'
            + '&v=' + vk_config.api_version
            + '&response_type=token';

    chrome.identity.launchWebAuthFlow({
      'url': url,
      'interactive': true
    }, function(responseUrl) {
      var values = {};
      var pairs = responseUrl.split('#')[1].split(/&/);

      pairs.forEach(function(pair) {
        var nameval = pair.split(/=/);
        if (0 > ['access_token', 'expires_in', 'user_id'].indexOf(nameval[0])) return;
        values[nameval[0]] = nameval[1];
      });

      if (values['access_token']) {
        _this.setCredentials(values);
        d.resolve(values);
      } else {
        d.reject(values);
      }
    });

    return d.promise();
  };

  /**
   * Calls API method.
   *
   * @param   string    method
   * @param   object    data (Not implemented)
   * @return  Deferred
   */
  _this.call = function(method, data) {
    var d = new Deferred(), xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function() {
      var data;
      if (this.readyState !== 4) return;
      if (this.status == 200) {
        data = JSON.parse(this.response);
      }

      if (data && data.response) {
        d.resolve(data.response);
      } else {
        data = data || {error: {}};
        data.error = data.error || {error_msg: 'Response is invalid.'};
        d.reject(data.error);
      }
    };
    xhr.open("GET",
      "https://api.vk.com/method/" + method
      + "?access_token=" + credentials.access_token
      + "&v=" + vk_config.api_version,
      true
    );
    xhr.send();

    return d.promise();
  };

  return {
    getCredentials: _this.getCredentials,
    auth: _this.auth,
    call: _this.call
  };
}();

/**
 * UI controller.
 */
var UI = function() {
  var _this = this;

  _this.showLogin = function() {
    document.getElementById("login-layout").style.display = 'block';
    document.getElementById("work-layout").style.display = 'none';
  };

  _this.hideLogin = function() {
    document.getElementById("login-layout").style.display = 'none';
    document.getElementById("work-layout").style.display = 'block';
  };

  return {
    showLogin: _this.showLogin,
    hideLogin: _this.hideLogin
  };
}();

/**
 *
 */
window.onload = function() {
  document.getElementById("title").innerHTML = chrome.i18n.getMessage("name");

  if (!Vk.getCredentials()['access_token']) {
    UI.showLogin();
  } else {
    UI.hideLogin();
  }

  document.getElementById("login-btn").onclick = function() {
    Vk.auth().than(UI.hideLogin);
  };

  document.getElementById("try-btn").onclick = function() {
    Vk.call("audio.get")
      .than(function(data) {
        console.log("method callback: ", data);
      })
      .catch(function (data) {
        console.log("method errback: ", data);
      });
  }

  document.getElementById("close-window").onclick = function() {
    window.close();
  }
}
