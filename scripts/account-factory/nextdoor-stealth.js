/**
 * Nextdoor Account Factory - Incognia Bypass System
 * 
 * This script automates Nextdoor account creation with:
 * - Playwright stealth mode (anti-detection)
 * - Human behavior simulation (mouse, typing, scrolling)
 * - GPS spoofing (injected directly, no extension)
 * - Residential proxy support
 */

const { chromium } = require('playwright');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // Proxy settings (residential proxy from Miami)
    proxy: {
        server: 'http://192.53.67.129:5678',
        username: 'juvgugun',
        password: 'm1c1h51kdgjm'
    },

    // GPS spoofing coordinates (Nautilus Drive, Miami Beach)
    location: {
        latitude: 25.821702,
        longitude: -80.135205,
        address: '4554 Nautilus Drive',
        city: 'Miami Beach',
        state: 'FL',
        zip: '33140'
    },

    // Account details
    account: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'SecurePass123!'
    },

    // Timing settings (in milliseconds)
    timing: {
        preBrowsing: 120000, // 2 minutes on homepage
        minDelay: 2000,      // Minimum delay between actions
        maxDelay: 8000,      // Maximum delay between actions
        typingSpeed: 150     // Average ms per character
    }
};

// ============================================================================
// STEALTH CONFIGURATION
// ============================================================================

async function createStealthContext(browser) {
    const context = await browser.newContext({
        // Proxy configuration
        proxy: CONFIG.proxy,

        // Geolocation
        geolocation: {
            latitude: CONFIG.location.latitude,
            longitude: CONFIG.location.longitude
        },
        permissions: ['geolocation'],

        // Locale and timezone
        locale: 'en-US',
        timezoneId: 'America/New_York',

        // Viewport (randomized but realistic)
        viewport: {
            width: 1920,
            height: 1080
        },

        // User agent (realistic)
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',

        // Device scale factor
        deviceScaleFactor: 2,

        // Extra HTTP headers
        extraHTTPHeaders: {
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Upgrade-Insecure-Requests': '1'
        }
    });

    return context;
}

// ============================================================================
// GPS SPOOFING INJECTION
// ============================================================================

const GPS_SPOOF_CODE = `
// Ghost GPS Spoofer - Injected Version (No Extension)
(function() {
  'use strict';
  
  const SPOOFED_COORDS = {
    latitude: ${CONFIG.location.latitude},
    longitude: ${CONFIG.location.longitude},
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null
  };
  
  const SPOOFED_ADDRESS = {
    street: '${CONFIG.location.address}',
    city: '${CONFIG.location.city}',
    state: '${CONFIG.location.state}',
    zip: '${CONFIG.location.zip}'
  };
  
  // Override Geolocation API
  const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
  const originalWatchPosition = navigator.geolocation.watchPosition;
  
  navigator.geolocation.getCurrentPosition = function(success, error, options) {
    console.log('👻 [GPS Spoof] getCurrentPosition called');
    setTimeout(() => {
      success({
        coords: SPOOFED_COORDS,
        timestamp: Date.now()
      });
    }, 100);
  };
  
  navigator.geolocation.watchPosition = function(success, error, options) {
    console.log('👻 [GPS Spoof] watchPosition called');
    const id = Math.floor(Math.random() * 10000);
    setTimeout(() => {
      success({
        coords: SPOOFED_COORDS,
        timestamp: Date.now()
      });
    }, 100);
    return id;
  };
  
  // Override Fetch API for address rewriting
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = args[0];
    const response = await originalFetch.apply(this, args);
    
    // Intercept Nextdoor API calls
    if (url.includes('/api/gql/') || url.includes('/ajax/')) {
      const clonedResponse = response.clone();
      try {
        const text = await clonedResponse.text();
        
        // Rewrite any address data
        let modified = text;
        
        // Replace coordinates
        modified = modified.replace(/"latDegrees":\\s*[\\d.-]+/g, '"latDegrees": ${CONFIG.location.latitude}');
        modified = modified.replace(/"lonDegrees":\\s*[\\d.-]+/g, '"lonDegrees": ${CONFIG.location.longitude}');
        
        // Replace street addresses
        modified = modified.replace(/"streetAddress":\\s*"[^"]+"/g, '"streetAddress": "${CONFIG.location.address}"');
        modified = modified.replace(/"formattedStreet":\\s*"[^"]+"/g, '"formattedStreet": "${CONFIG.location.address}"');
        modified = modified.replace(/"route":\\s*"[^"]+"/g, '"route": "Nautilus Drive"');
        
        // Replace city/state/zip
        modified = modified.replace(/"city":\\s*"[^"]+"/g, '"city": "${CONFIG.location.city}"');
        modified = modified.replace(/"state":\\s*"[^"]+"/g, '"state": "${CONFIG.location.state}"');
        modified = modified.replace(/"postalCode":\\s*"[^"]+"/g, '"postalCode": "${CONFIG.location.zip}"');
        
        if (modified !== text) {
          console.log('👻 [GPS Spoof] Rewrote address data in:', url);
          return new Response(modified, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        }
      } catch (e) {
        // If parsing fails, return original response
      }
    }
    
    return response;
  };
  
  console.log('👻 [GPS Spoof] Injection complete - Location set to ${CONFIG.location.address}');
})();
`;

// ============================================================================
// ANTI-DETECTION PATCHES
// ============================================================================

const ANTI_DETECTION_CODE = `
// Remove automation signals
Object.defineProperty(navigator, 'webdriver', {
  get: () => undefined
});

// Patch Chrome runtime
if (window.chrome) {
  window.chrome.runtime = undefined;
}

// Add missing properties
Object.defineProperty(navigator, 'plugins', {
  get: () => [1, 2, 3, 4, 5]
});

Object.defineProperty(navigator, 'languages', {
  get: () => ['en-US', 'en']
});

// Disable WebRTC (prevents IP leaks)
const getOrig = RTCPeerConnection.prototype.setLocalDescription;
RTCPeerConnection.prototype.setLocalDescription = function() {
  return Promise.resolve();
};

console.log('🛡️ [Anti-Detection] Patches applied');
`;

// ============================================================================
// HUMAN BEHAVIOR SIMULATION
// ============================================================================

class HumanBehavior {
    // Random delay between min and max
    static async randomDelay(min = CONFIG.timing.minDelay, max = CONFIG.timing.maxDelay) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Bezier curve mouse movement with jitter
    static async moveMouseHuman(page, fromX, fromY, toX, toY) {
        const steps = Math.floor(Math.random() * 50) + 50;

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;

            // Bezier curve (cubic)
            const cp1x = fromX + (toX - fromX) * 0.25 + (Math.random() - 0.5) * 100;
            const cp1y = fromY + (toY - fromY) * 0.25 + (Math.random() - 0.5) * 100;
            const cp2x = fromX + (toX - fromX) * 0.75 + (Math.random() - 0.5) * 100;
            const cp2y = fromY + (toY - fromY) * 0.75 + (Math.random() - 0.5) * 100;

            const x = Math.pow(1 - t, 3) * fromX +
                3 * Math.pow(1 - t, 2) * t * cp1x +
                3 * (1 - t) * Math.pow(t, 2) * cp2x +
                Math.pow(t, 3) * toX;

            const y = Math.pow(1 - t, 3) * fromY +
                3 * Math.pow(1 - t, 2) * t * cp1y +
                3 * (1 - t) * Math.pow(t, 2) * cp2y +
                Math.pow(t, 3) * toY;

            // Add jitter
            const jitterX = x + (Math.random() - 0.5) * 5;
            const jitterY = y + (Math.random() - 0.5) * 5;

            await page.mouse.move(jitterX, jitterY);
            await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        }
    }

    // Human-like typing with errors and corrections
    static async typeHuman(page, selector, text) {
        await page.click(selector);
        await this.randomDelay(500, 1000);

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            // Random typo (5% chance)
            if (Math.random() < 0.05) {
                const wrongChar = String.fromCharCode(97 + Math.floor(Math.random() * 26));
                await page.keyboard.type(wrongChar);
                await this.randomDelay(100, 300);
                await page.keyboard.press('Backspace');
                await this.randomDelay(100, 200);
            }

            await page.keyboard.type(char);

            // Variable typing speed
            const baseSpeed = CONFIG.timing.typingSpeed;
            const variance = baseSpeed * 0.5;
            await this.randomDelay(baseSpeed - variance, baseSpeed + variance);
        }
    }

    // Natural scrolling
    static async scrollHuman(page) {
        const scrolls = Math.floor(Math.random() * 3) + 2;

        for (let i = 0; i < scrolls; i++) {
            const distance = Math.random() * 300 + 100;
            const direction = Math.random() > 0.8 ? -1 : 1; // Occasionally scroll up

            await page.mouse.wheel(0, distance * direction);
            await this.randomDelay(500, 1500);
        }
    }

    // Random mouse movements (idle behavior)
    static async idleMouseMovements(page, duration = 5000) {
        const endTime = Date.now() + duration;

        while (Date.now() < endTime) {
            const x = Math.random() * 1920;
            const y = Math.random() * 1080;
            await this.moveMouseHuman(page, 0, 0, x, y);
            await this.randomDelay(1000, 3000);
        }
    }
}

// ============================================================================
// MAIN SIGNUP FLOW
// ============================================================================

async function createNextdoorAccount() {
    console.log('🚀 Starting Nextdoor account creation...');

    // Launch browser
    const browser = await chromium.launch({
        headless: false, // Use headed for better fingerprint
        args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-site-isolation-trials'
        ]
    });

    try {
        // Create stealth context
        const context = await createStealthContext(browser);
        const page = await context.newPage();

        // Inject anti-detection code
        await page.addInitScript(ANTI_DETECTION_CODE);

        // Inject GPS spoofing code
        await page.addInitScript(GPS_SPOOF_CODE);

        console.log('✅ Stealth mode activated');
        console.log('✅ GPS spoofing injected');

        // Step 1: Pre-browsing (build trust)
        console.log('📖 Step 1: Pre-browsing homepage...');
        await page.goto('https://nextdoor.com', { waitUntil: 'networkidle' });
        await HumanBehavior.randomDelay(3000, 5000);

        // Scroll and read
        await HumanBehavior.scrollHuman(page);
        await HumanBehavior.idleMouseMovements(page, 10000);

        console.log('⏳ Waiting 2 minutes (pre-browsing)...');
        await new Promise(resolve => setTimeout(resolve, CONFIG.timing.preBrowsing));

        // Step 2: Navigate to signup
        console.log('🔗 Step 2: Navigating to signup...');
        const signupButton = await page.locator('text=Sign up').first();
        const box = await signupButton.boundingBox();
        if (box) {
            await HumanBehavior.moveMouseHuman(page, 0, 0, box.x + box.width / 2, box.y + box.height / 2);
            await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        }

        await page.waitForLoadState('networkidle');
        await HumanBehavior.randomDelay(2000, 4000);

        // Step 3: Fill signup form
        console.log('✍️  Step 3: Filling signup form...');

        // First name
        await HumanBehavior.typeHuman(page, 'input[name="first_name"]', CONFIG.account.firstName);
        await HumanBehavior.randomDelay(1000, 2000);

        // Last name
        await HumanBehavior.typeHuman(page, 'input[name="last_name"]', CONFIG.account.lastName);
        await HumanBehavior.randomDelay(1000, 2000);

        // Email
        await HumanBehavior.typeHuman(page, 'input[name="email"]', CONFIG.account.email);
        await HumanBehavior.randomDelay(1000, 2000);

        // Password
        await HumanBehavior.typeHuman(page, 'input[name="password"]', CONFIG.account.password);
        await HumanBehavior.randomDelay(2000, 3000);

        // Step 4: Address (GPS spoofing active)
        console.log('📍 Step 4: Entering address (GPS spoofing active)...');
        const addressInput = page.locator('input[placeholder*="address"]').first();
        await addressInput.click();
        await HumanBehavior.randomDelay(1000, 2000);

        // Type partial address to trigger autocomplete
        await HumanBehavior.typeHuman(page, 'input[placeholder*="address"]', '4554 Naut');
        await HumanBehavior.randomDelay(2000, 3000);

        // Wait for autocomplete and select
        await page.waitForSelector('text=4554 Nautilus', { timeout: 10000 });
        await page.click('text=4554 Nautilus');

        console.log('✅ Address selected: 4554 Nautilus Drive');
        await HumanBehavior.randomDelay(2000, 4000);

        // Step 5: Submit
        console.log('🚀 Step 5: Submitting signup...');
        const submitButton = page.locator('button[type="submit"]').first();
        const submitBox = await submitButton.boundingBox();
        if (submitBox) {
            await HumanBehavior.moveMouseHuman(page, 0, 0, submitBox.x + submitBox.width / 2, submitBox.y + submitBox.height / 2);
            await page.mouse.click(submitBox.x + submitBox.width / 2, submitBox.y + submitBox.height / 2);
        }

        // Wait for verification
        console.log('⏳ Waiting for verification...');
        await page.waitForLoadState('networkidle');
        await HumanBehavior.randomDelay(5000, 10000);

        // Check for success or errors
        const url = page.url();
        console.log('📍 Current URL:', url);

        if (url.includes('/verify') || url.includes('/choose_address')) {
            console.log('✅ Account created! Waiting for verification...');

            // Take screenshot
            await page.screenshot({ path: 'nextdoor-signup-success.png' });

            // Wait for manual verification if needed
            console.log('⏳ Waiting 60 seconds for verification to complete...');
            await new Promise(resolve => setTimeout(resolve, 60000));

            return { success: true, url: page.url() };
        } else if (url.includes('/logout') || url.includes('/login')) {
            console.log('❌ Account creation failed - redirected to logout/login');
            await page.screenshot({ path: 'nextdoor-signup-failed.png' });
            return { success: false, error: 'Redirected to logout' };
        } else {
            console.log('⚠️  Unknown state - manual review needed');
            await page.screenshot({ path: 'nextdoor-signup-unknown.png' });
            return { success: false, error: 'Unknown state' };
        }

    } catch (error) {
        console.error('❌ Error during signup:', error);
        return { success: false, error: error.message };
    } finally {
        // Keep browser open for inspection
        console.log('🔍 Browser left open for inspection. Close manually when done.');
        // await browser.close();
    }
}

// ============================================================================
// RUN
// ============================================================================

if (require.main === module) {
    createNextdoorAccount()
        .then(result => {
            console.log('\n📊 Final Result:', result);
        })
        .catch(error => {
            console.error('\n❌ Fatal Error:', error);
            process.exit(1);
        });
}

module.exports = { createNextdoorAccount, HumanBehavior };
