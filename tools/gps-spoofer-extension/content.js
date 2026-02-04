/**
 * Ghost GPS Spoofer v4 - Content Script
 * 
 * DESIGN:
 * 1. Read storage (Isolated World).
 * 2. Set attributes on document.documentElement (CSP-safe bridge).
 * 3. Inject main_world.js via src (Allowed by whitelisted extension ID).
 */

(function () {
    chrome.storage.local.get(['spoof_lat', 'spoof_lng', 'spoof_enabled'], (res) => {
        const enabled = res.spoof_enabled !== false;
        if (!enabled) return;

        const lat = res.spoof_lat || 25.821702;
        const lng = res.spoof_lng || -80.135205;

        // Bridge data via DOM attributes (Safe from CSP script-src)
        const root = document.documentElement;
        root.setAttribute('data-ghost-lat', lat);
        root.setAttribute('data-ghost-lng', lng);

        // Inject main_world.js via src (Allowed because extension ID is in Nextdoor's CSP)
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('main_world.js');
        script.onload = () => script.remove();
        (document.head || root).appendChild(script);
    });
})();
