const newsSites = [
    "ynet.co.il", "mako.co.il", "walla.co.il", "haaretz.co.il", 
    "israelhayom.co.il", "maariv.co.il", "themarker.com", "calcalist.co.il", 
    "kan.org.il", "jpost.com", "globes.co.il"
];

const MAX_HIGHLIGHTS = 2; 

const MANIPULATION_TYPES = [
    "שימוש בשפה רגשית (Emotional Language)",
    "חוסר בהקשר (Missing Context)",
    "כותרת מטעה (Clickbait)",
    "הטיות פוליטיות (Political Bias)"
];

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
        // עדכון התוכן
        typeEl.textContent = manipulationType;
        descEl.textContent = `"${textContext.substring(0, 120)}..."`;
        
        // הוספת הקלאס שמחליק את הסרגל פנימה
        sidebar.classList.add('open');
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('clarify-ai-sidebar');
    if (sidebar) sidebar.classList.remove('open');
}

// --- חלק 2: הלוגיקה של המירקור ---

function highlightRandomText() {
    let currentHighlights = document.querySelectorAll('[data-processed="true"]').length;
    
    if (currentHighlights >= MAX_HIGHLIGHTS) return;

    const paragraphs = Array.from(document.querySelectorAll('p, div.article-body span'));
    if (paragraphs.length === 0) return;

    for (const p of paragraphs) {
        if (currentHighlights >= MAX_HIGHLIGHTS) break;
        if (p.getAttribute("data-processed") === "true") continue;
        if (p.offsetParent === null) continue;

        if (Math.random() > 0.5 && p.innerText.length > 70) {
            
            p.setAttribute("data-processed", "true");
            const randomType = MANIPULATION_TYPES[Math.floor(Math.random() * MANIPULATION_TYPES.length)];

            p.style.backgroundColor = "rgba(144, 238, 144, 0.6)"; 
            p.style.borderBottom = "2px solid green"; 
            p.style.cursor = "pointer";
            p.title = "לחץ להסבר AI";
            
            // לחיצה פותחת את הסרגל
            p.onclick = function(e) {
                e.preventDefault(); 
                e.stopPropagation();
                openSidebar(randomType, p.innerText);
            };

            currentHighlights++;
        }
    }
}

// הפעלה ראשית
chrome.storage.local.get(['isEnabled'], function(result) {
    if (result.isEnabled && isNewsSite()) {
        injectSidebar(); // הכנת הסרגל (עדיין מוסתר)
        highlightRandomText();

        window.addEventListener('load', () => {
             setTimeout(highlightRandomText, 1500); 
        });
    }
});