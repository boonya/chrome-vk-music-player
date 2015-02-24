/**
 *
 */
var PlayerApi = function() {
  var _this = this,
      tracks = [],
      current = 0,
      wrapper,
      individualPlayBtnSelector,
      preloader,
      pointer,
      progressbar;

  _this.setWrapper = function(selector) {
    wrapper = $(selector);
    return _this;
  };

  _this.setTracks = function() {
    tracks = wrapper.find('audio');
    _this.setIndividualPlayBtns();
    return _this;
  };

  _this.setPlayBtn = function(selector) {
    $(selector).click(function() {_this.playTrack()});
    return _this;
  };

  _this.setPrevBtn = function(selector) {
    $(selector).click(_this.prevTrack);
    return _this;
  };

  _this.setNextBtn = function(selector) {
    $(selector).click(_this.nextTrack);
    return _this;
  };

  _this.setIndividualPlayBtnSelector = function(selector) {
    individualPlayBtnSelector = selector;
    return _this;
  };

  _this.setPointer = function(selector) {
    pointer = $(selector);
    return _this;
  };

  _this.setPreloader = function(selector) {
    preloader = $(selector);
    return _this;
  };

  _this.setProgressbar = function(selector) {
    progressbar = $(selector);
    return _this;
  };

  _this.setIndividualPlayBtns = function() {
    $(individualPlayBtnSelector).each(function(index, btn) {
      $(btn).click(function() {
        var index = $(this).data('index');
        _this.playTrack(index);
      });
    });
    return _this;
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

    audio.addEventListener('ended', function(e) {
      console.log(e.type + 'event: ', e);
      _this.nextTrack();
    });

    audio.addEventListener('timeupdate', function() {
      var percentage = Math.round(this.currentTime/this.duration*100);
      pointer.css('left', percentage + '%');
    });

    audio.addEventListener('canplay', function(e) {
      console.log(e.type + 'event: ', e);
    });

    audio.addEventListener('canplaythrough', function(e) {
      console.log(e.type + 'event: ', e);
    });

    audio.addEventListener('error', function(e) {
      console.log(e.type + 'event: ', e);
    });

    audio.addEventListener('progress', function() {
      if (!this.buffered.length) return;
      try {
        var percentage = Math.round(this.buffered.end(.9)/this.duration*100);
        preloader.css('width', percentage + '%');
        console.log(this.duration, ' - ', this.buffered.end(.9), ' - ', percentage);
      } catch (e) {
        console.log('buffered catched... ', e);
      };
    });

    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
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
    setWrapper: _this.setWrapper,
    setTracks: _this.setTracks,
    setPlayBtn: _this.setPlayBtn,
    setPrevBtn: _this.setPrevBtn,
    setNextBtn: _this.setNextBtn,
    setIndividualPlayBtnSelector: _this.setIndividualPlayBtnSelector,
    setPointer: _this.setPointer,
    setPreloader: _this.setPreloader,
    setProgressbar: _this.setProgressbar,
    playTrack: _this.playTrack,
    prevTrack: _this.prevTrack,
    nextTrack: _this.nextTrack
  };
};
