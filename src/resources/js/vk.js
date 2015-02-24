/**
 * Vkontakte API.
 */
var VkApi = function() {
  var _this = this,
      credentials = {};

  /**
   * Returns credentials data.
   *
   * @return Promise with object {'access_token': str,
   *                              'expires_in': int,
   *                              'user_id': int}
   */
  _this.getCredentials = function() {
    var d = new Deferred();

    if (credentials['access_token']) {
      d.resolve(credentials);
      return d.promise();
    }

    chrome.storage.local.get('credentials', function(result) {
      if (result['credentials']
          && result['credentials']['access_token']) {
        credentials = result.credentials;
        d.resolve(credentials);
      } else {
        d.reject(new Error('Credentials don\'t exist.'));
      }
    });

    return d.promise();
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
   * @return Promise
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
   * @return  Promise
   */
  _this.call = function(method, data) {
    var d = new Deferred(),
        xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function() {
      var data;
      if (this.readyState !== 4) return;
      if (this.status == 200) {
        data = JSON.parse(this.response);
      }

      if (data && data['response']) {
        d.resolve(data.response);
        console.log("VkApi method callback: ", data);
      } else {
        data = data || {error: {}};
        data['error'] = data['error'] || {error_msg: 'Response is invalid.'};
        d.reject(data.error);
        console.log("VkApi method errback: ", data);
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
};
