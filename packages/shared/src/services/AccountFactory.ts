
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer';
import { PrismaClient } from '@prisma/client';
import { TextVerifiedService } from './TextVerifiedService.js';

puppeteer.use(StealthPlugin());
const prisma = new PrismaClient(); // Should reuse global instance in real app

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

    public async handleRemoteClick(x: number, y: number) {
        if (this.page) {
            this.log(`🖱️ Remote Click Received: ${x}, ${y}`);

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

                            await (prisma as any).learnedSelector.upsert({
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

    private async findLearnedSelector(stepName: string) {
        try {
            return await (prisma as any).learnedSelector.findFirst({
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

    private async smartClick(defaultText: string, timeout = 5000) {
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
                    await this.page.click(selector);
                    return;
                } else if (learned.type === 'text') {
                    await this.clickButtonByText(learned.selector, 3000);
                    return;
                }
            } catch (e: any) {
                this.log(`⚠️ Learned action failed, falling back: ${e.message}`);
            }
        }

        await this.clickButtonByText(defaultText, timeout);
    }

    // Random American Names for fallback
    private firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
    private lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

    async createBot(req: AccountRequest & { sessionId?: string }, options?: CreateOptions) {
        this.options = options;
        if (req.sessionId) {
            AccountFactory.instances.set(req.sessionId, this);
        }

        // 1. Generate Identity
        this.progress('Generating Identity');
        const first = req.firstName || this.getRandom(this.firstNames);
        const last = req.lastName || this.getRandom(this.lastNames);
        const randomDigits = Math.floor(Math.random() * 900) + 100;

        // Smart Email Alias: base+first999@gmail.com
        const [user, domain] = req.baseEmail.split('@');
        const email = `${user}+${first.toLowerCase()}${randomDigits}@${domain}`;
        const password = req.password || `Pass${Math.random().toString(36).slice(-8)}!`;

        this.log(`🏭 Starting Factory for: ${first} ${last} (${email})`);

        // 2. Prep API
        const smsService = new TextVerifiedService(req.textVerifiedApiKey);

        // 3. Launch with Proxy
        this.progress('Launching Browser');
        const proxyUrl = new URL(req.proxy);
        this.browser = await puppeteer.launch({
            headless: process.env.NODE_ENV !== 'development', // Default to headless unless strictly development
            executablePath: executablePath(),
            args: [
                `--proxy-server=${proxyUrl.hostname}:${proxyUrl.port}`,
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--lang=en-US'
            ]
        });

        // Use default context for permission overrides if needed
        const context = this.browser.defaultBrowserContext();
        await context.overridePermissions('https://nextdoor.com', ['geolocation']);

        this.page = await this.browser.newPage();
        await this.page.authenticate({ username: proxyUrl.username, password: proxyUrl.password });

        // GPS Spoofing & Timezone Hardening
        if (req.latitude && req.longitude) {
            await this.page.setGeolocation({ latitude: req.latitude, longitude: req.longitude });
            // Default to East Coast/Tampa if not specialized
            await this.page.emulateTimezone('America/New_York').catch(() => { });
            this.log(`📍 GPS & Timezone Spoofed: ${req.latitude}, ${req.longitude} (America/New_York)`);
        }

        // WebRTC Blocking (Prevent IP leakage)
        await this.page.evaluateOnNewDocument(() => {
            // @ts-ignore
            delete window.navigator.rtcPeerConnection;
            // @ts-ignore
            delete window.navigator.rtcIceGatherer;
        });

        try {
            // 4. Signup Flow
            this.progress('Navigating to Signup');
            await this.humanDelay(1000, 3000);
            await this.page.goto('https://nextdoor.com/create-account/', { waitUntil: 'networkidle2' });
            await this.capture(this.page);

            // Step 1: Email & Password
            this.progress('Entering Credentials');
            await this.page.waitForSelector('input[aria-label="Email address"]', { timeout: 15000 });
            await this.page.type('input[aria-label="Email address"]', email, { delay: 50 });
            await this.page.type('input[aria-label="Create a password"]', password, { delay: 50 });
            await this.capture(this.page);

            // Click "Continue"
            await this.smartClick('Continue');

            // Step 2: Name (If present)
            try {
                this.progress('Checking for Name Fields');
                // Wait for either the name field OR the address field to appear
                await Promise.race([
                    this.page.waitForSelector('input[aria-label="First name"]', { timeout: 8000 }),
                    this.page.waitForSelector('input[aria-label="Street address"]', { timeout: 8000 })
                ]);

                if (await this.page.$('input[aria-label="First name"]')) {
                    await this.page.type('input[aria-label="First name"]', first, { delay: 50 });
                    await this.page.type('input[aria-label="Last name"]', last, { delay: 50 });
                    await this.capture(this.page);
                    await this.smartClick('Continue');
                }
            } catch (e) {
                this.log('ℹ️ Name step skipped or not found (proceeding).');
            }

            // Step 3: Address
            this.progress('Handling Address');
            // Wait for address input to be definitely visible
            await this.page.waitForSelector('input[aria-label="Street address"]', { timeout: 15000 });

            // Handle "Type address instead" if Geolocation prompt appears
            try {
                await this.smartClick('Type address instead', 3000);
            } catch {
                this.log('ℹ️ "Type address instead" button not found, assuming direct input.');
            }

            // Fill Address (Manually)
            const address = req.address || "9012 Grand Bayou Ct, Tampa, FL 33635";

            // Wait for street address input via aria-label
            await this.page.waitForSelector('input[aria-label="Street address"]');
            await this.page.type('input[aria-label="Street address"]', address, { delay: 50 });
            await this.capture(this.page);

            // Wait for dropdown suggestion
            const streetPart = address.split(',')[0]; // "9012 Grand Bayou Ct"
            this.log(`Waiting for address suggestion matching: ${streetPart}`);

            await this.page.waitForFunction((text: string) => {
                const els = Array.from(document.querySelectorAll('div[role="button"]'));
                return els.some(el => (el as HTMLElement).innerText.includes(text));
            }, {}, streetPart);

            // Click the suggestion
            await this.page.evaluate((text: string) => {
                const els = Array.from(document.querySelectorAll('div[role="button"]'));
                const suggestion = els.find(el => (el as HTMLElement).innerText.includes(text));
                if (suggestion) (suggestion as HTMLElement).click();
            }, streetPart);

            // Click Continue after address
            await new Promise(r => setTimeout(r, 1000)); // Stability wait
            await this.clickButtonByText('Continue');

            // Step 4: Hybrid Verification Check
            this.progress('Verifying Account');
            this.log('🤔 Checking next step: Phone, GPS Verify, or Success...');
            await this.capture(this.page);

            const verifySelector = 'input[aria-label="Mobile number"]';
            // Button often says "Verify with current address" or similar
            // We'll perform a text search for buttons

            let verificationAction = 'WAIT';
            let retries = 0;

            while (verificationAction === 'WAIT' && retries < 20) {
                await new Promise(r => setTimeout(r, 1000));
                retries++;

                // 1. Check for Phone Input
                if (await this.page.$(verifySelector)) {
                    verificationAction = 'PHONE';
                    break;
                }

                // 2. Check for "Verify with current address" specific button
                const gpsButtonFound = await this.page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    return buttons.some(b =>
                        b.innerText.toLowerCase().includes('current address') ||
                        b.innerText.toLowerCase().includes('verify location')
                    );
                });

                if (gpsButtonFound) {
                    verificationAction = 'GPS_BUTTON';
                    break;
                }

                // 3. Check for Feed (Success)
                // If url contains 'news_feed' or we see feed container
                if (this.page.url().includes('news_feed') || await this.page.$('div[data-testid="feed-container"]')) {
                    verificationAction = 'SUCCESS';
                    break;
                }
            }

            if (verificationAction === 'SUCCESS') {
                this.log('🎉 AMAZING! Auto-verified by address match.');
            }
            else if (verificationAction === 'GPS_BUTTON') {
                this.log('📍 "Verify with current address" button found! Clicking it...');
                // Click the button that contains "current address" or "verify location"
                await this.page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const btn = buttons.find(b =>
                        b.innerText.toLowerCase().includes('current address') ||
                        b.innerText.toLowerCase().includes('verify location')
                    );
                    if (btn) (btn as HTMLElement).click();
                });
                this.log('🎉 Clicked Address Verification. Assuming success.');
            }
            else if (verificationAction === 'TIMEOUT') {
                this.log('⚠️ Timeline expired. No obvious next step found. Checking one last time...');
                await this.capture(this.page);
            }

            // Only do SMS if explicitly PHONE
            if (verificationAction === 'PHONE') {
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
                // Poll for 90 seconds
                for (let i = 0; i < 30; i++) {
                    await new Promise(r => setTimeout(r, 3000));
                    const status = await smsService.getVerification(verification.id);
                    this.log(`   Poll Status: ${status.state}`);

                    if (status.sms?.code) {
                        code = status.sms.code;
                        this.log(`✅ Code Received: ${code}`);
                        break;
                    }

                    if (status.state === 'verificationTimedOut' || status.state === 'cancelled') {
                        throw new Error("SMS Verification Timed Out/Cancelled");
                    }
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
                await this.smartClick('Verify', 5000)
                    .catch(() => this.smartClick('Submit', 5000))
                    .catch(() => this.smartClick('Continue', 5000));
            }

            // 6. Success -> Export
            this.progress('Finalizing Account');
            await new Promise(r => setTimeout(r, 3000)); // Wait for final settle
            const cookies = await this.page.cookies();
            await this.capture(this.page);

            // Save to DB
            await prisma.botAccount.create({
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

        } catch (e) {
            console.error(`❌ Factory Failed: ${e}`);
            this.log(`❌ Error: ${e}`);
            if (this.page) await this.capture(this.page); // Final screenshot on fail
            throw e;
        } finally {
            if (this.browser) await this.browser.close();
            if (req.sessionId) {
                AccountFactory.instances.delete(req.sessionId);
            }
        }
    }

    private async clickButtonByText(text: string, timeout = 5000) {
        if (!this.page) return;
        try {
            await this.page.waitForFunction((t: string) => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.some(b => (b as HTMLElement).innerText.includes(t));
            }, { timeout }, text);

            await this.page.evaluate((t: string) => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const btn = buttons.find(b => (b as HTMLElement).innerText.includes(t));
                if (btn) (btn as HTMLElement).click();
            }, text);
        } catch (e) {
            this.log(`⚠️ Button "${text}" not found within timeout.`);
            throw e;
        }
    }

    private async humanDelay(min = 500, max = 2000) {
        const delay = Math.floor(Math.random() * (max - min + 1) + min);
        await new Promise(r => setTimeout(r, delay));
    }

    private getRandom(arr: string[]) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
}
