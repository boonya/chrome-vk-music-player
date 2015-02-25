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
            'track.artist': track.artist,
            'track.title': track.title,
            'track.url': track.url
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
      if (undefined == data[name]) return '';
      return data[name];
    });
  };

  return {
    showLoginScreen: _this.showLoginScreen,
    hideLoginScreen: _this.hideLoginScreen,
    showTracks: _this.showTracks,
    setPreloader: _this.setPreloader,
    setTimePointer: _this.setTimePointer,
    setPlayingStatus: _this.setPlayingStatus
  };
};
