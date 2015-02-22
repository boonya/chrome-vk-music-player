var credentials = {};

var auth = {
  do: function() {
    var self = this;
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
      var pairs = responseUrl.split('#')[1].split(/&/);

      pairs.forEach(function(pair) {
        var nameval = pair.split(/=/);
        credentials[nameval[0]] = nameval[1];
      });

      // chrome.storage.local['credentials'] = credentials;
      chrome.storage.local.set({'credentials': credentials});
      self.hide();
    });
  },
  show: function() {
    document.getElementById("login-layout").style.display = 'block';
    document.getElementById("work-layout").style.display = 'none';
  },
  hide: function() {
    document.getElementById("login-layout").style.display = 'none';
    document.getElementById("work-layout").style.display = 'block';
  }
};

var method = function(method, data, callback, errback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    var data;
    if (this.readyState !== 4) return;
    if (this.status == 200) {
      data = JSON.parse(this.response);
    }

    if (!data || !data.response) {
      var data = data || {error:''};
      data.error = data.error || {error_msg:'Response is invalid.'};

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

window.onload = function() {
  document.getElementById("title").innerHTML = chrome.i18n.getMessage("name");

  chrome.storage.onChanged.addListener(function(changes, namespace) {
    var credentials, access_token;
    if ('local' != namespace) return;

    console.log('changes: ', changes);

    credentials = changes['credentials']['newValue'] || {};
    access_token = credentials['access_token'] || null;

    if (!access_token) {
      auth.show();
    } else {
      auth.hide();
    }
  });

  chrome.storage.local.get(function(data) {
    if (!data.credentials.access_token) {
      auth.show();
    } else {
      credentials = data.credentials;
      auth.hide();
    }
  });

  document.getElementById("login-btn").onclick = function() {
    auth.do();
  };

  document.getElementById("try-btn").onclick = function() {
    method("audio.get", {}, function(data) {
      console.log("method callback: ", data);
    }, function(data) {
      console.log("method errback: ", data);
    });
  }

  document.getElementById("close-window").onclick = function() {
    window.close();
  }
}
