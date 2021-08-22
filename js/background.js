var contextMenus = {};

contextMenus.downloadVideo =
    chrome.contextMenus.create(
        {
            "title": "video downloader",
            "contexts": ["all"]
        },
        function () {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
            }
        }
    );

chrome.contextMenus.onClicked.addListener(contextMenuHandler);

function contextMenuHandler(info, tab) {
    if (info.menuItemId === contextMenus.downloadVideo && tab.url.startsWith("https://puzzle-movies.com")) {
        chrome.tabs.executeScript({
            file: 'js/puzzle-movie/puzzle-movie.js'
        });
    }
    else {
        alert("This site is not supported");
    }
}