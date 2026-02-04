const enabledEl = document.getElementById('enabled');
const stateText = document.getElementById('state-text');
const latEl = document.getElementById('lat');
const lngEl = document.getElementById('lng');
const saveBtn = document.getElementById('save');
const resetBtn = document.getElementById('reset-session');
const status = document.getElementById('status');

function updateUI(isEnabled) {
    stateText.textContent = isEnabled ? 'ACTIVE' : 'OFF';
    stateText.style.color = isEnabled ? '#44bb44' : '#888';
}

saveBtn.addEventListener('click', async () => {
    const lat = parseFloat(latEl.value);
    const lng = parseFloat(lngEl.value);
    const enabled = enabledEl.checked;

    await chrome.storage.local.set({
        spoof_lat: lat,
        spoof_lng: lng,
        spoof_enabled: enabled
    });

    updateUI(enabled);
    status.textContent = 'Settings Saved! Reload targets.';
    setTimeout(() => { status.textContent = ''; }, 2500);
});

resetBtn.addEventListener('click', async () => {
    status.textContent = 'Wiping Nextdoor session...';

    // Clear cookies for nextdoor domains
    const domains = ['nextdoor.com', '.nextdoor.com'];
    for (const d of domains) {
        const cookies = await chrome.cookies.getAll({ domain: d });
        for (const c of cookies) {
            await chrome.cookies.remove({
                url: `https://${c.domain.startsWith('.') ? c.domain.substring(1) : c.domain}${c.path}`,
                name: c.name
            });
        }
    }

    // Clear everything else using browsingData
    await chrome.browsingData.remove({
        "origins": ["https://nextdoor.com"]
    }, {
        "cache": true,
        "cookies": true,
        "localStorage": true,
        "indexedDB": true
    });

    status.textContent = 'Session Wiped! Refresh Nextdoor now.';
    setTimeout(() => { status.textContent = ''; }, 3500);
});

enabledEl.addEventListener('change', () => {
    updateUI(enabledEl.checked);
});

// Load existing values
chrome.storage.local.get(['spoof_lat', 'spoof_lng', 'spoof_enabled'], (res) => {
    if (res.spoof_lat) latEl.value = res.spoof_lat;
    if (res.spoof_lng) lngEl.value = res.spoof_lng;
    if (res.spoof_enabled !== undefined) {
        enabledEl.checked = res.spoof_enabled;
        updateUI(res.spoof_enabled);
    }
});
