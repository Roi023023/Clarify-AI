console.log("ClarifyAI background: service worker started");

const newsSites = [
    "ynet.co.il", "mako.co.il", "walla.co.il", "haaretz.co.il",
    "israelhayom.co.il", "maariv.co.il", "themarker.com", "calcalist.co.il",
    "kan.org.il", "jpost.com", "globes.co.il"
];

// Trained model — gemma-4-2b-it on university server (requires VPN)
const MODEL_API_URL =
    "https://gemma-4-2b-it-518-runai-model-120b.cs.colman.ac.il/v1/chat/completions";

// Direct IP fallback (same server, in case DNS doesn't resolve over VPN)
const MODEL_API_URL_IP =
    "https://10.10.248.21/v1/chat/completions";

const MODEL_NAME = "gemma-4-2b-it";

// OpenRouter fallback configuration
const OPENROUTER_API_KEY = "";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODELS = [
    "deepseek/deepseek-r1",
    "deepseek/deepseek-r1:free",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "meta-llama/llama-3.3-70b-instruct:free"
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

async function callModelAPI(apiUrl, modelName, content, headers = {}) {
    const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
        body: JSON.stringify({
            model: modelName,
            messages: [
                {
                    role: "user",
                    content,
                },
            ],
            temperature: 0,
            max_tokens: 8192,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`API returned ${response.status}: ${errorText}`);
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

    return generatedText;
}

async function analyzeWithModel(content) {
    // Try the trained model on university server (hostname)
    try {
        console.log("ClarifyAI: trying university server (hostname)...");
        const result = await callModelAPI(MODEL_API_URL, MODEL_NAME, content);
        console.log("ClarifyAI: university server responded ✅");
        console.log("ClarifyAI Response: " + result);
        return result;
    } catch (primaryError) {
        console.warn("ClarifyAI: university server (hostname) failed:", primaryError.message);
    }

    // Try the trained model via direct IP (in case DNS doesn't resolve)
    try {
        console.log("ClarifyAI: trying university server (direct IP)...");
        const result = await callModelAPI(MODEL_API_URL_IP, MODEL_NAME, content);
        console.log("ClarifyAI: university server (IP) responded ✅");
        console.log("ClarifyAI Response: " + result);
        return result;
    } catch (ipError) {
        console.warn("ClarifyAI: university server (IP) failed:", ipError.message);
    }

    // Fallback to OpenRouter API
    let lastError = null;

    for (const model of OPENROUTER_MODELS) {
        try {
            console.log("ClarifyAI: trying OpenRouter model:", model);
            const result = await callModelAPI(OPENROUTER_API_URL, model, content, {
                "Authorization": "Bearer " + OPENROUTER_API_KEY,
                "HTTP-Referer": "https://clarify-ai.extension",
                "X-Title": "ClarifyAI"
            });

            console.log("ClarifyAI: OpenRouter model", model, "responded ✅");
            console.log("ClarifyAI Response: " + result);
            return result;
        } catch (err) {
            console.warn("ClarifyAI: OpenRouter model", model, "failed:", err.message);
            lastError = err;
        }
    }

    throw new Error("All servers failed. Last error: " + (lastError ? lastError.message : "unknown"));
}