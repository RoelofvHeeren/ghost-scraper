/**
 * Ghost GPS v10.33 - Main World Script (The Phantom)
 * 
 * NEW in v10.33 - DUAL FIX:
 * 1. HIDE EXTENSION: Anti-detection patches to hide from Incognia's tamper detection
 * 2. ALLOW INCOGNIA: Whitelist pf.incognia.com so fraud detection can connect
 * 
 * The Problem:
 * - Incognia detects browser extensions (including our GPS spoofer)
 * - Incognia's fraud check (pf.incognia.com) fails with ERR_TUNNEL_CONNECTION_FAILED
 * 
 * The Solution:
 * - Remove all extension fingerprints (navigator.webdriver, chrome.runtime, etc.)
 * - Don't intercept Incognia's fraud detection requests
 * - Let Incognia think everything is normal while we spoof GPS
 */
(function () {
    try {
        if (!window || !window.navigator) return;
    } catch (e) { return; }

    const APP_VERSION = "v10.33";
    const spoofStore = new WeakMap();

    // =========================================================================
    // ANTI-DETECTION PATCHES (NEW IN v10.33)
    // =========================================================================

    console.log('👻 [Ghost GPS v10.33] Initializing Phantom Mode...');

    // 1. Remove navigator.webdriver (automation detection)
    try {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
            configurable: true
        });
    } catch (e) { }

    // 2. Hide chrome.runtime (extension detection)
    try {
        if (window.chrome && window.chrome.runtime) {
            const originalRuntime = window.chrome.runtime;
            delete window.chrome.runtime;
            // Keep only essential properties
            Object.defineProperty(window.chrome, 'runtime', {
                get: () => undefined,
                configurable: true
            });
        }
    } catch (e) { }

    // 3. Add realistic navigator.plugins
    try {
        const pluginsArray = [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: 'Portable Document Format' },
            { name: 'Native Client', filename: 'internal-nacl-plugin', description: 'Native Client Executable' }
        ];
        Object.defineProperty(navigator, 'plugins', {
            get: () => pluginsArray,
            configurable: true
        });
    } catch (e) { }

    // 4. Fix navigator.languages
    try {
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en'],
            configurable: true
        });
    } catch (e) { }

    // 5. Remove chrome.app and chrome.csi (extension indicators)
    try {
        if (window.chrome) {
            if (window.chrome.app) delete window.chrome.app;
            if (window.chrome.csi) delete window.chrome.csi;
        }
    } catch (e) { }

    // 6. Patch permissions API (extensions have different permissions)
    try {
        const originalQuery = navigator.permissions.query;
        navigator.permissions.query = function (parameters) {
            return originalQuery.call(this, parameters).then(result => {
                // Don't reveal extension permissions
                if (parameters.name === 'notifications') {
                    return { state: 'prompt', onchange: null };
                }
                return result;
            });
        };
    } catch (e) { }

    console.log('🛡️ [Ghost GPS v10.33] Phantom Mode Active - Extension Hidden');

    // -------------------------------------------------------------------------
    // 1. SETTINGS
    // -------------------------------------------------------------------------
    const NAUTILUS_LAT = 25.821702;
    const NAUTILUS_LNG = -80.135205;

    const getCoords = () => {
        const jitter = () => (Math.random() - 0.5) * 0.000020;
        return { lat: NAUTILUS_LAT + jitter(), lng: NAUTILUS_LNG + jitter() };
    };

    const makeNative = (fn, name) => {
        try {
            const value = `function ${name || fn.name || 'native'}() { [native code] }`;
            Object.defineProperty(fn, 'toString', { value: () => value, configurable: true, writable: true });
        } catch (e) { }
        return fn;
    };

    // -------------------------------------------------------------------------
    // 2. REWRITE ENGINE (ENHANCED)
    // -------------------------------------------------------------------------
    const rewrite = (text, url = '') => {
        if (!text || typeof text !== 'string') return text;
        if (text.length > 50000) return text;

        let mod = text;
        let modified = false;

        // Catch "Flagler" mentions
        if (mod.match(/Flagler/i)) {
            console.log(`👻 [Ghost GPS] CAUGHT "Flagler" in: ${url}`);
            mod = mod.replace(/6\s*W(est)?\s*Flagler\s*(St(reet)?)?/gi, "4554 Nautilus Drive");
            mod = mod.replace(/Flagler\s*St(reet)?/gi, "Nautilus Drive");
            mod = mod.replace(/("city"\s*:\s*)"Miami"/gi, `$1"Miami Beach"`);
            mod = mod.replace(/("zip"\s*:\s*)"\d+"/gi, `$1"33140"`);
            mod = mod.replace(/25\.77\d+/g, NAUTILUS_LAT);
            mod = mod.replace(/-80\.19\d+/g, NAUTILUS_LNG);
            modified = true;
        }

        // Catch coordinate-only responses (no street name but has Flagler coords)
        if (mod.match(/25\.773\d+/) || mod.match(/-80\.193\d+/)) {
            console.log(`👻 [Ghost GPS] CAUGHT Flagler COORDINATES in: ${url}`);
            mod = mod.replace(/25\.773\d+/g, NAUTILUS_LAT);
            mod = mod.replace(/-80\.193\d+/g, NAUTILUS_LNG);
            modified = true;
        }

        // Force rewrite for reverse geocode responses
        if (url.toLowerCase().includes('reverse') && mod.includes('"Miami"')) {
            mod = mod.replace(/"street"\s*:\s*".*?"/gi, `"street":"Nautilus Drive"`);
            mod = mod.replace(/"street_number"\s*:\s*".*?"/gi, `"street_number":"4554"`);
            mod = mod.replace(/"route"\s*:\s*".*?"/gi, `"route":"Nautilus Drive"`);
            mod = mod.replace(/"streetAddress"\s*:\s*".*?"/gi, `"streetAddress":"4554 Nautilus Drive"`);
            mod = mod.replace(/"formattedStreet"\s*:\s*".*?"/gi, `"formattedStreet":"4554 Nautilus Drive"`);
            mod = mod.replace(/"city"\s*:\s*"Miami"/gi, `"city":"Miami Beach"`);
            mod = mod.replace(/"postalCode"\s*:\s*"\d+"/gi, `"postalCode":"33140"`);
            modified = true;
        }

        if (modified) console.log(`👻 [Ghost GPS] REWROTE Response!`);
        return mod;
    };

    // -------------------------------------------------------------------------
    // 3. XHR PROXY
    // -------------------------------------------------------------------------
    try {
        const OriginalXHR = window.XMLHttpRequest;
        const XHRProxy = new Proxy(OriginalXHR, {
            construct(target, args) {
                const xhr = new target(...args);
                let _url = '';
                return new Proxy(xhr, {
                    get(target, prop, receiver) {
                        if (prop === 'responseText' || prop === 'response') {
                            if (target.readyState === 4) {
                                const stored = spoofStore.get(target);
                                if (stored && stored.body) return stored.body;
                                try {
                                    const type = target.responseType;
                                    if (!type || type === 'text' || type === 'json') {
                                        const txt = Reflect.get(target, 'responseText');
                                        const mod = rewrite(txt, _url);
                                        if (mod !== txt) {
                                            spoofStore.set(target, { body: mod });
                                            return mod;
                                        }
                                    }
                                } catch (e) { }
                            }
                            return Reflect.get(target, prop);
                        }
                        if (prop === 'open') {
                            return makeNative(function (method, url) {
                                _url = String(url);
                                if (url.match(/nextdoor|google/)) console.log(`👻 [XHR] ${_url}`);
                                return target.open.apply(target, arguments);
                            }, 'open');
                        }
                        const value = Reflect.get(target, prop);
                        if (typeof value === 'function') return value.bind(target);
                        return value;
                    },
                    set(target, prop, value) { return Reflect.set(target, prop, value); }
                });
            }
        });
        makeNative(XHRProxy, 'XMLHttpRequest');
        Object.defineProperty(XHRProxy, 'name', { value: 'XMLHttpRequest' });
        window.XMLHttpRequest = XHRProxy;
    } catch (e) { }

    // -------------------------------------------------------------------------
    // 4. FETCH PROXY (GRAPHQL HUNTER)
    // -------------------------------------------------------------------------
    try {
        const originalFetch = window.fetch;
        window.fetch = async function (...args) {
            let url = '';
            if (typeof args[0] === 'string') url = args[0];
            else if (args[0] instanceof Request) url = args[0].url;

            const urlLower = url.toLowerCase();

            // BLACKLIST: Don't intercept Incognia fraud detection (NEW IN v10.33)
            // This allows Incognia's fraud check to connect through the proxy
            if (urlLower.includes('incognia.com') ||
                urlLower.includes('pf.incognia') ||
                urlLower.includes('datadog') ||  // Also allow analytics
                urlLower.includes('google-analytics') ||
                urlLower.includes('gtm.js')) {
                // Pass through without interception
                return originalFetch.apply(window, args);
            }

            // EXPANDED WHITELIST - Case insensitive matching
            const isTarget = (
                urlLower.includes('geocode') ||  // Catches reverseGeocodeQuery
                urlLower.includes('address') ||  // Catches addressAutocompleteQuery & getUserAddressQuery
                urlLower.includes('place') ||
                urlLower.includes('search') ||
                urlLower.includes('validate') ||
                urlLower.includes('account') ||
                urlLower.includes('verify') ||
                urlLower.includes('location') ||
                urlLower.includes('reverse') ||  // NEW: Explicit for reverseGeocodeQuery
                urlLower.includes('getuser') ||  // NEW: Explicit for getUserAddressQuery
                urlLower.includes('google.com/maps')
            );

            if (isTarget) {
                console.log(`👻 [FETCH HUNTER] Intercepting: ${url}`);
                try {
                    const response = await originalFetch.apply(window, args);
                    const contentType = response.headers.get('content-type');
                    if (contentType && (contentType.includes('application/json') || contentType.includes('text/'))) {
                        const cloned = response.clone();
                        let text = await cloned.text();
                        const mod = rewrite(text, url);
                        if (mod !== text) {
                            return new Response(mod, {
                                status: response.status,
                                statusText: response.statusText,
                                headers: response.headers
                            });
                        }
                    }
                    return response;
                } catch (e) {
                    return originalFetch.apply(window, args);
                }
            } else {
                return originalFetch.apply(window, args);
            }
        };
        makeNative(window.fetch, 'fetch');
        console.log(`👻 [Ghost GPS ${APP_VERSION}] GraphQL Hunter Active.`);
    } catch (e) { }

    // -------------------------------------------------------------------------
    // 5. IDENTITY & GEO
    // -------------------------------------------------------------------------
    try {
        if (navigator.geolocation) {
            const createPosition = () => {
                const { lat, lng } = getCoords();
                return {
                    coords: {
                        latitude: lat,
                        longitude: lng,
                        accuracy: 20,
                        altitude: 0,
                        heading: 0,
                        speed: 0
                    },
                    timestamp: Date.now()
                };
            };
            const mockGeo = {
                getCurrentPosition: (s, e, o) => { if (s) s(createPosition()); },
                watchPosition: (s, e, o) => { if (s) { s(createPosition()); return 1; } },
                clearWatch: () => { }
            };
            try { Object.defineProperty(navigator.constructor.prototype, 'geolocation', { value: mockGeo, configurable: true }); } catch (e) { }
            try { Object.defineProperty(navigator, 'geolocation', { value: mockGeo, configurable: true }); } catch (z) { }
        }
    } catch (e) { }
})();
