
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
}

export class AccountFactory {

    // Random American Names for fallback
    private firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
    private lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

    async createBot(req: AccountRequest) {
        // 1. Generate Identity
        const first = req.firstName || this.getRandom(this.firstNames);
        const last = req.lastName || this.getRandom(this.lastNames);
        const randomDigits = Math.floor(Math.random() * 900) + 100;

        // Smart Email Alias: base+first999@gmail.com
        const [user, domain] = req.baseEmail.split('@');
        const email = `${user}+${first.toLowerCase()}${randomDigits}@${domain}`;
        const password = `Pass${Math.random().toString(36).slice(-8)}!`;

        console.log(`🏭 Starting Factory for: ${first} ${last} (${email})`);

        // 2. Prep API
        const smsService = new TextVerifiedService(req.textVerifiedApiKey);

        // 3. Launch with Proxy
        const proxyUrl = new URL(req.proxy);
        const browser = await puppeteer.launch({
            headless: false, // Visible for now
            executablePath: executablePath(),
            args: [
                `--proxy-server=${proxyUrl.hostname}:${proxyUrl.port}`,
                '--no-sandbox'
            ]
        });

        // Use default context for permission overrides if needed
        const context = browser.defaultBrowserContext();
        await context.overridePermissions('https://nextdoor.com', ['geolocation']);

        const page = await browser.newPage();
        await page.authenticate({ username: proxyUrl.username, password: proxyUrl.password });

        // GPS Spoofing to match address (Mitigate Webshare IP mismatch)
        if (req.latitude && req.longitude) {
            await page.setGeolocation({ latitude: req.latitude, longitude: req.longitude });
            console.log(`📍 GPS Spoofed: ${req.latitude}, ${req.longitude}`);
        }

        try {
            // 4. Signup Flow
            console.log('➡️ Navigating to Signup...');
            // Changed from /signup/ (404) to /create-account/
            await page.goto('https://nextdoor.com/create-account/', { waitUntil: 'networkidle2' });

            // Step 1: Email & Password
            console.log('📧 Entering Credentials...');
            await page.waitForSelector('input[aria-label="Email address"]');
            await page.type('input[aria-label="Email address"]', email, { delay: 50 });
            await page.type('input[aria-label="Create a password"]', password, { delay: 50 });

            // Click "Continue"
            await this.clickButtonByText(page, 'Continue');

            // Step 2: Name (If present)
            try {
                console.log('👤 Checking for Name fields...');
                // Short timeout as this step might be skipped
                await page.waitForSelector('input[aria-label="First name"]', { timeout: 5000 });
                await page.type('input[aria-label="First name"]', first, { delay: 50 });
                await page.type('input[aria-label="Last name"]', last, { delay: 50 });
                await this.clickButtonByText(page, 'Continue');
            } catch (e) {
                console.log('ℹ️ Name step skipped or not found (proceeding).');
            }

            // Step 3: Address
            console.log('🏠 Handling Address...');
            await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => { });

            // Handle "Type address instead" if Geolocation prompt appears
            try {
                await this.clickButtonByText(page, 'Type address instead', 3000);
            } catch {
                console.log('ℹ️ "Type address instead" button not found, assuming direct input.');
            }

            // Fill Address (Manually)
            const address = req.address || "9012 Grand Bayou Ct, Tampa, FL 33635";

            // Wait for street address input via aria-label
            await page.waitForSelector('input[aria-label="Street address"]');
            await page.type('input[aria-label="Street address"]', address, { delay: 50 });

            // Wait for dropdown suggestion
            const streetPart = address.split(',')[0]; // "9012 Grand Bayou Ct"
            console.log(`Waiting for address suggestion matching: ${streetPart}`);

            await page.waitForFunction((text) => {
                const els = Array.from(document.querySelectorAll('div[role="button"]'));
                return els.some(el => (el as HTMLElement).innerText.includes(text));
            }, {}, streetPart);

            // Click the suggestion
            await page.evaluate((text) => {
                const els = Array.from(document.querySelectorAll('div[role="button"]'));
                const suggestion = els.find(el => (el as HTMLElement).innerText.includes(text));
                if (suggestion) (suggestion as HTMLElement).click();
            }, streetPart);

            // Click Continue after address
            await new Promise(r => setTimeout(r, 1000)); // Stability wait
            await this.clickButtonByText(page, 'Continue');

            // Step 4: Hybrid Verification Check
            console.log('🤔 Checking next step: Phone Verify OR Direct Success...');

            // Race condition: Phone input vs Feed
            const verifySelector = 'input[aria-label="Mobile number"]';
            const feedSelector = 'div[data-testid="feed-container"], a[href="/news_feed/"]'; // Typical feed markers

            const result = await Promise.race([
                page.waitForSelector(verifySelector, { visible: true }).then(() => 'PHONE'),
                // page.waitForSelector(feedSelector, { visible: true }).then(() => 'SUCCESS'), // Disabled feed check for now to ensure we don't false positive if feed loads under modal
                // Actually, if we see feed, we ARE good.
                new Promise(resolve => setTimeout(() => resolve('TIMEOUT'), 15000))
            ]);

            if (result === 'SUCCESS') {
                console.log('🎉 AMAZING! GPS Spoofing worked. No Phone Verification needed.');
            } else if (result === 'PHONE' || result === 'TIMEOUT') {
                // If timeout, we assume it might be loading slow or asking for phone. 
                // We'll check again or just proceed to try phone logic if input exists.

                if (result === 'TIMEOUT') {
                    // Check if phone input is there now?
                    const hasPhone = await page.$(verifySelector);
                    if (!hasPhone) {
                        console.log('⚠️ Timeout and no phone input. Checking for success indicators...');
                        // Assuming success if no blockers
                    } else {
                        console.log('📱 Phone Verify appeared late.');
                    }
                }

                if (await page.$(verifySelector)) {
                    console.log('📱 Phone Verification required. Proceeding with TextVerified...');

                    // A. Request Number
                    console.log('📡 Requesting SMS Number...');
                    const verification = await smsService.createVerification();
                    console.log(`📡 Clean Number Acquired: ${verification.number}`);

                    // B. Input Number
                    await page.type('input[aria-label="Mobile number"]', verification.number, { delay: 50 });
                    await this.clickButtonByText(page, 'Text me a code');

                    // C. Poll for Code
                    console.log('⏳ Waiting for SMS Code...');
                    let code: string | undefined;
                    // Poll for 90 seconds
                    for (let i = 0; i < 30; i++) {
                        await new Promise(r => setTimeout(r, 3000));
                        const status = await smsService.getVerification(verification.id);
                        console.log(`   Poll Status: ${status.state}`);

                        if (status.sms?.code) {
                            code = status.sms.code;
                            console.log(`✅ Code Received: ${code}`);
                            break;
                        }

                        if (status.state === 'verificationTimedOut' || status.state === 'cancelled') {
                            throw new Error("SMS Verification Timed Out/Cancelled");
                        }
                    }

                    if (!code) throw new Error("SMS Timeout (No code received)");

                    // D. Enter Code
                    console.log(`⌨️ Entering Code: ${code}`);
                    const codeInputSelector = 'input[aria-label="Verification code"], input[name="code"], input[autocomplete="one-time-code"]';
                    try {
                        await page.waitForSelector(codeInputSelector, { timeout: 10000 });
                        await page.type(codeInputSelector, code, { delay: 100 });
                    } catch {
                        console.log('⚠️ Could not find specific code input, typing into first visible input.');
                        await page.keyboard.type(code);
                    }

                    // E. Submit
                    await new Promise(r => setTimeout(r, 500));
                    await this.clickButtonByText(page, 'Verify', 5000)
                        .catch(() => this.clickButtonByText(page, 'Submit', 5000))
                        .catch(() => this.clickButtonByText(page, 'Continue', 5000));
                }
            }

            // 6. Success -> Export
            await new Promise(r => setTimeout(r, 3000)); // Wait for final settle
            const cookies = await page.cookies();

            // Save to DB
            await prisma.botAccount.create({
                data: {
                    platform: 'NEXTDOOR',
                    username: email,
                    password: password,
                    email: email,
                    proxyUrl: req.proxy,
                    sessionData: cookies as any,
                    status: 'ACTIVE'
                }
            });

            console.log(`✅ Bot Created: ${email}`);

        } catch (e) {
            console.error(`❌ Factory Failed: ${e}`);
            throw e;
        } finally {
            await browser.close();
        }
    }

    private async clickButtonByText(page: any, text: string, timeout = 5000) {
        try {
            await page.waitForFunction((t: string) => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.some(b => (b as HTMLElement).innerText.includes(t));
            }, { timeout }, text);

            await page.evaluate((t: string) => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const btn = buttons.find(b => (b as HTMLElement).innerText.includes(t));
                if (btn) (btn as HTMLElement).click();
            }, text);
        } catch (e) {
            console.log(`⚠️ Button "${text}" not found within timeout.`);
            throw e;
        }
    }

    private getRandom(arr: string[]) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
}
