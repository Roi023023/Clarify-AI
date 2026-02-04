const newsSites = [
    "ynet.co.il", "mako.co.il", "walla.co.il", "haaretz.co.il", 
    "israelhayom.co.il", "maariv.co.il", "themarker.com", "calcalist.co.il", 
    "kan.org.il", "jpost.com", "globes.co.il"
];

function isNewsSite(url) {
    if (!url) return false;
    return newsSites.some(site => url.includes(site));
}

// 1. האזנה לשינויים בטאבים (כדי להציג ON על האייקון)
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

// --- התיקון לשגיאה שלך ---
// 2. האזנה להודעות מה-Popup (או מקומות אחרים)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateState") {
        console.log("Status updated via Popup:", request.isEnabled);
        // כאן אנחנו מחזירים תשובה כדי לסגור את המעגל ולמנוע את השגיאה
        sendResponse({status: "received"});
        
        // אופציונלי: לרענן את הטאב הנוכחי כדי שהשינוי יחול מיד
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0] && isNewsSite(tabs[0].url)) {
                chrome.tabs.reload(tabs[0].id);
            }
        });
    }
});