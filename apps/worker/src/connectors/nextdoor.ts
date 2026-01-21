import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import { Page, Browser, BrowserContext } from "playwright";

chromium.use(stealthPlugin());

export class NextdoorConnector {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;

    async init(sessionData?: any) {
        this.browser = await chromium.launch({
            headless: process.env.NEXTDOOR_HEADLESS !== "false",
        });

        this.context = await this.browser.newContext();

        if (sessionData) {
            // sessionData should hold cookies and localStorage (storageState)
            // If it's pure cookies:
            if (sessionData.cookies) {
                await this.context.addCookies(sessionData.cookies);
            }
            // If it is full storageState:
            // this.context = await this.browser.newContext({ storageState: sessionData });
        }

        this.page = await this.context.newPage();
    }

    async close() {
        await this.browser?.close();
    }

    async getSessionData(): Promise<any> {
        if (!this.context) return null;
        const cookies = await this.context.cookies();
        // We could also grab localStorage if needed
        return { cookies };
    }

    async login(username: string, password: string): Promise<boolean> {
        if (!this.page) throw new Error("Page not initialized");

        try {
            await this.page.goto("https://nextdoor.com/login");
            // TODO: Implement login logic
            // Check if already logged in (cookies worked)
            if (await this.page.isVisible('a[href="/news_feed"]')) {
                return true;
            }

            // Perform login
            await this.page.fill('input[id*="email"]', username);
            await this.page.fill('input[id*="password"]', password);
            await this.page.click('button[id*="signin_button"]');

            await this.page.waitForURL("**/news_feed", { timeout: 15000 });
            return true;
        } catch (e) {
            console.error("Login failed", e);
            return false;
        }
    }

    async getFeed(): Promise<any[]> {
        // TODO: Implement feed scraping
        return [];
    }
}
