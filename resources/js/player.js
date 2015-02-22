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
   * @param callback callback
   * @param callback errback (optional)
   */
  _this.auth = function(callback, errback) {
    var url = 'https://oauth.vk.com/authorize'
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
        callback(values);
      } else if ('function' == typeof errback) {
        errback(values);
      }
    });
  };

  /**
   * Calls API method.
   *
   * @param string    method
   * @param object    data (Not implemented)
   * @param callback  callback
   * @param callback  errback (optional)
   */
  _this.call = function(method, data, callback, errback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      var data;
      if (this.readyState !== 4) return;
      if (this.status == 200) {
        data = JSON.parse(this.response);
      }

      if (!data || !data.response) {
        data = data || {error: {}};
        data.error = data.error || {error_msg: 'Response is invalid.'};

        if ('function' == typeof errback) {
          errback(data.error);
        } else {
          throw new Error(data.error.error_msg);
        }
        return;
      }

      callback(data.response);
    };
    xhr.open("GET",
      "https://api.vk.com/method/" + method
      + "?access_token=" + credentials.access_token
      + "&v=" + vk_config.api_version,
      true
    );
    xhr.send();
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
    Vk.auth(UI.hideLogin);
  };

  document.getElementById("try-btn").onclick = function() {
    Vk.call("audio.get", {}, function(data) {
      console.log("method callback: ", data);
    }, function(data) {
      console.log("method errback: ", data);
    });
  }

  document.getElementById("close-window").onclick = function() {
    window.close();
  }
}
