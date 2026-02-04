/**
 * Ghost GPS v10.29 - Main World Script (The Fix)
 * 
 * Diagnosis (v10.28):
 * - User reported "Illegal invocation" and content not loading.
 * - Cause: I accidentally removed the `.bind(target)` in the XHR Proxy in v10.27/v10.28.
 *   This caused native methods like `setRequestHeader` to throw errors because they lost their `this` context.
 * 
 * Strategy (v10.29):
 * 1. FIX XHR PROXY: RESTORE the function binding (from v10.25).
 * 2. KEEP SNIPER FETCH: The "Sniper" logic for fetch (v10.28) is likely correct, keeping it.
 * 
 * Goal: Stop the crash, load the content, and finally allow the address rewrite to happen.
 */
(function () {
    try {
        if (!window || !window.navigator) return;
    } catch (e) { return; }

    const APP_VERSION = "v10.29";
    const spoofStore = new WeakMap();

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
    // 2. REWRITE ENGINE
    // -------------------------------------------------------------------------
    const rewrite = (text, url = '') => {
        if (!text || typeof text !== 'string') return text;
        if (text.length > 50000) return text;

        let mod = text;
        let modified = false;

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

        if (url.includes('reverse') && mod.includes('"Miami"')) {
            mod = mod.replace(/"street"\s*:\s*".*?"/gi, `"street":"Nautilus Drive"`);
            mod = mod.replace(/"street_number"\s*:\s*".*?"/gi, `"street_number":"4554"`);
        }

        if (modified) console.log(`👻 [Ghost GPS] REWROTE Response!`);
        return mod;
    };

    // -------------------------------------------------------------------------
    // 3. XHR PROXY (FIXED)
    // -------------------------------------------------------------------------
    try {
        const OriginalXHR = window.XMLHttpRequest;
        const XHRProxy = new Proxy(OriginalXHR, {
            construct(target, args) {
                const xhr = new target(...args);
                let _url = '';
                return new Proxy(xhr, {
                    get(target, prop, receiver) {
                        // TRAP: responseText / response
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

                        // HOOK: open
                        if (prop === 'open') {
                            return makeNative(function (method, url) {
                                _url = String(url);
                                if (url.match(/nextdoor|google/)) console.log(`👻 [XHR] ${_url}`);
                                return target.open.apply(target, arguments);
                            }, 'open');
                        }

                        // RESTORED BINDING LOGIC (The Fix for Illegal Invocation)
                        const value = Reflect.get(target, prop);
                        if (typeof value === 'function') {
                            return value.bind(target);
                        }
                        return value;
                    },
                    set(target, prop, value) { return Reflect.set(target, prop, value); }
                });
            }
        });
        makeNative(XHRProxy, 'XMLHttpRequest');
        Object.defineProperty(XHRProxy, 'name', { value: 'XMLHttpRequest' });
        window.XMLHttpRequest = XHRProxy;
        console.log(`👻 [Ghost GPS ${APP_VERSION}] XHR Proxy Fixed.`);
    } catch (e) { }

    // -------------------------------------------------------------------------
    // 4. FETCH PROXY (SNIPER MODE)
    // -------------------------------------------------------------------------
    try {
        const originalFetch = window.fetch;
        window.fetch = async function (...args) {
            let url = '';
            if (typeof args[0] === 'string') url = args[0];
            else if (args[0] instanceof Request) url = args[0].url;

            const isTarget = (
                url.includes('geocode') ||
                url.includes('address') ||
                url.includes('place') ||
                url.includes('search') ||
                url.includes('google.com/maps')
            );

            if (isTarget) {
                console.log(`👻 [FETCH SNIPER] Intercepting: ${url}`);
                try {
                    const response = await originalFetch.apply(window, args); // Explicit window context
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
        console.log(`👻 [Ghost GPS ${APP_VERSION}] Sniper Fetch Active.`);
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
