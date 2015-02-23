var launch = function() {
    chrome.app.window.create("miniplayer.html", {
        frame: "none",
        id: "miniplayer",
        innerBounds: {
            width: 280,
            height: 400
        }
    });
}

chrome.app.runtime.onLaunched.addListener(launch);
