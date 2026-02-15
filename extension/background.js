const newsSites = [
    "ynet.co.il", "mako.co.il", "walla.co.il", "haaretz.co.il", 
    "israelhayom.co.il", "maariv.co.il", "themarker.com", "calcalist.co.il", 
    "kan.org.il", "jpost.com", "globes.co.il"
];

function isNewsSite(url) {
    if (!url) return false;
    try {
        const hostname = new URL(url).hostname;
        return newsSites.some(site => hostname.includes(site));
    } catch (e) {
        return false;
    }
}

// עדכון האייקון בעת טעינת דף
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        checkAndActivate(tabId, tab.url);
    }
});

function checkAndActivate(tabId, url) {
    chrome.storage.local.get(['isEnabled'], function(result) {
        if (result.isEnabled && isNewsSite(url)) {
            chrome.action.setBadgeText({text: "ON", tabId: tabId});
            chrome.action.setBadgeBackgroundColor({color: "green", tabId: tabId});
        } else {
            chrome.action.setBadgeText({text: "", tabId: tabId});
        }
    });
}

// קבלת הודעה מה-Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateState") {
        console.log("Status updated via Popup:", request.isEnabled);
        sendResponse({status: "received"});
        
        // ריענון הטאב הנוכחי כדי להחיל שינויים
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0] && tabs[0].id && isNewsSite(tabs[0].url)) {
                chrome.tabs.reload(tabs[0].id);
            }
        });
    }
});