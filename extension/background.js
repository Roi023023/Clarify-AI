const newsSites = [
    "ynet.co.il", "mako.co.il", "walla.co.il", "haaretz.co.il",
    "israelhayom.co.il", "maariv.co.il", "themarker.com", "calcalist.co.il",
    "kan.org.il", "jpost.com", "globes.co.il"
];

const MODEL_API_URL =
    "https://gpt-oss-120b-mxfp4-runai-model-120b.cs.colman.ac.il/v1/chat/completions";

const MODEL_NAME = "gpt-oss-120b";

function isNewsSite(url) {
    if (!url) return false;

    try {
        const hostname = new URL(url).hostname;
        return newsSites.some(site => hostname.includes(site));
    } catch (e) {
        return false;
    }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        checkAndActivate(tabId, tab.url);
    }
});

function checkAndActivate(tabId, url) {
    chrome.storage.local.get(["isEnabled"], function(result) {
        if (result.isEnabled && isNewsSite(url)) {
            chrome.action.setBadgeText({ text: "ON", tabId });
            chrome.action.setBadgeBackgroundColor({ color: "green", tabId });
        } else {
            chrome.action.setBadgeText({ text: "", tabId });
        }
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateState") {
        console.log("ClarifyAI background: status updated via popup", request.isEnabled);

        sendResponse({ status: "received" });

        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0] && tabs[0].id && isNewsSite(tabs[0].url)) {
                chrome.tabs.reload(tabs[0].id);
            }
        });

        return false;
    }

    if (request.type === "CLARIFY_ANALYZE") {
        console.log("ClarifyAI background: received analyze request");

        analyzeWithModel(request.content)
            .then(generatedText => {
                console.log("ClarifyAI background: model response received");

                sendResponse({
                    ok: true,
                    text: generatedText,
                });
            })
            .catch(error => {
                console.warn("ClarifyAI background: model request failed", error);

                sendResponse({
                    ok: false,
                    error: String(error && error.message ? error.message : error),
                });
            });

        return true;
    }

    return false;
});

async function analyzeWithModel(content) {
    const response = await fetch(MODEL_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: MODEL_NAME,
            messages: [
                {
                    role: "user",
                    content,
                },
            ],
            temperature: 0,
            max_tokens: 1924,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`Model API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    const generatedText =
        data &&
        data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content;

    if (!generatedText) {
        throw new Error("Missing generated text in model response");
    }

    console.log('ClarifyAI Response: ' + generatedText)

    return generatedText;
}