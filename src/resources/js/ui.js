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

  _this.showTracks = function(wrapper_selector, data) {
    var tracks = [],
        wrapper = $(wrapper_selector),
        d = new Deferred();

    _this.getTemplate('resources/html/song-row.html')
      .then(function(src) {
        data.items.forEach(function(track, index) {
          var tpl = _this.compileTemplate(src, {
            'index': index,
            'track.artist': track.artist,
            'track.title': track.title,
            'track.url': track.url
          });
          tracks.push(tpl);
        });
        wrapper.html(tracks.join(""));
        d.resolve();
    });

    return d.promise();
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
    showTracks: _this.showTracks
  };
};
