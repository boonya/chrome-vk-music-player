/**
 *
 */
var PlayerApi = function() {
  var _this = this,
      tracks = [],
      current = 0,
      audio,
      callbacks = [],
      supportedEvents;

  supportedEvents = ['progress', 'timeupdate', 'ended', 'pause', 'play',
    'playing', 'suspend', 'volumechange', 'waiting', 'loadstart', 'error'];

  /**
   *
   *
   * return _this
   */
  _this.setTracks = function(data) {
    tracks = data;
    return _this;
  };

  /**
   * Play or pause track.
   *
   * return _this
   * throws Error when have no tracks.
   * throws Error when passed index for not existing track.
   */
  _this.play = function(index) {
    if (!tracks.length) {
      throw new Error('No more tracks.');
    }

    if (index % 1 === 0) {
      if (tracks[index]) {
        current = index;
      } else {
        throw new Error('Track does not exist.');
      }
    }

    var track = tracks[current];

    if (!audio) {
      audio = document.createElement('audio');

      supportedEvents.forEach(function(event) {
        audio.addEventListener(event, _this.executeCallbacks);
      });
    }

    if (audio.src != track.url) {
      audio.src = track.url;
    }

    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }

    return _this;
  };

  _this.prev = function() {
    _this.play(current-1);
    return _this;
  };

  _this.next = function() {
    _this.play(current+1);
    return _this;
  };

  /**
   * Retruns playing proggress in percents.
   *
   * return integer
   */
  _this.getPlayProgress = function() {
    var percentage = Math.round(audio.currentTime/audio.duration*100);
    if (percentage % 1 !== 0) return 0;
    return percentage;
  };

  /**
   * Retruns loading proggress in percents.
   *
   * return integer
   */
  _this.getLoadProgress = function() {
    var percentage = 0;
    if (!audio.buffered.length) return percentage;
    try {
      percentage = Math.round(audio.buffered.end(.9)/audio.duration*100);
    } catch(e) {};
    if (percentage % 1 !== 0) return 0;
    return percentage;
  };

  /**
   * Retruns duration of current track.
   *
   * return float
   */
  _this.getDuration = function() {
    return audio.duration;
  };

  /**
   * Set callbacks on different events.
   *
   * https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events
   *
   * return _this
   * throws Error when first argument is not supported event type.
   * throws Error when second argument is not a function.
   */
  _this.onEvent = function(eventType, callback) {
    if (supportedEvents.indexOf(eventType) < 0) {
      throw new Error('Passed event type does not support: ' + eventType);
    }

    if ('function' != typeof callback) {
      throw new Error('Argument is not a function: ' + callback);
    }

    callbacks[eventType] = callbacks[eventType] || [];
    callbacks[eventType].push(callback);

    return _this;
  };

  /**
   * Executes all callbacks which have been assigned to the specified event.
   */
  _this.executeCallbacks = function(e) {
    if (!callbacks[e.type]) return;
    callbacks[e.type].forEach(function(callback) {
      callback.apply(_this, [current, tracks[current], e]);
    });
  };

  return {
    setTracks: _this.setTracks,
    play: _this.play,
    prev: _this.prev,
    next: _this.next,
    onEvent: _this.onEvent,
    getPlayProgress: _this.getPlayProgress,
    getLoadProgress: _this.getLoadProgress,
    getDuration: _this.getDuration
  };
};
