/**
 * UI controller.
 */
var UserInterface = function() {
  var _this = this,
      templates = {};

  _this.showLoginScreen = function() {
    $("#login-layout").show();
  };

  _this.hideLoginScreen = function() {
    $("#login-layout").hide();
  };

  _this.showTracks = function(selector, items) {
    var tracks = [],
        wrapper = $(selector),
        d = new Deferred();

    _this.getTemplate('resources/html/song-row.html')
      .then(function(src) {
        items.forEach(function(track, index) {
          var tpl = _this.compileTemplate(src, {
            'index': index,
            'track': track,
            'track.artist': track.artist,
            'track.title': track.title,
            'track.url': track.url,
            'track.duration': _this.formatTime(track.duration)
          });
          tracks.push(tpl);
        });
        wrapper.html(tracks.join(''));
        d.resolve();
    });

    return d.promise();
  };

  _this.setPreloader = function(selector, value) {
    $(selector).css('width', value + '%');
  };

  _this.setTimePointer = function(selector, value) {
    $(selector).css('left', value + '%');
  };

  _this.setPlayingStatus = function(status, index) {
    var btnSet = $('#tracks-wrapper .play-btn');
    var globalBtn = $('#play-btn');
    var button = $(btnSet[index]);

    switch (status) {
      case 'play':
        btnSet
          .removeClass('glyphicon-pause')
          .addClass('glyphicon-play');

        globalBtn
          .removeClass('glyphicon-play')
          .addClass('glyphicon-pause');

        button
          .removeClass('glyphicon-play')
          .addClass('glyphicon-pause');
        break;
      case 'pause':
        globalBtn
          .removeClass('glyphicon-pause')
          .addClass('glyphicon-play');

        button
          .removeClass('glyphicon-pause')
          .addClass('glyphicon-play');
        break;
    }

    return _this;
  };

  _this.setCurrentTrack = function(index) {
    var btnSet = $('#tracks-wrapper .track');
    var button = $(btnSet[index]);
    btnSet.removeClass('active');
    button.addClass('active');
  };

  _this.formatTime = function(input) {
    var seconds,
        minutes,
        hours,
        array = [],
        format;

    format = function(int) {
      var string = int.toString();
      if (string.length < 2) {
        return '0' + string;
      }
      return string;
    }

    minutes = Math.floor(input/60);
    seconds = Math.floor(input-minutes*60);

    if (minutes > 59) {
      hours = Math.floor(minutes/60);
      minutes = Math.floor(minutes-hours*60);
      array.push(hours);
    }

    if (hours || minutes) {
      if (hours) array.push(format(minutes));
      else array.push(minutes);
    }

    if (minutes) array.push(format(seconds));
    else array.push(seconds);

    return array.join(':');
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

  _this.compileTemplate = function(src, data) {
    return src.replace(/\{{2}([^\{\}\s]+)\}{2}/gi, function(str, name) {
      if (undefined == data[name]) return name;
      return data[name];
    });
  };

  return {
    showLoginScreen: _this.showLoginScreen,
    hideLoginScreen: _this.hideLoginScreen,
    showTracks: _this.showTracks,
    setPreloader: _this.setPreloader,
    setTimePointer: _this.setTimePointer,
    setPlayingStatus: _this.setPlayingStatus,
    setCurrentTrack: _this.setCurrentTrack
  };
};
