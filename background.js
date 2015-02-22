var launch = function() {
    chrome.app.window.create("miniplayer.html", {
        frame: "none",
        id: "miniplayer",
        innerBounds: {
            width: 280,
            height: 400
        }
    });
    chrome.commands.onCommand.addListener(function(command) {
        console.log('Command:', command);
        // "next-track"
        // "play-pause"
        // "previous-track"
        // "stop"
    });
}

chrome.app.runtime.onLaunched.addListener(launch);
