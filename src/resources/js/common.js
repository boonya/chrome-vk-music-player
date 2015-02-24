/**
 *
 */
$(function() {
  var Vk = new VkApi();
  var UI = new UserInterface();
  var Player = new PlayerApi();

  Player.setWrapper('#tracks-wrapper')
    .setPlayBtn('#play-btn')
    .setPrevBtn('#prev-btn')
    .setNextBtn('#next-btn')
    .setIndividualPlayBtnSelector('#tracks-wrapper .play-btn')
    .setProgressbar('footer .progressbar')
    .setPointer('footer .progressbar .pointer')
    .setPreloader('footer .progressbar .preloader');

  var lockPlayer = UI.showLoginScreen;

  var unlockPlayer = function() {
    UI.hideLoginScreen();
    Vk.call('audio.get')
      .then(function(data) {
        UI.showTracks('#tracks-wrapper', data)
          .then(Player.setTracks);
      });
  };

  Vk.getCredentials().then(unlockPlayer).catch(lockPlayer);

  $('#login-btn').click(function() {
    Vk.auth().then(unlockPlayer).catch(lockPlayer);
  });

  $('#close-app').click(function() {
    window.close();
  });

  chrome.commands.onCommand.addListener(function(command) {
      switch (command) {
        case 'play-pause':
          Player.playTrack();
          break;
        case 'previous-track':
          Player.prevTrack();
          break;
        case 'next-track':
          Player.nextTrack();
          break;
        default:
          throw new Error('Unknown command: ' + command);
          break;
      }
  });
});
