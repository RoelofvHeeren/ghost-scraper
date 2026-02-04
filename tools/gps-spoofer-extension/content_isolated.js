/**
 * Ghost GPS v7.0 - Isolated World Script
 * 
 * Fetches settings from storage and bridges them to the Main World 
 * via DOM attributes as early as possible.
 */
(function () {
    chrome.storage.local.get(['spoof_lat', 'spoof_lng', 'spoof_enabled'], (res) => {
        const enabled = res.spoof_enabled !== false;

        // Even if disabled, we set the flag so the Main world knows
        const root = document.documentElement;
        if (!root) return;

        root.setAttribute('data-ghost-active', enabled);
        if (enabled) {
            root.setAttribute('data-ghost-lat', res.spoof_lat || 25.821702);
            root.setAttribute('data-ghost-lng', res.spoof_lng || -80.135205);
        }
    });
})();
