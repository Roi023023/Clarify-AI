document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('toggleExtension');
    const statusMsg = document.getElementById('statusMsg');

    // 1. טעינת המצב השמור בעת פתיחת החלון
    chrome.storage.local.get(['isEnabled'], function(result) {
        toggle.checked = result.isEnabled || false; // ברירת מחדל: כבוי
        updateStatusText(toggle.checked);
    });

    // 2. שמירת המצב בעת שינוי
    toggle.addEventListener('change', function() {
        const isEnabled = toggle.checked;
        chrome.storage.local.set({isEnabled: isEnabled}, function() {
            updateStatusText(isEnabled);
            // שליחת הודעה ל-background לעדכון מיידי
            chrome.runtime.sendMessage({action: "updateState", isEnabled: isEnabled});
        });
    });

    function updateStatusText(isOn) {
        statusMsg.textContent = isOn ? "המערכת דולקת וסורקת" : "המערכת כבויה";
        statusMsg.style.color = isOn ? "green" : "gray";
    }
});