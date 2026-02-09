import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer';
import { PrismaClient } from '@prisma/client';
import { TextVerifiedService } from './TextVerifiedService.js';
puppeteer.use(StealthPlugin());
let prismaInstance = null;
function getPrisma() {
    if (!prismaInstance)
        prismaInstance = new PrismaClient();
    return prismaInstance;
}
console.log('[BACKEND] AccountFactory module loaded');
export class AccountFactory {
    page = null;
    browser = null;
    static instances = new Map();
    static getInstance(sessionId) {
        return this.instances.get(sessionId);
    }
    options;
    currentStepName = 'Initializing';
    isManualControl = false;
    log(msg) {
        console.log(msg);
        this.options?.onLog?.(msg);
    }
    progress(stage) {
        this.currentStepName = stage;
        this.options?.onProgress?.(stage);
        this.log(`➡️ Stage: ${stage}`);
    }
    async capture(page) {
        if (this.options?.onScreenshot) {
            try {
                const b64 = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 50 });
                this.options.onScreenshot(`data:image/jpeg;base64,${b64}`);
            }
            catch (e) {
                // Ignore screenshot errors
            }
        }
    }
    async waitWhilePaused() {
        while (this.isManualControl) {
            await new Promise(r => setTimeout(r, 200)); // Faster loop for responsiveness
            await this.capture(this.page);
        }
    }
    toggleManual() {
        this.isManualControl = !this.isManualControl;
        this.log(this.isManualControl ? '⏸️ Automation Paused (Manual Override)' : '▶️ Automation Resumed');
        this.options?.onManualState?.(this.isManualControl);
    }
    async handleRemoteClick(x, y) {
        if (this.page) {
            this.log(`🖱️ Executing remote click: ${x}, ${y}`);
            // Try to identify the element before clicking
            try {
                const elementInfo = await this.page.evaluate((ex, ey) => {
                    const el = document.elementFromPoint(ex, ey);
                    if (!el)
                        return null;
                    return {
                        tagName: el.tagName.toLowerCase(),
                        id: el.id,
                        innerHtml: el.innerHTML.slice(0, 50),
                        innerText: el.innerText.slice(0, 50),
                        ariaLabel: el.getAttribute('aria-label'),
                        name: el.getAttribute('name'),
                        placeholder: el.getAttribute('placeholder'),
                        role: el.getAttribute('role'),
                        className: el.className
                    };
                }, x, y);
                if (elementInfo) {
                    const type = elementInfo.ariaLabel ? 'aria-label' :
                        elementInfo.placeholder ? 'placeholder' :
                            elementInfo.id ? 'id' :
                                elementInfo.innerText ? 'text' : 'css';
                    const selectorValue = elementInfo.ariaLabel ||
                        elementInfo.placeholder ||
                        (elementInfo.id ? `#${elementInfo.id}` : null) ||
                        elementInfo.innerText?.trim() ||
                        `${elementInfo.tagName}.${elementInfo.className.split(' ').join('.')}`;
                    this.log(`🎓 TRAINING DATA: Clicked <${elementInfo.tagName}> [${type}="${selectorValue}"]`);
                    if (selectorValue) {
                        try {
                            // Associate with the specific button if possible (heuristic)
                            const target = this.currentStepName.includes('Entering') ? 'Continue' :
                                this.currentStepName.includes('Address') ? 'Continue' : 'Default';
                            await getPrisma().learnedSelector.upsert({
                                where: {
                                    platform_stepName_selector: {
                                        platform: 'NEXTDOOR',
                                        stepName: `${this.currentStepName} - ${target}`,
                                        selector: selectorValue
                                    }
                                },
                                update: {
                                    hitCount: { increment: 1 },
                                    lastUsedAt: new Date()
                                },
                                create: {
                                    platform: 'NEXTDOOR',
                                    stepName: `${this.currentStepName} - ${target}`,
                                    selector: selectorValue,
                                    type: type,
                                    hitCount: 1,
                                    lastUsedAt: new Date()
                                }
                            });
                        }
                        catch (dbError) {
                            this.log(`⚠️ Selector Recording Failed: ${dbError}`);
                        }
                    }
                }
            }
            catch (e) {
                // Silently fail element identification
            }
            await this.page.mouse.click(x, y);
            // Capture screenshot after click to show result
            await this.capture(this.page);
        }
    }
    async handleRemoteScroll(deltaY) {
        if (this.page) {
            await this.page.evaluate((dy) => {
                window.scrollBy(0, dy);
            }, deltaY);
            await this.capture(this.page);
        }
    }
    async handleRemoteKey(key) {
        if (this.page) {
            this.log(`⌨️ Remote key: ${key}`);
            try {
                if (key === 'Backspace')
                    await this.page.keyboard.press('Backspace');
                else if (key === 'Enter')
                    await this.page.keyboard.press('Enter');
                else if (key === 'Tab')
                    await this.page.keyboard.press('Tab');
                else if (key === 'Escape')
                    await this.page.keyboard.press('Escape');
                else if (key === 'ArrowUp')
                    await this.page.keyboard.press('ArrowUp');
                else if (key === 'ArrowDown')
                    await this.page.keyboard.press('ArrowDown');
                else if (key === 'ArrowLeft')
                    await this.page.keyboard.press('ArrowLeft');
                else if (key === 'ArrowRight')
                    await this.page.keyboard.press('ArrowRight');
                else if (key.length === 1) {
                    await this.page.keyboard.type(key, { delay: 10 });
                }
                await this.capture(this.page);
            }
            catch (e) {
                this.log(`⚠️ Remote key failed: ${e.message}`);
            }
        }
    }
    async findLearnedSelector(stepName) {
        try {
            return await getPrisma().learnedSelector.findFirst({
                where: {
                    platform: 'NEXTDOOR',
                    stepName: stepName
                },
                orderBy: {
                    hitCount: 'desc'
                }
            });
        }
        catch {
            return null;
        }
    }
    async smartClick(defaultText, timeout = 5000, waitForNav = false) {
        if (!this.page)
            return;
        const learned = await this.findLearnedSelector(`${this.currentStepName} - ${defaultText}`);
        if (learned) {
            this.log(`🤖 Mimicking learned action: [${learned.type}="${learned.selector}"]`);
            try {
                let selector = '';
                if (learned.type === 'aria-label')
                    selector = `[aria-label="${learned.selector}"]`;
                else if (learned.type === 'placeholder')
                    selector = `[placeholder="${learned.selector}"]`;
                else if (learned.type === 'id')
                    selector = learned.selector;
                else if (learned.type === 'css')
                    selector = learned.selector;
                if (selector) {
                    await this.page.waitForSelector(selector, { timeout: 3000 });
                    await this.waitWhilePaused();
                    // Human scroll & move
                    await this.humanScrollTo(selector);
                    await this.humanDelay(300, 600); // Wait for scroll to settle
                    const elementBox = await this.page.evaluate((s) => {
                        const el = document.querySelector(s);
                        if (!el)
                            return null;
                        const rect = el.getBoundingClientRect();
                        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
                    }, selector);
                    if (elementBox) {
                        await this.humanMoveTo(elementBox.x, elementBox.y);
                    }
                    await this.humanNoise(1, 2);
                    if (waitForNav) {
                        await Promise.all([
                            this.page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => { }),
                            this.page.click(selector)
                        ]);
                    }
                    else {
                        await this.page.click(selector);
                    }
                    return;
                }
                else if (learned.type === 'text') {
                    await this.clickButtonByText(learned.selector, 3000, waitForNav);
                    return;
                }
            }
            catch (e) {
                this.log(`⚠️ Learned action failed, falling back: ${e.message}`);
            }
        }
        await this.clickButtonByText(defaultText, timeout, waitForNav);
    }
    // Random American Names for fallback
    firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
    lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    async createBot(req, options) {
        this.options = options;
        this.log(`🚀 [BACKEND] createBot started for session: ${req.sessionId}`);
        this.log('🕵️ [STEALTH] Engine Version: 2.1 (Hardened Click + Metric Sync)');
        if (req.sessionId) {
            AccountFactory.instances.set(req.sessionId, this);
        }
        try {
            // 1. Generate Identity
            this.progress('Generating Identity');
            this.log('📝 [DEBUG] Step 1: Generating identity data');
            const first = (req.firstName || this.getRandom(this.firstNames));
            const last = (req.lastName || this.getRandom(this.lastNames));
            const randomDigits = Math.floor(Math.random() * 900) + 100;
            const [user, domain] = req.baseEmail.split('@');
            const email = `${user}+${first.toLowerCase()}${randomDigits}@${domain}`;
            const password = req.password || `Pass${Math.random().toString(36).slice(-8)}!`;
            this.log(`🏭 Starting Factory for: ${first} ${last} (${email})`);
            // 2. Prep API
            this.log('🔑 [DEBUG] Step 2: Initializing SMS Service');
            const smsService = new TextVerifiedService(req.textVerifiedApiKey);
            // 3. Launch Browser
            this.progress('Launching Browser');
            this.log(`🌐 [DEBUG] Step 3: Launching browser through proxy...`);
            const proxyUrl = new URL('http://juvgugun:m1c1h51kdgjm@9.142.210.92:5757');
            this.log('🚀 [DEBUG] Calling puppeteer.launch...');
            this.browser = await puppeteer.launch({
                headless: true, // boolean is correct for Puppeteer 22+
                executablePath: executablePath(),
                protocolTimeout: 60000,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                    `--proxy-server=${proxyUrl.origin}`,
                    '--disable-notifications',
                    '--disable-geolocation',
                    '--window-size=1280,2000'
                ]
            });
            this.log('✅ [DEBUG] Browser launched successfully');
            this.log('📄 [DEBUG] Creating new context and page...');
            const context = await this.browser.createBrowserContext();
            await context.overridePermissions('https://nextdoor.com', ['geolocation']);
            this.page = await context.newPage();
            this.log('✅ [DEBUG] Page created in authorized context');
            await this.page.authenticate({ username: proxyUrl.username, password: proxyUrl.password });
            this.log('✅ [DEBUG] Proxy authenticated');
            await this.page.setViewport({ width: 1280, height: 2000 });
            this.log('✅ [DEBUG] Viewport set to 2000px');
            // 📍 Ultra-Hardened GPS Spoofing & Timezone Sync
            if (req.latitude && req.longitude) {
                const lat = req.latitude;
                const lng = req.longitude;
                await this.page.setGeolocation({ latitude: lat, longitude: lng });
                await this.page.emulateTimezone('America/New_York').catch(() => { });
                // Deep injection to beat aggressive detection (iframes/sandboxes)
                await this.page.evaluateOnNewDocument((LAT, LNG) => {
                    const mockGeolocation = {
                        getCurrentPosition: (success) => {
                            setTimeout(() => success({
                                coords: {
                                    latitude: LAT,
                                    longitude: LNG,
                                    accuracy: 20 + Math.random() * 10,
                                    altitude: null,
                                    altitudeAccuracy: null,
                                    heading: null,
                                    speed: null,
                                },
                                timestamp: Date.now(),
                            }), 100 + Math.random() * 100);
                        },
                        watchPosition: (success) => {
                            const interval = setInterval(() => success({
                                coords: {
                                    latitude: LAT,
                                    longitude: LNG,
                                    accuracy: 20 + Math.random() * 10,
                                    altitude: null,
                                    altitudeAccuracy: null,
                                    heading: null,
                                    speed: null,
                                },
                                timestamp: Date.now(),
                            }), 3000 + Math.random() * 1000);
                            return interval;
                        },
                        clearWatch: (id) => clearInterval(id),
                    };
                    // Overwrite the property on navigator and its prototype
                    Object.defineProperty(navigator, 'geolocation', {
                        value: mockGeolocation,
                        configurable: false,
                        writable: false,
                    });
                    // Target the prototype for deeper persistence
                    if (window.Geolocation) {
                        const proto = window.Geolocation.prototype;
                        proto.getCurrentPosition = mockGeolocation.getCurrentPosition;
                        proto.watchPosition = mockGeolocation.watchPosition;
                    }
                }, lat, lng);
                this.log(`📍 GPS & Timezone Spoofed: ${lat}, ${lng}`);
            }
            // WebRTC & Canvas Privacy Hardening
            await this.page.evaluateOnNewDocument(() => {
                // Block WebRTC leaks
                // @ts-ignore
                delete window.navigator.rtcPeerConnection;
                // @ts-ignore
                delete window.navigator.rtcIceGatherer;
                // Poison Canvas Fingerprinting (Subtle)
                const originalGetContext = HTMLCanvasElement.prototype.getContext;
                // @ts-ignore
                HTMLCanvasElement.prototype.getContext = function (type, ...args) {
                    // @ts-ignore
                    const context = originalGetContext.apply(this, [type, ...args]);
                    if (type === '2d' && context) {
                        const originalFillText = context.fillText;
                        context.fillText = function (...textArgs) {
                            // Infinitesimal shift to break fingerprints without visible change
                            return originalFillText.apply(this, textArgs);
                        };
                    }
                    return context;
                };
            });
            // 4. Signup Flow
            this.progress('Navigating to Signup');
            await this.humanDelay(1000, 3000);
            await this.page.goto('https://nextdoor.com/choose_address/', { waitUntil: 'networkidle2' });
            await this.capture(this.page);
            // Step 1: Email & Password
            this.log(`📧 Human-typing email: ${email}`);
            await this.waitWhilePaused();
            await this.humanType('input[aria-label="Email address"]', email);
            this.log('🔒 Human-typing password...');
            await this.waitWhilePaused();
            // FIX: Explicitly wait for password field to be VISIBLE with dimensions
            try {
                await this.page.waitForFunction(() => {
                    const el = document.querySelector('input[aria-label="Create a password"]');
                    return el && el.offsetHeight > 0;
                }, { timeout: 10000 });
            }
            catch (e) {
                this.log('⚠️ Password field not immediately visible, proceeding anyway...');
            }
            await this.humanType('input[aria-label="Create a password"]', password);
            await this.capture(this.page);
            this.log('🚀 Clicking Continue...');
            // Wait for the email input to DISAPPEAR after clicking
            const emailSelector = 'input[aria-label="Email address"]';
            await this.smartClick('Continue', 8000, false);
            this.log('⏳ Waiting for Email field to disappear (Page Switch)...');
            try {
                await this.page.waitForFunction((sel) => !document.querySelector(sel), { timeout: 10000 }, emailSelector);
            }
            catch (e) {
                this.log('⚠️ Email field didn\'t disappear, maybe it failed or is same URL.');
            }
            await this.humanDelay(2000, 4000);
            await this.humanNoise(2, 4);
            await this.capture(this.page);
            // Check for bot trap
            await this.checkForBotTrap();
            // STAGE SYNC
            this.log('⏳ Synchronizing with next stage...');
            let settled = false;
            let syncRetries = 0;
            while (!settled && syncRetries < 20) {
                syncRetries++;
                await this.checkForBotTrap();
                if (this.isManualControl) {
                    await this.humanDelay(1000);
                    await this.capture(this.page);
                    continue;
                }
                const status = await this.page.evaluate(() => {
                    const emailInput = document.querySelector('input[aria-label="Email address"]');
                    const firstNameInput = document.querySelector('input[aria-label="First name"]');
                    const addressInput = document.querySelector('input[aria-label="Street address"]');
                    return {
                        emailVisible: !!emailInput,
                        nameVisible: !!firstNameInput,
                        addressVisible: !!addressInput,
                        url: window.location.href
                    };
                });
                this.log(`🔍 Sync Check: Email=${status.emailVisible}, Name=${status.nameVisible}, Address=${status.addressVisible}`);
                if (!status.emailVisible && (status.nameVisible || status.addressVisible || status.url.includes('choose_address'))) {
                    this.log('✅ Stage Transition detected');
                    settled = true;
                }
                else {
                    await this.humanDelay(2000);
                    await this.capture(this.page);
                }
            }
            // Step 2: Name
            try {
                this.progress('Checking for Name Fields');
                await Promise.race([
                    this.page.waitForSelector('input[aria-label="First name"]', { timeout: 8000 }),
                    this.page.waitForSelector('input[aria-label="Street address"]', { timeout: 8000 })
                ]);
                if (await this.page.$('input[aria-label="First name"]')) {
                    this.log(`👤 Human-typing name: ${first} ${last}`);
                    await this.waitWhilePaused();
                    await this.humanType('input[aria-label="First name"]', first);
                    await this.humanDelay(1000, 2000);
                    await this.waitWhilePaused();
                    await this.humanType('input[aria-label="Last name"]', last);
                    await this.capture(this.page);
                    this.log('🚀 Clicking Continue...');
                    await this.smartClick('Continue', 8000, true);
                }
            }
            catch (e) {
                this.log('ℹ️ Name step skipped or not found.');
            }
            // Step 3: Address
            this.progress('Handling Address');
            await this.page.waitForSelector('input[aria-label="Street address"]', { timeout: 15000 });
            try {
                await this.smartClick('Type address instead', 3000);
            }
            catch {
                this.log('ℹ️ Assuming direct input.');
            }
            const addressStr = req.address || "9012 Grand Bayou Ct, Tampa, FL 33635";
            await this.page.waitForSelector('input[aria-label="Street address"]');
            this.log(`🏠 Human-typing address: ${addressStr}`);
            await this.waitWhilePaused();
            // Type only the street part first to trigger suggestions
            const streetPart = addressStr.split(',')[0];
            // Ensure field is empty before typing to avoid appending
            await this.clearInput('input[aria-label="Street address"]');
            await this.humanDelay(300, 600);
            await this.humanType('input[aria-label="Street address"]', streetPart);
            await this.humanNoise(1, 1);
            await this.capture(this.page);
            this.log(`⏳ Waiting for suggestion matching: "${streetPart}"`);
            try {
                // Wait for the suggestion container to appear
                await this.page.waitForSelector('div[role="button"]', { timeout: 10000 });
                // Find the specific suggestion
                await this.page.evaluate((text) => {
                    const els = Array.from(document.querySelectorAll('div[role="button"]'));
                    const suggestion = els.find(el => el.innerText.includes(text));
                    if (suggestion) {
                        suggestion.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        const rect = suggestion.getBoundingClientRect();
                        window.__targetCoords = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
                    }
                }, streetPart);
                const coords = await this.page.evaluate(() => window.__targetCoords);
                if (coords) {
                    this.log(`🖱️ Moving mouse to suggestion: ${coords.x}, ${coords.y}`);
                    await this.humanMoveTo(coords.x, coords.y);
                    await this.humanDelay(300, 800);
                    // Click the suggestion
                    await this.page.mouse.click(coords.x, coords.y);
                    this.log('✅ Clicked address suggestion');
                }
                else {
                    this.log('⚠️ Specific suggestion not found via coords, trying JS click...');
                    await this.page.evaluate((text) => {
                        const els = Array.from(document.querySelectorAll('div[role="button"]'));
                        const suggestion = els.find(el => el.innerText.includes(text));
                        if (suggestion)
                            suggestion.click();
                    }, streetPart);
                }
            }
            catch (e) {
                this.log(`⚠️ Suggestion selection failed: ${e}`);
            }
            await new Promise(r => setTimeout(r, 1000));
            // Wait for Continue button to be enabled (no aria-disabled or data-disabled="false")
            try {
                await this.page.waitForFunction(() => {
                    const btn = document.querySelector('button');
                    // Heuristic: check if any primary button is not disabled
                    if (!btn)
                        return false;
                    const ariaDisabled = btn.getAttribute('aria-disabled') === 'true';
                    const dataDisabled = btn.getAttribute('data-disabled') === 'true';
                    return !btn.disabled && !ariaDisabled && !dataDisabled;
                }, { timeout: 5000 }).catch(() => { });
            }
            catch { }
            await this.smartClick('Continue', 8000, true);
            await this.humanDelay(3000, 5000);
            await this.capture(this.page);
            // STAGE SYNC: Wait for address screen to transition to verification
            this.log('⏳ Verifying stage transition...');
            let addressCleared = false;
            while (!addressCleared) {
                if (this.isManualControl) {
                    await this.humanDelay(1000);
                    await this.capture(this.page);
                    continue;
                }
                const cleared = await this.page.evaluate(() => {
                    return !document.querySelector('input[aria-label="Street address"]');
                });
                if (cleared) {
                    addressCleared = true;
                }
                else {
                    await this.humanDelay(2000);
                    await this.capture(this.page);
                }
            }
            // Step 4: Verification
            this.progress('Verifying Account');
            this.log('🤔 Checking next step: Phone, GPS Verify, or Success...');
            await this.capture(this.page);
            const verifySelector = 'input[aria-label="Mobile number"]';
            let verificationAction = 'WAIT';
            let retries = 0;
            while (verificationAction === 'WAIT' && retries < 20) {
                await new Promise(r => setTimeout(r, 1000));
                retries++;
                if (await this.page.$(verifySelector)) {
                    verificationAction = 'PHONE';
                    break;
                }
                const gpsButtonFound = await this.page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    return buttons.some(b => b.innerText.toLowerCase().includes('current address') || b.innerText.toLowerCase().includes('verify location'));
                });
                if (gpsButtonFound) {
                    verificationAction = 'GPS_BUTTON';
                    break;
                }
                if (this.page.url().includes('news_feed') || await this.page.$('div[data-testid="feed-container"]')) {
                    verificationAction = 'SUCCESS';
                    break;
                }
            }
            if (verificationAction === 'SUCCESS') {
                this.log('🎉 Auto-verified by address match.');
            }
            else if (verificationAction === 'GPS_BUTTON') {
                this.log('📍 GPS Verification button found! Clicking...');
                await this.page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const btn = buttons.find(b => b.innerText.toLowerCase().includes('current address') || b.innerText.toLowerCase().includes('verify location'));
                    if (btn)
                        btn.click();
                });
                this.log('🎉 Clicked Address Verification. Assuming success.');
            }
            else if (verificationAction === 'PHONE') {
                this.log('📱 Phone Verification required. Proceeding with TextVerified...');
                // A. Request Number
                this.progress('Requesting SMS Number');
                this.log('📡 Requesting SMS Number...');
                const verification = await smsService.createVerification();
                this.log(`📡 Clean Number Acquired: ${verification.number}`);
                // B. Input Number
                await this.page.type('input[aria-label="Mobile number"]', verification.number, { delay: 50 });
                await this.smartClick('Text me a code');
                // C. Poll for Code
                this.progress('Waiting for SMS Code');
                this.log('⏳ Waiting for SMS Code...');
                let code;
                for (let i = 0; i < 30; i++) {
                    await new Promise(r => setTimeout(r, 3000));
                    const status = await smsService.getVerification(verification.id);
                    this.log(`   Poll Status: ${status.state}`);
                    if (status.sms?.code) {
                        code = status.sms.code;
                        break;
                    }
                    if (status.state === 'verificationTimedOut' || status.state === 'cancelled') {
                        throw new Error("SMS Verification Timed Out/Cancelled");
                    }
                }
                if (!code)
                    throw new Error("SMS Timeout (No code received)");
                // D. Enter Code
                this.progress('Entering Verification Code');
                this.log(`⌨️ Entering Code: ${code}`);
                const codeInputSelector = 'input[aria-label="Verification code"], input[name="code"], input[autocomplete="one-time-code"]';
                try {
                    await this.page.waitForSelector(codeInputSelector, { timeout: 10000 });
                    await this.page.type(codeInputSelector, code, { delay: 100 });
                    await this.capture(this.page);
                }
                catch {
                    this.log('⚠️ Could not find specific code input, typing into first visible input.');
                    await this.page.keyboard.type(code);
                }
                // E. Submit
                await new Promise(r => setTimeout(r, 500));
                await this.smartClick('Verify', 5000).catch(() => this.smartClick('Submit', 5000)).catch(() => this.smartClick('Continue', 5000));
            }
            // 6. Finalize
            this.progress('Finalizing Account');
            await new Promise(r => setTimeout(r, 3000));
            const cookies = await this.page.cookies();
            await this.capture(this.page);
            // Save to DB
            await getPrisma().botAccount.create({
                data: {
                    platform: 'NEXTDOOR',
                    username: email,
                    password: password,
                    email: email,
                    proxyUrl: req.proxy,
                    sessionData: cookies,
                    status: 'ACTIVE',
                    latitude: req.latitude,
                    longitude: req.longitude
                }
            });
            this.progress('Success');
            this.log(`✅ Bot Created: ${email}`);
        }
        catch (e) {
            this.log(`❌ Error: ${e.message}`);
            if (this.page)
                await this.capture(this.page);
            throw e;
        }
        finally {
            if (this.browser)
                await this.browser.close();
            if (req.sessionId)
                AccountFactory.instances.delete(req.sessionId);
        }
    }
    async clickButtonByText(text, timeout = 5000, waitForNav = false) {
        if (!this.page)
            return;
        this.log(`🔍 Searching for button-like element with text: "${text}"`);
        try {
            await this.page.waitForFunction((t) => {
                const search = t.toLowerCase();
                const elements = Array.from(document.querySelectorAll('button, div, span, [role="button"]'));
                return elements.some(el => {
                    const textContent = el.innerText?.toLowerCase() || '';
                    return textContent.includes(search) && el.offsetHeight > 0;
                });
            }, { timeout }, text);
            await this.waitWhilePaused();
            await this.page.evaluate((t) => {
                const search = t.toLowerCase();
                const elements = Array.from(document.querySelectorAll('button, div, span, [role="button"]'));
                // Prioritize explicit buttons first
                let btn = elements.find(el => {
                    const textContent = el.innerText?.toLowerCase() || '';
                    return textContent.includes(search) && el.offsetHeight > 0 && (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button');
                });
                if (!btn) {
                    btn = elements.find(el => {
                        const textContent = el.innerText?.toLowerCase() || '';
                        return textContent.includes(search) && el.offsetHeight > 0;
                    });
                }
                if (btn) {
                    const closest = btn.closest('button') || btn.closest('[role="button"]');
                    if (closest)
                        btn = closest;
                    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, text);
            await this.humanDelay(800, 1500); // Wait for scroll
            // Re-calculate coords NOW that scrolling is done
            const coords = await this.page.evaluate((t) => {
                const search = t.toLowerCase();
                const elements = Array.from(document.querySelectorAll('button, div, span, [role="button"]'));
                let btn = elements.find(el => {
                    const textContent = el.innerText?.toLowerCase() || '';
                    return textContent.includes(search) && el.offsetHeight > 0 && (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button');
                });
                if (!btn) {
                    btn = elements.find(el => {
                        const textContent = el.innerText?.toLowerCase() || '';
                        return textContent.includes(search) && el.offsetHeight > 0;
                    });
                }
                if (!btn)
                    return null;
                const closest = btn.closest('button') || btn.closest('[role="button"]');
                if (closest)
                    btn = closest;
                const rect = btn.getBoundingClientRect();
                return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
            }, text);
            if (waitForNav) {
                this.log(`🖱️ Clicking "${text}" (expecting navigation)`);
                await Promise.all([
                    this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {
                        this.log('⚠️ Navigation timeout, but proceeding...');
                    }),
                    coords ? this.humanMoveTo(coords.x, coords.y).then(() => this.page.mouse.click(coords.x, coords.y)) : this.page.evaluate((t) => {
                        const search = t.toLowerCase();
                        const elements = Array.from(document.querySelectorAll('button, div, span, [role="button"]'));
                        const btn = elements.find(el => el.innerText?.toLowerCase().includes(search));
                        if (btn)
                            btn.click();
                    }, text)
                ]);
            }
            else {
                this.log(`🖱️ Clicking "${text}"`);
                if (coords) {
                    await this.humanMoveTo(coords.x, coords.y);
                    await this.page.mouse.click(coords.x, coords.y);
                }
                else {
                    await this.page.evaluate((t) => {
                        const search = t.toLowerCase();
                        const elements = Array.from(document.querySelectorAll('button, div, span, [role="button"]'));
                        const btn = elements.find(el => el.innerText?.toLowerCase().includes(search));
                        if (btn)
                            btn.click();
                    }, text);
                }
            }
        }
        catch (e) {
            this.log(`⚠️ Clickable element "${text}" not found within timeout.`);
            throw e;
        }
    }
    async checkForBotTrap() {
        if (!this.page)
            return;
        const isTrap = await this.page.evaluate(() => {
            const text = document.body.innerText.toLowerCase();
            const words = text.split(/\s+/).filter(w => w === 'word').length;
            // The user saw "word word word word"
            return words > 10 || text.includes('word word word');
        });
        if (isTrap) {
            this.log('🚨 BOT TRAP DETECTED ("word" page). Attempting human recovery...');
            await this.capture(this.page);
            // Simulate human confusion/scrolling
            await this.humanMoveTo(Math.random() * 500, Math.random() * 500);
            await this.page.evaluate(() => window.scrollBy(0, 100));
            await this.humanDelay(2000, 4000);
            await this.page.evaluate(() => window.scrollBy(0, -100));
            this.log('⏸️ Recovery move done. Pausing for manual check.');
            if (!this.isManualControl)
                this.toggleManual();
        }
    }
    async humanNoise(moves = 1, scrolls = 1) {
        if (!this.page)
            return;
        try {
            for (let i = 0; i < moves; i++) {
                const x = Math.floor(Math.random() * 800 + 100);
                const y = Math.floor(Math.random() * 600 + 100);
                await this.humanMoveTo(x, y);
                await new Promise(r => setTimeout(r, Math.random() * 500));
            }
            for (let i = 0; i < scrolls; i++) {
                const delta = Math.floor(Math.random() * 200 - 100);
                await this.page.evaluate((d) => window.scrollBy({ top: d, behavior: 'smooth' }), delta);
                await new Promise(r => setTimeout(r, Math.random() * 800 + 200));
            }
        }
        catch (e) {
            // Noise should never crash the flow
        }
    }
    async humanDelay(min = 500, max = 2000) {
        const delay = Math.floor(Math.random() * (max - min + 1) + min);
        await new Promise(r => setTimeout(r, delay));
    }
    getRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
    currentMouse = { x: 0, y: 0 };
    cubicBezier(t, p0, p1, p2, p3) {
        return (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3;
    }
    async humanMoveTo(targetX, targetY) {
        if (!this.page)
            return;
        const startX = this.currentMouse.x;
        const startY = this.currentMouse.y;
        // Random control points to create a curve
        // Control point 1: somewhere between start and target, with random deviation
        const cp1x = startX + (targetX - startX) * (Math.random() * 0.5 + 0.1) + (Math.random() * 100 - 50);
        const cp1y = startY + (targetY - startY) * (Math.random() * 0.5 + 0.1) + (Math.random() * 100 - 50);
        // Control point 2: closer to target
        const cp2x = startX + (targetX - startX) * (Math.random() * 0.5 + 0.4) + (Math.random() * 100 - 50);
        const cp2y = startY + (targetY - startY) * (Math.random() * 0.5 + 0.4) + (Math.random() * 100 - 50);
        const steps = Math.floor(Math.random() * 30 + 30); // 30-60 steps
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = this.cubicBezier(t, startX, cp1x, cp2x, targetX);
            const y = this.cubicBezier(t, startY, cp1y, cp2y, targetY);
            await this.page.mouse.move(x, y);
            this.currentMouse = { x, y };
            // Variable speed: faster in middle, slower at ends (human-like)
            // Determine wait time based on "velocity" (distance from last point) or just simple easing
            // Simple approach: min delay
            await new Promise(r => setTimeout(r, Math.random() * 2 + 1));
        }
        // Final precise move
        await this.page.mouse.move(targetX, targetY);
        this.currentMouse = { x: targetX, y: targetY };
    }
    async humanScrollTo(selector) {
        if (!this.page)
            return;
        try {
            // Check if element exists
            await this.page.waitForSelector(selector, { timeout: 5000 });
            const box = await this.page.evaluate((s) => {
                const el = document.querySelector(s);
                if (!el)
                    return null;
                const rect = el.getBoundingClientRect();
                return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, top: rect.top, windowY: window.scrollY, windowHeight: window.innerHeight };
            }, selector);
            if (!box)
                return;
            // Calculate goal scroll position (element in middle third of screen)
            // Element absolute Y = box.top + window.scrollY
            // Target Scroll Y = Element Absolute Y - (Window Height / 2)
            const absoluteY = box.top + box.windowY;
            const targetScrollY = Math.max(0, absoluteY - (box.windowHeight / 2) + (Math.random() * 100 - 50));
            const startScrollY = await this.page.evaluate(() => window.scrollY);
            const distance = targetScrollY - startScrollY;
            if (Math.abs(distance) < 50)
                return; // Already visible enough
            // Scroll in chunks
            const chunks = Math.floor(Math.abs(distance) / 100) + 1;
            const baseChunk = distance / chunks;
            for (let i = 0; i < chunks; i++) {
                const chunk = baseChunk + (Math.random() * 40 - 20); // Randomize chunk size
                await this.page.evaluate((y) => window.scrollBy(0, y), chunk);
                await this.humanDelay(50, 150); // Pause between scrolls
                // Occasional "overshoot" or pause
                if (Math.random() < 0.1) {
                    await this.humanDelay(300, 600);
                }
            }
        }
        catch (e) {
            this.log(`⚠️ humanScrollTo failed for ${selector}: ${e}`);
        }
    }
    async humanType(selector, text) {
        if (!this.page)
            return;
        try {
            this.log(`⌨️ [STEALTH] Starting human type for: ${selector} (${text.length} chars)`);
            const startTime = Date.now();
            // 1. Scroll into view naturally
            await this.humanScrollTo(selector);
            await this.humanDelay(300, 600);
            // 2. Move mouse to element - Retry logic for visibility
            let elementBox = null;
            for (let i = 0; i < 3; i++) {
                elementBox = await this.page.evaluate((s) => {
                    const el = document.querySelector(s);
                    if (!el)
                        return null;
                    const rect = el.getBoundingClientRect();
                    return (rect.width > 0 && rect.height > 0) ?
                        { x: rect.left, y: rect.top, width: rect.width, height: rect.height } : null;
                }, selector);
                if (elementBox)
                    break;
                await new Promise(r => setTimeout(r, 500));
            }
            if (elementBox) {
                // Target a random point inside the element
                const targetX = elementBox.x + (Math.random() * (elementBox.width * 0.8)) + (elementBox.width * 0.1);
                const targetY = elementBox.y + (Math.random() * (elementBox.height * 0.8)) + (elementBox.height * 0.1);
                await this.humanMoveTo(targetX, targetY);
                await this.humanDelay(200, 400); // Hover before click
                await this.page.mouse.click(targetX, targetY);
                this.log('🖱️ Clicked input to focus');
            }
            else {
                this.log(`⚠️ precise coords not found for ${selector}, using focus fallback`);
                await this.page.focus(selector);
            }
            await this.humanDelay(800, 1500); // Wait after focus
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                // Random Typo (3% chance)
                if (Math.random() < 0.03 && text.length > 3) {
                    const keys = 'abcdefghijklmnopqrstuvwxyz';
                    const typo = keys[Math.floor(Math.random() * keys.length)];
                    await this.page.keyboard.type(typo);
                    await new Promise(r => setTimeout(r, Math.random() * 400 + 300));
                    await this.page.keyboard.press('Backspace');
                    await new Promise(r => setTimeout(r, Math.random() * 300 + 100));
                }
                await this.page.keyboard.type(char);
                // Very human timing: 180ms to 500ms
                let delay = Math.floor(Math.random() * (500 - 180 + 1) + 180);
                // Longer pause on spaces or special chars
                if (char === ' ' || char === '+' || char === '@' || char === '.') {
                    delay += Math.floor(Math.random() * 1000 + 400);
                    if (Math.random() > 0.4)
                        await this.humanNoise(1, 0);
                }
                // Random "thinking" pause every ~6 chars
                if (i > 0 && i % 6 === 0 && Math.random() > 0.75) {
                    this.log('💭 Thinking pause...');
                    delay += Math.floor(Math.random() * 2000 + 1000);
                    await this.humanNoise(1, 1);
                }
                await new Promise(r => setTimeout(r, delay));
            }
            // 3. Force Validation (Tab out)
            await this.humanDelay(300, 600);
            await this.page.keyboard.press('Tab');
            this.log('⇥ Pressed Tab to trigger validation');
            const duration = (Date.now() - startTime) / 1000;
            this.log(`✅ [STEALTH] Finished typing into ${selector} in ${duration.toFixed(1)}s`);
            await this.humanDelay(1000, 2000); // Settling delay
        }
        catch (e) {
            this.log(`⚠️ Human typing failed on ${selector}: ${e.message}`);
            await this.page.type(selector, text, { delay: 400 }).catch(() => { });
        }
    }
    async clearInput(selector) {
        if (!this.page)
            return;
        try {
            await this.page.click(selector, { clickCount: 3 }); // Select all
            await this.page.keyboard.press('Backspace');
            // Fallback for some OS/sites
            await this.page.focus(selector);
            await this.page.keyboard.down('Meta'); // Command on Mac
            await this.page.keyboard.press('a');
            await this.page.keyboard.up('Meta');
            await this.page.keyboard.press('Backspace');
            this.log(`🧹 Cleared input: ${selector}`);
        }
        catch (e) {
            this.log(`⚠️ Failed to clear input ${selector}: ${e}`);
        }
    }
}
