/**
 * Promise object.
 */
var Promise = function(callbacks, errbacks) {
  var _this = this;

  _this.than = function (callback) {
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
    than: _this.than,
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

/**
 * UI controller.
 */
var UserInterface = function() {
  var _this = this,
      templates = {};

  (function() {
    $('#title').text(chrome.i18n.getMessage('name'));
    $('#login-btn').text(chrome.i18n.getMessage('sign_in'));
  })();

  _this.showLoginScreen = function() {
    $("#login-layout").show();
  };

  _this.hideLoginScreen = function() {
    $("#login-layout").hide();
  };

  _this.showTracks = function(data) {
    var wrapper = document.getElementById("tracks-wrapper"),
        tracks = [];

    data.items.forEach(function(track, index) {
      tracks.push('<div class="track">'
          + '<span class="play-btn bg-Indigo-500 color-white glyphicon glyphicon-play" data-index="' + index + '"></span>'
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
    showLoginScreen: _this.showLoginScreen,
    hideLoginScreen: _this.hideLoginScreen,
    showTracks: _this.showTracks
  };
};

/**
 *
 */
var PlayerApi = function() {
  var _this = this,
      tracks = [],
      current = 0;

  _this.setTracksWrapper = function(el) {
    tracks = el.find('audio');
  };

  _this.setPlayBtn = function(el) {
    el.click(function() {_this.playTrack()});
  };

  _this.setPrevBtn = function(el) {
    el.click(_this.prevTrack);
  };

  _this.setNextBtn = function(el) {
    el.click(_this.nextTrack);
  };

  _this.setIndividualPlayBtns = function(els) {
    els.each(function(index, btn) {
      $(btn).click(function() {
        var index = $(this).data('index');
        _this.playTrack(index);
      });
    });
  };

  _this.playTrack = function(index) {
    var audio;

    console.log('_this.playTrack... ', {'current': current, 'index': index});

    if (!tracks.length) {
      throw new Error('No more tracks.');
    }

    if (index && !tracks[index]) {
      throw new Error('Track does not exist.');
    }

    if (index && index != current) {
      _this.resetAnotherTracks();
      current = index;
    } else {
      _this.resetAnotherTracks(current);
    }

    audio = tracks[current];

    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }

    console.log('audio: ', audio);
    console.log('index: ', current);
    console.log('paused: ', audio.paused);
  };

  _this.resetAnotherTracks = function(index) {
    $(tracks).each(function(i, track) {
      if (i == index) return;
      track.pause();
      track.currentTime = 0;
    });
  };

  _this.prevTrack = function() {
    var audio;
    console.log('_this.prevTrack...', {'current': current});
    if (!tracks.length || 1 > current) return;

    _this.playTrack(current - 1);
  };

  _this.nextTrack = function() {
    var audio;
    console.log('_this.nextTrack...', {'current': current});
    if (!tracks.length || tracks.length - 1 == current) return;

    _this.playTrack(current + 1);
  };

  return {
    setTracksWrapper: _this.setTracksWrapper,
    setPlayBtn: _this.setPlayBtn,
    setPrevBtn: _this.setPrevBtn,
    setNextBtn: _this.setNextBtn,
    setIndividualPlayBtns: _this.setIndividualPlayBtns,
    playTrack: _this.playTrack,
    prevTrack: _this.prevTrack,
    nextTrack: _this.nextTrack
  };
};

/**
 *
 */
$(function() {
  var Vk = new VkApi();
  var UI = new UserInterface();
  var Player = new PlayerApi();

  Player.setPlayBtn($('#play-btn'));
  Player.setPrevBtn($('#prev-btn'));
  Player.setNextBtn($('#next-btn'));

  var lockPlayer = UI.showLoginScreen;

  var unlockPlayer = function() {
    UI.hideLoginScreen();
    Vk.call('audio.get')
      .than(function(data) {
        UI.showTracks(data);
        Player.setTracksWrapper($('#tracks-wrapper'));
        Player.setIndividualPlayBtns($('#tracks-wrapper .play-btn'));
      });
  };

  Vk.getCredentials().than(unlockPlayer).catch(lockPlayer);

  $('#login-btn').click(function() {
    Vk.auth().than(unlockPlayer).catch(lockPlayer);
  });

  $('#close-app').click(window.close);

  chrome.commands.onCommand.addListener(function(command) {
      switch (command) {
        case 'play-pause':
          player.playCurrentTrack();
          break;
        case 'previous-track':
          player.playPrevTrack();
          break;
        case 'next-track':
          player.playNextTrack();
          break;
        default:
          throw new Error('Unknown command: ' + command);
          break;
      }
  });
});
