const newsSites = [
    "ynet.co.il", "mako.co.il", "walla.co.il", "haaretz.co.il",
    "israelhayom.co.il", "maariv.co.il", "themarker.com", "calcalist.co.il",
    "kan.org.il", "jpost.com", "globes.co.il"
];

// TODO: להחליף בכתובת האמיתית של שרת המודל כשתהיה
const MODEL_API_URL = "https://example.com/api/analyze";

function isNewsSite() {
    return newsSites.some(site => window.location.hostname.includes(site));
}

// --- חלק 1: יצירת סרגל הצד (Sidebar) ---
function injectSidebar() {
    if (document.getElementById('clarify-ai-sidebar')) return;

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
                    <div class="clarify-badge">זוהתה הטעיה</div>
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

    document.body.insertAdjacentHTML('beforeend', sidebarHTML);

    // הוספת ה-CSS (עיצוב סרגל הצד)
    const style = document.createElement('style');
    style.textContent = `
        /* הגדרות הסרגל עצמו */
        #clarify-ai-sidebar {
            position: fixed;
            top: 0;
            right: -350px; /* מוסתר בהתחלה מחוץ למסך */
            width: 300px;
            height: 100vh; /* גובה מלא */
            background: #f9f9f9;
            z-index: 2147483647; /* הכי גבוה שאפשר כדי להיות מעל הכל */
            box-shadow: -4px 0 15px rgba(0,0,0,0.1);
            transition: right 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); /* אנימציית החלקה */
            padding: 20px;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            border-left: 1px solid #e0e0e0;
            overflow-y: auto;
            direction: rtl; /* תמיכה בעברית */
            text-align: right;
        }

        /* מחלקה שתפעיל את הסרגל */
        #clarify-ai-sidebar.open {
            right: 0; /* החלקה פנימה */
        }

        /* כפתור סגירה */
        #clarify-ai-close {
            position: absolute; top: 15px; left: 15px;
            background: none; border: none; font-size: 20px;
            cursor: pointer; color: #888; transition: color 0.2s;
        }
        #clarify-ai-close:hover { color: #333; }

        /* עיצוב פנימי */
        .clarify-header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px; }
        .clarify-header h2 { margin: 0; color: #2c3e50; font-size: 22px; }
        .clarify-header p { margin: 5px 0 0; color: #7f8c8d; font-size: 14px; }

        .clarify-card {
            background: white; border-radius: 8px; padding: 15px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 20px;
            border: 1px solid #eee;
        }

        .clarify-badge {
            background: #ffebee; color: #c62828; display: inline-block;
            padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold;
            margin-bottom: 10px;
        }

        #clarify-type { margin: 0 0 10px; font-size: 16px; color: #333; }
        #clarify-desc { margin: 0; font-size: 14px; color: #555; line-height: 1.5; }

        .clarify-info-box {
            background: #e3f2fd; border-radius: 8px; padding: 15px;
            font-size: 13px; color: #0d47a1; margin-bottom: 20px;
        }

        .clarify-action-btn {
            background: #2196F3; color: white; border: none; padding: 12px;
            border-radius: 6px; width: 100%; font-weight: bold; cursor: pointer;
            box-shadow: 0 4px 6px rgba(33, 150, 243, 0.3); transition: background 0.2s;
        }
        .clarify-action-btn:hover { background: #1976D2; }
    `;
    document.head.appendChild(style);

    document.getElementById('clarify-ai-close').onclick = closeSidebar;
}

function openSidebar(manipulationType, textContext) {
    const sidebar = document.getElementById('clarify-ai-sidebar');
    const typeEl = document.getElementById('clarify-type');
    const descEl = document.getElementById('clarify-desc');

    if (sidebar && typeEl && descEl) {
        typeEl.textContent = manipulationType;
        const snippet = textContext.length > 120 ? textContext.substring(0, 120) + "..." : textContext;
        descEl.textContent = `"${snippet}"`;
        sidebar.classList.add('open');
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('clarify-ai-sidebar');
    if (sidebar) sidebar.classList.remove('open');
}

// --- חלק 2: חילוץ תוכן הכתבה ושליחה למודל ---

function extractArticleContent() {
    let paragraphs = Array.from(document.querySelectorAll('article p'));
    if (paragraphs.length === 0) paragraphs = Array.from(document.querySelectorAll('main p'));
    if (paragraphs.length === 0) paragraphs = Array.from(document.querySelectorAll('p'));

    paragraphs = paragraphs.filter(p => p.offsetParent !== null && p.innerText.trim().length > 0);

    const paragraphMap = [];
    const parts = [];
    let cursor = 0;

    for (const p of paragraphs) {
        const text = p.innerText;
        const startIndex = cursor;
        const endIndex = cursor + text.length;
        paragraphMap.push({ element: p, text, startIndex, endIndex });
        parts.push(text);
        cursor = endIndex + 1; // +1 עבור ה-"\n" שמפריד בין פסקאות
    }

    const content = parts.join("\n");
    return { content, paragraphMap };
}

async function sendToModel(url, content) {
    try {
        const response = await fetch(MODEL_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, content })
        });
        if (!response.ok) {
            console.warn("ClarifyAI: model API returned non-OK status", response.status);
            return [];
        }
        const data = await response.json();
        return data.labels || [];
    } catch (err) {
        console.warn("ClarifyAI: failed to reach model API", err);
        return [];
    }
}

// עוטף טווח טקסט בתוך אלמנט פסקה ב-<span> מסומן בירוק.
function wrapRangeInParagraph(paragraphEl, localStart, localEnd, label) {
    // חיפוש text node-ים בתוך הפסקה ומיפוי ה-offset המקומי שלהם
    const walker = document.createTreeWalker(paragraphEl, NodeFilter.SHOW_TEXT, null);
    let offset = 0;
    let startNode = null, startNodeOffset = 0;
    let endNode = null, endNodeOffset = 0;
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
        console.warn("ClarifyAI: invalid range for label", label, e);
        return;
    }

    const wrapper = document.createElement('span');
    wrapper.className = 'clarify-highlight';
    wrapper.dataset.label = label;
    wrapper.style.backgroundColor = "rgba(144, 238, 144, 0.6)";
    wrapper.style.borderBottom = "2px solid green";
    wrapper.style.cursor = "pointer";
    wrapper.title = label;

    const textContent = range.toString();
    wrapper.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        openSidebar(label, textContent);
    };

    try {
        range.surroundContents(wrapper);
    } catch (e) {
        // surroundContents נכשל כשהטווח חוצה גבולות אלמנט. במקרה הזה מתעלמים.
        console.warn("ClarifyAI: could not surround range for label", label, e);
    }
}

function applyLabelHighlights(labels, paragraphMap) {
    if (!Array.isArray(labels) || labels.length === 0) return;

    // למיין מהסוף להתחלה כדי שעיטיפת ספאן לא תזיז offset-ים של ספאנים אחרים באותה פסקה
    const sorted = [...labels].sort((a, b) => b.span_start_index - a.span_start_index);

    for (const label of sorted) {
        const start = label.span_start_index;
        const end = label.span_end_index;
        const labelText = label.Label;

        if (typeof start !== 'number' || typeof end !== 'number' || end <= start) continue;

        const paragraph = paragraphMap.find(p => start >= p.startIndex && end <= p.endIndex);
        if (!paragraph) {
            console.warn("ClarifyAI: label span crosses paragraph boundaries, skipping", label);
            continue;
        }

        const localStart = start - paragraph.startIndex;
        const localEnd = end - paragraph.startIndex;
        wrapRangeInParagraph(paragraph.element, localStart, localEnd, labelText);
    }
}

async function analyzeArticle() {
    injectSidebar();
    const { content, paragraphMap } = extractArticleContent();
    if (!content || content.length < 50) return;
    const labels = await sendToModel(window.location.href, content);
    applyLabelHighlights(labels, paragraphMap);
}

// הפעלה ראשית
chrome.storage.local.get(['isEnabled'], function(result) {
    if (result.isEnabled && isNewsSite()) {
        if (document.readyState === 'complete') {
            analyzeArticle();
        } else {
            window.addEventListener('load', () => setTimeout(analyzeArticle, 1500));
        }
    }
});
