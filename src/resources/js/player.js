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
    var d = new Deferred(),
        xhr = new XMLHttpRequest();

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
  var _this = this,
      templates = {};

  (function() {
    document.getElementById("title").innerHTML = chrome.i18n.getMessage("name");
    document.getElementById("login-btn").innerHTML = chrome.i18n.getMessage("sign_in");
  })();

  _this.showLogin = function() {
    document.getElementById("login-layout").style.display = 'block';
  };

  _this.hideLogin = function() {
    document.getElementById("login-layout").style.display = 'none';
  };

  _this.showTracks = function(data) {
    var wrapper = document.getElementById("player-wrapper"),
        tracks = [];

    data.items.forEach(function(track) {
      tracks.push('<div>'
          + '<button class="btn_play">play</button>'
          + '<span class="artist">' + track.artist + '</span>'
          + '<span class="title">' + track.title + '</span>'
          + '<audio>'
          + '<source src="' + track.url + '" type=\'audio/mpeg; codecs="mp3"\'>'
          + '</audio>'
          + '</div>');
    });

    wrapper.innerHTML = tracks.join("");
  };

  /**
   * Returns template.
   *
   * @param  string   name
   * @return Deferred
   */
  _this.getTemplate = function(name) {
    var d = new Deferred(),
        xhr;

    if (templates[name]) {
      d.resolve(templates[name]);
      return d.promise();
    }

    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (this.readyState !== 4) return;
      if (this.status == 200) {
        templates[name] = this.response;
        d.resolve(this.response);
      } else {
        d.reject(new Error('Template "' + name + '" is not exists.'));
      }
    };
    xhr.open("GET", name, true);
    xhr.send();

    return d.promise();
  };

  return {
    showLogin: _this.showLogin,
    hideLogin: _this.hideLogin,
    showTracks: _this.showTracks
  };
};

/**
 *
 */
var Player = function() {
  var _this = this,
      tracks = [],
      current = 0;

  _this.setPlayerWrapper = function(el) {
    tracks = el.getElementsByTagName('audio');
  };

  _this.setPlayBtn = function(el) {
    el.onclick = function() {
      if (!tracks.length) return;

      var audio = tracks[current];

      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    }
  };

  _this.setPrevBtn = function(el) {
    el.onclick = function() {
      if (!tracks.length || 1 > current) return;

      var audio = tracks[current];
      if (!audio.paused) {
        audio.pause();
      }

      current--;

      var audio = tracks[current];
      audio.play();
    }
  };

  _this.setNextBtn = function(el) {
    el.onclick = function() {
      if (!tracks.length || tracks.length - 1 == current) return;

      var audio = tracks[current];
      if (!audio.paused) {
        audio.pause();
      }

      current++;

      var audio = tracks[current];
      audio.play();
    }
  };

  _this.setPlayBtns = function(els) {
    console.log('els: ', els, els.length);
    for (var i = 0; i < els.length; i++) {
      els[i].onclick = function() {
        console.log('individual play buttons onclick: ', this);
      };
    }
  };

  return {
    setPlayerWrapper: _this.setPlayerWrapper,
    setPlayBtn: _this.setPlayBtn,
    setPrevBtn: _this.setPrevBtn,
    setNextBtn: _this.setNextBtn,
    setPlayBtns: _this.setPlayBtns
  };
};

/**
 *
 */
window.onload = function() {
  var ui = new UI();

  var player = new Player();
  player.setPlayBtn(document.getElementById("btn_play"));
  player.setPrevBtn(document.getElementById("btn_prev"));
  player.setNextBtn(document.getElementById("btn_next"));

  var output = document.getElementById("debug-output");

  if (!Vk.getCredentials()['access_token']) {
    ui.showLogin();
  } else {
    ui.hideLogin();
    Vk.call("audio.get")
      .than(function(data) {
        console.log("method callback: ", data);
        ui.showTracks(data);
        player.setPlayerWrapper(document.getElementById("player-wrapper"));
        player.setPlayBtns(document.getElementById("player-wrapper").getElementsByClassName('btn_play'));
        console.log('player: ', player);
      })
      .catch(function (data) {
        console.log("method errback: ", data);
      });
  }

  document.getElementById("login-btn").onclick = function() {
    Vk.auth().than(ui.hideLogin);
  };

  document.getElementById("close-window").onclick = function() {
    window.close();
  }
}
