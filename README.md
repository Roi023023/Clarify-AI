# 🔍 ClarifyAI - Manipulation Detection in News Articles

**ClarifyAI** is an artificial intelligence-based Chrome Extension, developed as a final project in Deep Learning Path on colman university.
The system analyzes news articles in real time, identifies linguistic manipulations and patterns of influence on the reader, and highlights them directly on the news article.

---

## Project Goal

Unlike classic fact-checking solutions that deal only with fact verification, **ClarifyAI** focuses on **stylistic and rhetorical manipulations**.
The system identifies attempts at bias, the use of loaded language, logical leaps, and ambiguous statements designed to influence the reader's mind – regardless of the verification of the facts themselves.

---

## System Architecture

The system is built from three main components:

- **Content Script (`content.js`)**:
- Automatically identifies entry to leading news sites (Ynet, Mako, Walla, Haaretz, Israel Hayom and more).
- Extracts the article paragraphs using selectors adapted to each site.
- Highlights manipulative paragraphs on the page and presents a detailed analysis sidebar.

- **Background Service Worker (`background.js`)**:
- Connects the browser extension to the college's Inference server via SSL-VPN.
- Supports multi-fallback for backup models when necessary.

- **Inference Backend & AI Model**:
- The main model: **`gemma-4-2b-it`** which has undergone dedicated training (Fine-Tuning) to identify and classify manipulations in Hebrew text.
- Powered by the Run:AI infrastructure on the college's servers (with the vLLM / bitsandbytes driver).
---

## Manipulation Categories

המודל מאומן לזהות ולהסביר את הקטגוריות הבאות:

| קטגוריה | תיאור | דוגמה |
|---|---|---|
| **קפיצה לוגית** (*Logical Leap*) | הסקת מסקנה שאינה נובעת מנתוני הבסיס המוצגים | *"מכיוון שהקצין ביקר בבופור, מדובר בנקודת מפנה בהיסטוריה"* |
| **שפה טעונה רגשית** (*Emotional Language*) | שימוש במילים דרמטיות/מעוררות רגש במטרה להטות | *"אסון נוראי", "אדמה נפיצה", "החלטה גאונית"* |
| **מקור עמום** (*Vague Source*) | ייחוס טענות לגורמים שאינם מוגדרים או ניתנים לאימות | *"גורמים בכירים מסרו", "הפרשנים טוענים"* |
| **הכללת יתר** (*Overgeneralization*) | השלכה ממקרה פרטי על הכלל או קביעת קביעות גורפות | *"עם דור כזה אף אחד לא יוכל עלינו"* |

---

## Installation & Setup
### 1. Installing the browser extension
2. Add the API key in openrouter on the extension (Ask Roi).
3. Open the page: `chrome://extensions/` in the Chrome browser
4. Enable Developer mode (**Developer mode**) in the top corner.
5. Click **Load unpacked** and select the `Clarify-AI/extension` folder.

### 2. Connecting to the college network (Inference Access)
In order for the main model to respond, you must connect to the college's **SSL VPN**. 

---

## 👥 Project Team

* **רואי נחום** (Roi Nahum)
* **עמית זרחיה** (Amit Zerahia)
* **נועה דוד** (Noa David)
* **לינוי אברהמי** (Linoy Avrahami)

**מנחה הפרויקט:** משה בוטמן (Moshe Butman)

