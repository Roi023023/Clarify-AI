const newsSites = [
    "ynet.co.il", "mako.co.il", "walla.co.il", "haaretz.co.il", 
    "israelhayom.co.il", "maariv.co.il", "themarker.com", "calcalist.co.il", 
    "kan.org.il", "jpost.com", "globes.co.il"
];

const MAX_HIGHLIGHTS = 2; // הגדרה קבועה לכמות המירקורים

function isNewsSite() {
    return newsSites.some(site => window.location.href.includes(site));
}

function highlightRandomText() {
    // בדיקה מקדימה: כמה כבר מירקרנו בדף הזה?
    let currentHighlights = document.querySelectorAll('[data-processed="true"]').length;
    
    // אם כבר הגענו למכסה של 2, אל תעשה כלום
    if (currentHighlights >= MAX_HIGHLIGHTS) {
        console.log("ClarifyAi: Max highlights reached (" + currentHighlights + "). Stopping.");
        return;
    }

    const paragraphs = document.querySelectorAll('p, div.article-body span');
    
    if (paragraphs.length === 0) return;

    // המרה למערך כדי שנוכל לערבב אותו (אופציונלי, כדי שה-2 לא יהיו תמיד הראשונים)
    const paragraphsArray = Array.from(paragraphs);
    
    // לולאה שרצה על הפסקאות
    for (const p of paragraphsArray) {
        
        // בדיקת עצירה: אם הגענו ל-2, שבור את הלולאה וסיים
        if (currentHighlights >= MAX_HIGHLIGHTS) break;

        // דילוג על פסקאות שכבר טופלו
        if (p.getAttribute("data-processed") === "true") continue;

        // תנאי סינון (אורך טקסט והגרלה)
        // הורדתי את הרף ל-0.5 כדי להגדיל סיכוי שנמצא מספיק פסקאות מהר
        if (Math.random() > 0.5 && p.innerText.length > 70) {
            
            p.setAttribute("data-processed", "true"); // סימון שטופל

            // עיצוב
            p.style.backgroundColor = "rgba(144, 238, 144, 0.6)"; 
            p.style.borderBottom = "2px solid green"; 
            p.style.cursor = "pointer";
            p.title = "לחץ להסבר AI";
            
            p.onclick = function(e) {
                e.preventDefault(); 
                e.stopPropagation();
                alert("זיהוי מניפולציה:\n" + p.innerText.substring(0, 100) + "...");
            };

            // קידום המונה
            currentHighlights++;
        }
    }
    console.log("ClarifyAi: Total highlighted now: " + currentHighlights);
}

// הפעלה ראשית
chrome.storage.local.get(['isEnabled'], function(result) {
    if (result.isEnabled && isNewsSite()) {
        console.log("ClarifyAi: Running scan...");
        
        highlightRandomText();

        window.addEventListener('load', () => {
             // בודק שוב בטעינה מלאה, אבל הפונקציה עצמה תעצור אם כבר יש 2
             setTimeout(highlightRandomText, 1000); 
        });
    }
});