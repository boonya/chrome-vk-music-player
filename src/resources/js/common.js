/**
 *
 */
$(function() {
  var Vk = new VkApi();
  var Player = new PlayerApi();
  var UI = new UserInterface();

  var unlockPlayer = function() {
    UI.hideLoginScreen();

    Vk.call('audio.get')
      .then(function(data) {
        Player.setTracks(data.items);
        UI.showTracks('#tracks-wrapper', data.items)
          .then(function() {
            $('#tracks-wrapper .play-btn').click(function() {
              Player.play($(this).data('index'));
            });
          });
      });
  };

  Vk.isAuth()
    .then(unlockPlayer)
    .catch(UI.showLoginScreen);

  $('#login-btn').click(function() {
    Vk.auth().then(unlockPlayer).catch(lockPlayer);
  });

  $('#close-app').click(function() {
    window.close();
  });

  Player.onEvent('ended', Player.next);

  Player.onEvent('pause', function(index, track, e) {
    UI.setPlayingStatus('pause', index);
  });

  Player.onEvent('play', function(index, track, e) {
    UI.setPlayingStatus('play', index);
    UI.setCurrentTrack(index);
  });

  Player.onEvent('progress', function() {
    UI.setPreloader('.progressbar .preloader', Player.getLoadProgress());
  });

  Player.onEvent('timeupdate', function() {
    UI.setTimePointer('.progressbar .pointer', Player.getPlayProgress());
  });

  $('#play-btn').click(Player.play);
  $('#prev-btn').click(Player.prev);
  $('#next-btn').click(Player.next);

  $('#title').text(chrome.i18n.getMessage('name'));
  $('#login-btn').text(chrome.i18n.getMessage('sign_in'));

  chrome.commands.onCommand.addListener(function(command) {
      switch (command) {
        case 'play-pause':
          Player.play();
          break;
        case 'previous-track':
          Player.prev();
          break;
        case 'next-track':
          Player.next();
          break;
        default:
          throw new Error('Unknown command: ' + command);
          break;
      }
  });
});
