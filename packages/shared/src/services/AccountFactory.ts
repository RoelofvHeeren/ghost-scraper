
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer';
import { PrismaClient } from '@prisma/client';
import { TextVerifiedService } from './TextVerifiedService.js';

puppeteer.use(StealthPlugin());
let prismaInstance: PrismaClient | null = null;
function getPrisma() {
    if (!prismaInstance) prismaInstance = new PrismaClient();
    return prismaInstance;
}
console.log('[BACKEND] AccountFactory module loaded');

interface AccountRequest {
    proxy: string;
    baseEmail: string;
    firstName?: string;
    lastName?: string;
    textVerifiedApiKey: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    password?: string;
}

interface CreateOptions {
    onProgress?: (stage: string) => void;
    onLog?: (message: string) => void;
    onScreenshot?: (base64: string) => void;
    onManualState?: (paused: boolean) => void;
}

export class AccountFactory {
    private page: any | null = null;
    private browser: any | null = null;
    private static instances = new Map<string, AccountFactory>();

    public static getInstance(sessionId: string): AccountFactory | undefined {
        return this.instances.get(sessionId);
    }

    private options?: CreateOptions;
    private currentStepName: string = 'Initializing';
    private isManualControl: boolean = false;

    private log(msg: string) {
        console.log(msg);
        this.options?.onLog?.(msg);
    }

    private progress(stage: string) {
        this.currentStepName = stage;
        this.options?.onProgress?.(stage);
        this.log(`➡️ Stage: ${stage}`);
    }

    private async capture(page: any) {
        if (this.options?.onScreenshot) {
            try {
                const b64 = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 50 });
                this.options.onScreenshot(`data:image/jpeg;base64,${b64}`);
            } catch (e) {
                // Ignore screenshot errors
            }
        }
    }

    private async waitWhilePaused() {
        while (this.isManualControl) {
            await new Promise(r => setTimeout(r, 1000));
            await this.capture(this.page);
        }
    }

    public toggleManual() {
        this.isManualControl = !this.isManualControl;
        this.log(this.isManualControl ? '⏸️ Automation Paused (Manual Override)' : '▶️ Automation Resumed');
        this.options?.onManualState?.(this.isManualControl);
    }

    public async handleRemoteClick(x: number, y: number) {
        if (this.page) {
            this.log(`🖱️ Executing remote click: ${x}, ${y}`);

            // Try to identify the element before clicking
            try {
                const elementInfo = await this.page.evaluate((ex: number, ey: number) => {
                    const el = document.elementFromPoint(ex, ey) as HTMLElement;
                    if (!el) return null;

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

                            await (getPrisma() as any).learnedSelector.upsert({
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
                        } catch (dbError) {
                            this.log(`⚠️ Selector Recording Failed: ${dbError}`);
                        }
                    }
                }
            } catch (e) {
                // Silently fail element identification
            }

            await this.page.mouse.click(x, y);
            // Capture screenshot after click to show result
            await this.capture(this.page);
        }
    }

    public async handleRemoteScroll(deltaY: number) {
        if (this.page) {
            await this.page.evaluate((dy: number) => {
                window.scrollBy(0, dy);
            }, deltaY);
            await this.capture(this.page);
        }
    }

    public async handleRemoteKey(key: string) {
        if (this.page) {
            this.log(`⌨️ Remote key: ${key}`);
            try {
                if (key === 'Backspace') await this.page.keyboard.press('Backspace');
                else if (key === 'Enter') await this.page.keyboard.press('Enter');
                else if (key === 'Tab') await this.page.keyboard.press('Tab');
                else if (key === 'Escape') await this.page.keyboard.press('Escape');
                else if (key === 'ArrowUp') await this.page.keyboard.press('ArrowUp');
                else if (key === 'ArrowDown') await this.page.keyboard.press('ArrowDown');
                else if (key === 'ArrowLeft') await this.page.keyboard.press('ArrowLeft');
                else if (key === 'ArrowRight') await this.page.keyboard.press('ArrowRight');
                else if (key.length === 1) {
                    await this.page.keyboard.type(key, { delay: 10 });
                }
                await this.capture(this.page);
            } catch (e: any) {
                this.log(`⚠️ Remote key failed: ${e.message}`);
            }
        }
    }

    private async findLearnedSelector(stepName: string) {
        try {
            return await (getPrisma() as any).learnedSelector.findFirst({
                where: {
                    platform: 'NEXTDOOR',
                    stepName: stepName
                },
                orderBy: {
                    hitCount: 'desc'
                }
            });
        } catch {
            return null;
        }
    }

    private async smartClick(defaultText: string, timeout = 5000, waitForNav = false) {
        if (!this.page) return;

        const learned = await this.findLearnedSelector(`${this.currentStepName} - ${defaultText}`);
        if (learned) {
            this.log(`🤖 Mimicking learned action: [${learned.type}="${learned.selector}"]`);
            try {
                let selector = '';
                if (learned.type === 'aria-label') selector = `[aria-label="${learned.selector}"]`;
                else if (learned.type === 'placeholder') selector = `[placeholder="${learned.selector}"]`;
                else if (learned.type === 'id') selector = learned.selector;
                else if (learned.type === 'css') selector = learned.selector;

                if (selector) {
                    await this.page.waitForSelector(selector, { timeout: 3000 });
                    await this.waitWhilePaused();
                    await this.page.evaluate((s: string) => {
                        const el = document.querySelector(s);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, selector);

                    await this.humanNoise(1, 2);

                    if (waitForNav) {
                        await Promise.all([
                            this.page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => { }),
                            this.page.click(selector)
                        ]);
                    } else {
                        await this.page.click(selector);
                    }
                    return;
                } else if (learned.type === 'text') {
                    await this.clickButtonByText(learned.selector, 3000, waitForNav);
                    return;
                }
            } catch (e: any) {
                this.log(`⚠️ Learned action failed, falling back: ${e.message}`);
            }
        }

        await this.clickButtonByText(defaultText, timeout, waitForNav);
    }

    // Random American Names for fallback
    private firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
    private lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

    async createBot(req: AccountRequest & { sessionId?: string }, options?: CreateOptions) {
        this.options = options;
        this.log(`🚀 [BACKEND] createBot started for session: ${req.sessionId}`);

        if (req.sessionId) {
            AccountFactory.instances.set(req.sessionId, this);
        }

        try {
            // 1. Generate Identity
            this.progress('Generating Identity');
            this.log('📝 [DEBUG] Step 1: Generating identity data');
            const first = (req.firstName || this.getRandom(this.firstNames)) as string;
            const last = (req.lastName || this.getRandom(this.lastNames)) as string;
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

            const proxyUrl = new URL(req.proxy);

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

            // GPS Spoofing & Timezone Hardening
            if (req.latitude && req.longitude) {
                await this.page.setGeolocation({ latitude: req.latitude, longitude: req.longitude });
                await this.page.emulateTimezone('America/New_York').catch(() => { });
                this.log(`📍 GPS & Timezone Spoofed: ${req.latitude}, ${req.longitude}`);
            }

            // WebRTC Blocking
            await this.page.evaluateOnNewDocument(() => {
                // @ts-ignore
                delete window.navigator.rtcPeerConnection;
                // @ts-ignore
                delete window.navigator.rtcIceGatherer;
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
            await this.humanType('input[aria-label="Create a password"]', password);
            await this.capture(this.page);

            this.log('🚀 Clicking Continue...');
            // Wait for the email input to DISAPPEAR after clicking
            const emailSelector = 'input[aria-label="Email address"]';
            await this.smartClick('Continue', 8000, false);

            this.log('⏳ Waiting for Email field to disappear (Page Switch)...');
            try {
                await this.page.waitForFunction((sel: string) => !document.querySelector(sel), { timeout: 10000 }, emailSelector);
            } catch (e) {
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
                } else {
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
            } catch (e) {
                this.log('ℹ️ Name step skipped or not found.');
            }

            // Step 3: Address
            this.progress('Handling Address');
            await this.page.waitForSelector('input[aria-label="Street address"]', { timeout: 15000 });

            try {
                await this.smartClick('Type address instead', 3000);
            } catch {
                this.log('ℹ️ Assuming direct input.');
            }

            const addressStr = req.address || "9012 Grand Bayou Ct, Tampa, FL 33635";
            await this.page.waitForSelector('input[aria-label="Street address"]');

            this.log(`🏠 Human-typing address: ${addressStr}`);
            await this.waitWhilePaused();
            await this.humanType('input[aria-label="Street address"]', addressStr);
            await this.humanNoise(1, 2);
            await this.capture(this.page);

            const streetPart = addressStr.split(',')[0];
            this.log(`⏳ Waiting for suggestion matching: "${streetPart}"`);
            await this.page.waitForFunction((text: string) => {
                const els = Array.from(document.querySelectorAll('div[role="button"], li[role="option"]'));
                return els.some(el => (el as HTMLElement).innerText.includes(text));
            }, { timeout: 10000 }, streetPart);

            await this.humanNoise(1, 2);

            await this.page.evaluate((text: string) => {
                const els = Array.from(document.querySelectorAll('div[role="button"], li[role="option"]'));
                const suggestion = els.find(el => (el as HTMLElement).innerText.includes(text)) as HTMLElement;
                if (suggestion) {
                    suggestion.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // We'll click it normally via mouse to simulate human movement
                    const rect = suggestion.getBoundingClientRect();
                    (window as any).__targetCoords = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
                }
            }, streetPart);

            const coords = await this.page.evaluate(() => (window as any).__targetCoords);
            if (coords) {
                this.log(`🖱️ Moving mouse to suggestion: ${coords.x}, ${coords.y}`);
                await this.page.mouse.move(coords.x, coords.y, { steps: 10 });
                await this.humanDelay(300, 800);
                await this.page.mouse.click(coords.x, coords.y);
            } else {
                this.log('⚠️ Could not map suggestion coordinates, falling back to evaluate click.');
                await this.page.evaluate((text: string) => {
                    const els = Array.from(document.querySelectorAll('div[role="button"], li[role="option"]'));
                    const suggestion = els.find(el => (el as HTMLElement).innerText.includes(text));
                    if (suggestion) (suggestion as HTMLElement).click();
                }, streetPart);
            }

            await new Promise(r => setTimeout(r, 1000));
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
                } else {
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
                if (await this.page.$(verifySelector)) { verificationAction = 'PHONE'; break; }
                const gpsButtonFound = await this.page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    return buttons.some(b => b.innerText.toLowerCase().includes('current address') || b.innerText.toLowerCase().includes('verify location'));
                });
                if (gpsButtonFound) { verificationAction = 'GPS_BUTTON'; break; }
                if (this.page.url().includes('news_feed') || await this.page.$('div[data-testid="feed-container"]')) { verificationAction = 'SUCCESS'; break; }
            }

            if (verificationAction === 'SUCCESS') {
                this.log('🎉 Auto-verified by address match.');
            } else if (verificationAction === 'GPS_BUTTON') {
                this.log('📍 GPS Verification button found! Clicking...');
                await this.page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const btn = buttons.find(b => b.innerText.toLowerCase().includes('current address') || b.innerText.toLowerCase().includes('verify location'));
                    if (btn) (btn as HTMLElement).click();
                });
                this.log('🎉 Clicked Address Verification. Assuming success.');
            } else if (verificationAction === 'PHONE') {
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
                let code: string | undefined;
                for (let i = 0; i < 30; i++) {
                    await new Promise(r => setTimeout(r, 3000));
                    const status = await smsService.getVerification(verification.id);
                    this.log(`   Poll Status: ${status.state}`);
                    if (status.sms?.code) { code = status.sms.code; break; }
                    if (status.state === 'verificationTimedOut' || status.state === 'cancelled') { throw new Error("SMS Verification Timed Out/Cancelled"); }
                }

                if (!code) throw new Error("SMS Timeout (No code received)");

                // D. Enter Code
                this.progress('Entering Verification Code');
                this.log(`⌨️ Entering Code: ${code}`);
                const codeInputSelector = 'input[aria-label="Verification code"], input[name="code"], input[autocomplete="one-time-code"]';
                try {
                    await this.page.waitForSelector(codeInputSelector, { timeout: 10000 });
                    await this.page.type(codeInputSelector, code, { delay: 100 });
                    await this.capture(this.page);
                } catch {
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
                    sessionData: cookies as any,
                    status: 'ACTIVE',
                    latitude: req.latitude,
                    longitude: req.longitude
                }
            });

            this.progress('Success');
            this.log(`✅ Bot Created: ${email}`);

        } catch (e: any) {
            this.log(`❌ Error: ${e.message}`);
            if (this.page) await this.capture(this.page);
            throw e;
        } finally {
            if (this.browser) await this.browser.close();
            if (req.sessionId) AccountFactory.instances.delete(req.sessionId);
        }
    }

    private async clickButtonByText(text: string, timeout = 5000, waitForNav = false) {
        if (!this.page) return;
        try {
            await this.page.waitForFunction((t: string) => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.some(b => (b as HTMLElement).innerText.toLowerCase().includes(t.toLowerCase()));
            }, { timeout }, text);

            await this.waitWhilePaused();
            await this.page.evaluate((t: string) => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const btn = buttons.find(b => (b as HTMLElement).innerText.toLowerCase().includes(t.toLowerCase()));
                if (btn) {
                    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, text);

            await this.humanDelay(500, 1500);

            if (waitForNav) {
                await Promise.all([
                    this.page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => { }),
                    this.page.evaluate((t: string) => {
                        const buttons = Array.from(document.querySelectorAll('button'));
                        const btn = buttons.find(b => (b as HTMLElement).innerText.toLowerCase().includes(t.toLowerCase()));
                        if (btn) (btn as HTMLElement).click();
                    }, text)
                ]);
            } else {
                await this.page.evaluate((t: string) => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const btn = buttons.find(b => (b as HTMLElement).innerText.toLowerCase().includes(t.toLowerCase()));
                    if (btn) (btn as HTMLElement).click();
                }, text);
            }
        } catch (e) {
            this.log(`⚠️ Button "${text}" not found within timeout.`);
            throw e;
        }
    }

    private async checkForBotTrap() {
        if (!this.page) return;
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
            await this.page.mouse.move(Math.random() * 500, Math.random() * 500);
            await this.page.evaluate(() => window.scrollBy(0, 100));
            await this.humanDelay(2000, 4000);
            await this.page.evaluate(() => window.scrollBy(0, -100));
            this.log('⏸️ Recovery move done. Pausing for manual check.');
            if (!this.isManualControl) this.toggleManual();
        }
    }

    private async humanNoise(moves = 1, scrolls = 1) {
        if (!this.page) return;
        try {
            for (let i = 0; i < moves; i++) {
                const x = Math.floor(Math.random() * 800 + 100);
                const y = Math.floor(Math.random() * 600 + 100);
                await this.page.mouse.move(x, y, { steps: Math.floor(Math.random() * 10 + 5) });
                await new Promise(r => setTimeout(r, Math.random() * 500));
            }
            for (let i = 0; i < scrolls; i++) {
                const delta = Math.floor(Math.random() * 200 - 100);
                await this.page.evaluate((d: number) => window.scrollBy({ top: d, behavior: 'smooth' }), delta);
                await new Promise(r => setTimeout(r, Math.random() * 800 + 200));
            }
        } catch (e) {
            // Noise should never crash the flow
        }
    }

    private async humanDelay(min = 500, max = 2000) {
        const delay = Math.floor(Math.random() * (max - min + 1) + min);
        await new Promise(r => setTimeout(r, delay));
    }

    private getRandom(arr: string[]) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    private async humanType(selector: string, text: string) {
        if (!this.page) return;
        try {
            await this.page.focus(selector);
            await this.humanDelay(600, 1200); // Wait before starting

            for (let i = 0; i < text.length; i++) {
                const char = text[i];

                // Random Typo (2% chance)
                if (Math.random() < 0.02 && text.length > 3) {
                    const keys = 'abcdefghijklmnopqrstuvwxyz';
                    const typo = keys[Math.floor(Math.random() * keys.length)];
                    await this.page.keyboard.type(typo);
                    await new Promise(r => setTimeout(r, Math.random() * 300 + 200));
                    await this.page.keyboard.press('Backspace');
                    await new Promise(r => setTimeout(r, Math.random() * 200 + 100));
                }

                await this.page.keyboard.type(char);

                // Very human timing: 150ms to 450ms
                let delay = Math.floor(Math.random() * (450 - 150 + 1) + 150);

                // Longer pause on spaces or special chars
                if (char === ' ' || char === '+' || char === '@' || char === '.') {
                    delay += Math.floor(Math.random() * 800 + 300);
                    // Might move mouse during a long pause
                    if (Math.random() > 0.5) await this.humanNoise(1, 0);
                }

                // Random "thinking" pause
                if (i % 7 === 0 && Math.random() > 0.8) {
                    delay += Math.floor(Math.random() * 1500 + 500);
                    await this.humanNoise(0, 1);
                }

                await new Promise(r => setTimeout(r, delay));
            }
            await this.humanDelay(800, 1500); // Settling delay
        } catch (e: any) {
            this.log(`⚠️ Human typing failed on ${selector}: ${e.message}`);
            await this.page.type(selector, text, { delay: 300 }).catch(() => { });
        }
    }
}
