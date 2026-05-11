const newsSites = [
    "ynet.co.il", "mako.co.il", "walla.co.il", "haaretz.co.il",
    "israelhayom.co.il", "maariv.co.il", "themarker.com", "calcalist.co.il",
    "kan.org.il", "jpost.com", "globes.co.il"
];

const SYSTEM_PROMPT = `You are labeling Hebrew news articles for linguistic manipulation.

Use only the article text. Do not use external knowledge. Do not fact-check.
Your task is to extract all clear manipulation patterns from the article.

Allowed labels:
- קפיצה לוגית
- שפה טעונה רגשית
- מקור עמום
- הכללת יתר

Return only valid JSON in this exact shape:
{
  "items": [
    {
      "excerpt": "full sentence copied verbatim from the article",
      "label": "one allowed label",
      "confidence": "medium or high",
      "reason": "short Hebrew explanation"
    }
  ]
}

Rules:
- excerpt must be copied verbatim from the article.
- excerpt must contain at least one full sentence.
- return all matching excerpts, not only one.
- return {"items": []} only when the article truly has no matching excerpts.
- do not default to an empty list when matching excerpts are present.
- do not include markdown.
- do not include explanations outside the JSON.`;

function isNewsSite() {
    return newsSites.some(site => window.location.hostname.includes(site));
}

function buildUserText(content) {
    return SYSTEM_PROMPT + "\n\nArticle:\n" + content;
}

// =============================================================================
// Sidebar
// =============================================================================

function injectSidebar() {
    if (document.getElementById("clarify-ai-sidebar")) return;

    const sidebarHTML = `
        <div id="clarify-ai-sidebar">
            <button id="clarify-ai-close">✕</button>

            <div class="clarify-header">
                <span style="font-size: 32px; display:block; margin-bottom:10px;">🔍</span>
                <h2>Clarify AI</h2>
                <p>ניתוח בזמן אמת</p>
            </div>

            <div class="clarify-content">
                <div class="clarify-card">
                    <div id="clarify-badge" class="clarify-badge">זוהתה מניפולציה</div>
                    <h3 id="clarify-type">סוג המניפולציה</h3>
                    <p id="clarify-desc">הטקסט הבעייתי יופיע כאן...</p>
                </div>

                <div class="clarify-info-box">
                    <strong>למה זה קורה?</strong>
                    <p>מערכת ה-AI מזהה דפוסים שעשויים להעיד על ניסיון להשפיע על דעת הקהל בצורה לא אובייקטיבית.</p>
                </div>
            </div>

            <button class="clarify-action-btn">ניתוח מעמיק (Premium)</button>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", sidebarHTML);

    const style = document.createElement("style");
    style.textContent = `
        #clarify-ai-sidebar {
            position: fixed;
            top: 0;
            right: -350px;
            width: 300px;
            height: 100vh;
            background: #f9f9f9;
            z-index: 2147483647;
            box-shadow: -4px 0 15px rgba(0,0,0,0.1);
            transition: right 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
            padding: 20px;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            border-left: 1px solid #e0e0e0;
            overflow-y: auto;
            direction: rtl;
            text-align: right;
            white-space: normal;
        }

        #clarify-ai-sidebar.open {
            right: 0;
        }

        #clarify-ai-close {
            position: absolute;
            top: 15px;
            left: 15px;
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #888;
            transition: color 0.2s;
        }

        #clarify-ai-close:hover {
            color: #333;
        }

        .clarify-header {
            text-align: center;
            border-bottom: 1px solid #eee;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }

        .clarify-header h2 {
            margin: 0;
            color: #2c3e50;
            font-size: 22px;
        }

        .clarify-header p {
            margin: 5px 0 0;
            color: #7f8c8d;
            font-size: 14px;
        }

        .clarify-card {
            background: white;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            margin-bottom: 20px;
            border: 1px solid #eee;
        }

        .clarify-badge {
            background: #ffebee;
            color: #c62828;
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 10px;
        }

        #clarify-type {
            margin: 0 0 10px;
            font-size: 16px;
            color: #333;
        }

        #clarify-desc {
            margin: 0;
            font-size: 14px;
            color: #555;
            line-height: 1.6;
            white-space: pre-wrap;
        }

        .clarify-info-box {
            background: #e3f2fd;
            border-radius: 8px;
            padding: 15px;
            font-size: 13px;
            color: #0d47a1;
            margin-bottom: 20px;
        }

        .clarify-action-btn {
            background: #2196F3;
            color: white;
            border: none;
            padding: 12px;
            border-radius: 6px;
            width: 100%;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(33, 150, 243, 0.3);
            transition: background 0.2s;
        }

        .clarify-action-btn:hover {
            background: #1976D2;
        }

        .clarify-highlight {
            background-color: rgba(144, 238, 144, 0.6);
            border-bottom: 2px solid green;
            cursor: pointer;
            border-radius: 2px;
            padding: 0 1px;
        }

        .clarify-highlight:hover {
            background-color: rgba(144, 238, 144, 0.9);
        }

        .clarify-inline-badge {
            display: inline-block;
            position: relative;
            margin: 0 4px;
            padding: 2px 7px;
            border-radius: 999px;
            background: #ffebee;
            color: #c62828;
            font-size: 12px;
            font-weight: 700;
            line-height: 1.4;
            cursor: pointer;
            vertical-align: baseline;
            direction: rtl;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .clarify-inline-badge:hover {
            background: #ffcdd2;
        }

        .clarify-inline-badge::after {
            content: attr(data-reason);
            display: none;
            position: absolute;
            top: 125%;
            right: 0;
            width: max-content;
            max-width: 260px;
            background: #263238;
            color: white;
            padding: 8px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 400;
            line-height: 1.5;
            z-index: 2147483647;
            white-space: normal;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        }

        .clarify-inline-badge:hover::after {
            display: block;
        }

        .clarify-loading-pill {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 2147483647;
            background: #263238;
            color: white;
            padding: 8px 12px;
            border-radius: 999px;
            font-size: 13px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            direction: rtl;
        }
    `;

    document.head.appendChild(style);

    document.getElementById("clarify-ai-close").onclick = closeSidebar;
}

function openSidebar(manipulationType, textContext, reason = "", confidence = "") {
    const sidebar = document.getElementById("clarify-ai-sidebar");
    const typeEl = document.getElementById("clarify-type");
    const descEl = document.getElementById("clarify-desc");

    if (sidebar && typeEl && descEl) {
        typeEl.textContent = manipulationType;

        const snippet = textContext.length > 220
            ? textContext.substring(0, 220) + "..."
            : textContext;

        let text = `"${snippet}"`;

        if (reason) {
            text += `\n\nהסבר: ${reason}`;
        }

        if (confidence) {
            text += `\n\nרמת ביטחון: ${confidence}`;
        }

        descEl.textContent = text;
        sidebar.classList.add("open");
    }
}

function closeSidebar() {
    const sidebar = document.getElementById("clarify-ai-sidebar");
    if (sidebar) sidebar.classList.remove("open");
}

function showLoadingPill(text) {
    let pill = document.getElementById("clarify-loading-pill");

    if (!pill) {
        pill = document.createElement("div");
        pill.id = "clarify-loading-pill";
        pill.className = "clarify-loading-pill";
        document.body.appendChild(pill);
    }

    pill.textContent = text;
}

function hideLoadingPill() {
    const pill = document.getElementById("clarify-loading-pill");
    if (pill) pill.remove();
}

// =============================================================================
// Article extraction
// =============================================================================

function extractArticleContent() {
    let paragraphs = Array.from(document.querySelectorAll("article p"));
    if (paragraphs.length === 0) paragraphs = Array.from(document.querySelectorAll("main p"));
    if (paragraphs.length === 0) paragraphs = Array.from(document.querySelectorAll("p"));

    paragraphs = paragraphs.filter(p => {
        const text = p.innerText ? p.innerText.trim() : "";
        return p.offsetParent !== null && text.length > 0;
    });

    const paragraphMap = [];
    const parts = [];
    let cursor = 0;

    for (const p of paragraphs) {
        const text = p.innerText.trim();
        const startIndex = cursor;
        const endIndex = cursor + text.length;

        paragraphMap.push({
            element: p,
            text,
            startIndex,
            endIndex,
        });

        parts.push(text);
        cursor = endIndex + 1;
    }

    const content = parts.join("\n");

    return {
        content,
        paragraphMap,
    };
}

// =============================================================================
// Model response parsing
// =============================================================================

function stripCodeFences(text) {
    return String(text || "")
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();
}

function parseModelJson(text) {
    const cleaned = stripCodeFences(text);

    try {
        return JSON.parse(cleaned);
    } catch (_) {}

    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
        return JSON.parse(match[0]);
    } catch (_) {
        return null;
    }
}

function normalizeForSearch(text) {
    return String(text || "")
        .replace(/\s+/g, " ")
        .trim();
}

function escapeRegExp(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findExcerptSpan(content, excerpt) {
    if (!content || !excerpt) return null;

    const exactStart = content.indexOf(excerpt);
    if (exactStart !== -1) {
        return {
            start: exactStart,
            end: exactStart + excerpt.length,
        };
    }

    const normalizedExcerpt = normalizeForSearch(excerpt);
    if (!normalizedExcerpt) return null;

    const pattern = escapeRegExp(normalizedExcerpt).replace(/\\ /g, "\\s+");

    try {
        const re = new RegExp(pattern);
        const match = content.match(re);

        if (match && typeof match.index === "number") {
            return {
                start: match.index,
                end: match.index + match[0].length,
            };
        }
    } catch (_) {}

    return null;
}

function convertModelItemsToLabels(modelJson, content) {
    const items = modelJson && Array.isArray(modelJson.items)
        ? modelJson.items
        : [];

    const labels = [];

    for (const item of items) {
        if (!item || typeof item !== "object") continue;

        const excerpt = String(item.excerpt || "").trim();
        const label = String(item.label || "").trim();
        const confidence = String(item.confidence || "").trim();
        const reason = String(item.reason || "").trim();

        if (!excerpt || !label) continue;

        const span = findExcerptSpan(content, excerpt);

        if (!span) {
            console.warn("ClarifyAI: could not find excerpt in article content", item);
            continue;
        }

        labels.push({
            span_start_index: span.start,
            span_end_index: span.end,
            Label: label,
            label,
            excerpt,
            confidence,
            reason,
        });
    }

    return labels;
}

async function sendToModel(url, content) {
    try {
        console.log("ClarifyAI: sending article to background worker");

        const generatedText = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                {
                    type: "CLARIFY_ANALYZE",
                    url,
                    content: buildUserText(content),
                },
                response => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }

                    if (!response || !response.ok) {
                        reject(new Error(response && response.error ? response.error : "Unknown model error"));
                        return;
                    }

                    resolve(response.text);
                }
            );
        });

        console.log("ClarifyAI: received model response from background worker", generatedText);

        const parsed = parseModelJson(generatedText);

        if (!parsed || !Array.isArray(parsed.items)) {
            console.warn("ClarifyAI: could not parse model JSON", generatedText);
            return [];
        }

        return convertModelItemsToLabels(parsed, content);
    } catch (err) {
        console.warn("ClarifyAI: failed to reach model API via background worker", err);
        return [];
    }
}

// =============================================================================
// Highlighting
// =============================================================================

function wrapRangeInParagraph(paragraphEl, localStart, localEnd, labelObj) {
    const labelText = labelObj.Label || labelObj.label || "";
    const reason = labelObj.reason || "";
    const confidence = labelObj.confidence || "";

    const walker = document.createTreeWalker(paragraphEl, NodeFilter.SHOW_TEXT, null);

    let offset = 0;
    let startNode = null;
    let startNodeOffset = 0;
    let endNode = null;
    let endNodeOffset = 0;
    let node;

    while ((node = walker.nextNode())) {
        const nodeLen = node.nodeValue.length;
        const nodeStart = offset;
        const nodeEnd = offset + nodeLen;

        if (startNode === null && localStart >= nodeStart && localStart <= nodeEnd) {
            startNode = node;
            startNodeOffset = localStart - nodeStart;
        }

        if (localEnd >= nodeStart && localEnd <= nodeEnd) {
            endNode = node;
            endNodeOffset = localEnd - nodeStart;
            break;
        }

        offset = nodeEnd;
    }

    if (!startNode || !endNode) return;

    const range = document.createRange();

    try {
        range.setStart(startNode, startNodeOffset);
        range.setEnd(endNode, endNodeOffset);
    } catch (e) {
        console.warn("ClarifyAI: invalid range for label", labelObj, e);
        return;
    }

    const wrapper = document.createElement("span");
    wrapper.className = "clarify-highlight";
    wrapper.dataset.label = labelText;
    wrapper.dataset.reason = reason;
    wrapper.dataset.confidence = confidence;
    wrapper.title = reason ? `${labelText}: ${reason}` : labelText;

    const textContent = range.toString();

    wrapper.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();

        openSidebar(
            labelText,
            textContent,
            wrapper.dataset.reason || "",
            wrapper.dataset.confidence || ""
        );
    };

    try {
        const contents = range.extractContents();
        wrapper.appendChild(contents);
        range.insertNode(wrapper);

        const badge = document.createElement("span");
        badge.className = "clarify-inline-badge";

        const confidenceText = confidence ? ` · ${confidence}` : "";
        badge.textContent = ` ${labelText}${confidenceText}`;

        badge.dataset.reason = reason || "אין הסבר זמין";
        badge.title = reason ? `${labelText}: ${reason}` : labelText;

        badge.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();

            openSidebar(
                labelText,
                textContent,
                reason,
                confidence
            );
        };

        wrapper.insertAdjacentElement("afterend", badge);
    } catch (e) {
        console.warn("ClarifyAI: could not wrap range for label", labelObj, e);
    }
}

function applyLabelHighlights(labels, paragraphMap) {
    if (!Array.isArray(labels) || labels.length === 0) return;

    const sorted = [...labels].sort((a, b) => {
        return b.span_start_index - a.span_start_index;
    });

    for (const label of sorted) {
        const start = label.span_start_index;
        const end = label.span_end_index;

        if (typeof start !== "number" || typeof end !== "number" || end <= start) {
            continue;
        }

        const paragraph = paragraphMap.find(p => {
            return start >= p.startIndex && end <= p.endIndex;
        });

        if (!paragraph) {
            console.warn("ClarifyAI: label span crosses paragraph boundaries, skipping", label);
            continue;
        }

        const localStart = start - paragraph.startIndex;
        const localEnd = end - paragraph.startIndex;

        wrapRangeInParagraph(paragraph.element, localStart, localEnd, label);
    }
}

// =============================================================================
// Main
// =============================================================================

async function analyzeArticle() {
    const { content, paragraphMap } = extractArticleContent();

    if (!content || content.length < 50) return;

    injectSidebar();

    showLoadingPill("Clarify AI מנתח את הכתבה...");

    const labels = await sendToModel(window.location.href, content);

    hideLoadingPill();

    applyLabelHighlights(labels, paragraphMap);

    if (labels.length > 0) {
        console.log("ClarifyAI: labels applied", labels);
    } else {
        console.log("ClarifyAI: no labels found");
    }
}

chrome.storage.local.get(["isEnabled"], function(result) {
    if (result.isEnabled && isNewsSite()) {
        if (document.readyState === "complete") {
            analyzeArticle();
        } else {
            window.addEventListener("load", () => setTimeout(analyzeArticle, 1500));
        }
    }
});