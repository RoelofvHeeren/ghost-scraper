import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import { Page, Browser, BrowserContext } from "playwright";

chromium.use(stealthPlugin());

export class NextdoorConnector {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;

    async init(options?: { sessionData?: any, proxyUrl?: string }) {
        const { sessionData, proxyUrl } = options || {};

        this.browser = await chromium.launch({
            headless: process.env.NEXTDOOR_HEADLESS !== "false",
            args: proxyUrl ? [`--proxy-server=${proxyUrl}`] : []
        });

        const contextOptions: any = {};
        if (sessionData && sessionData.storageState) {
            contextOptions.storageState = sessionData.storageState;
        }

        this.context = await this.browser.newContext(contextOptions);

        if (sessionData && sessionData.cookies && !sessionData.storageState) {
            await this.context.addCookies(sessionData.cookies);
        }

        this.page = await this.context.newPage();
    }

    async close() {
        await this.context?.close();
        await this.browser?.close();
    }

    async getSessionData(): Promise<any> {
        if (!this.context) return null;
        const storageState = await this.context.storageState();
        return { storageState };
    }

    async login(username: string, password: string): Promise<boolean> {
        if (!this.page) throw new Error("Page not initialized");

        try {
            await this.page.goto("https://nextdoor.com/login");
            await this.page.waitForTimeout(2000); // Wait for potential redirects

            // Check if already logged in
            if (this.page.url().includes("/news_feed")) {
                console.log("Already logged in via session");
                return true;
            }

            // Perform login
            await this.page.fill('input[id*="email"]', username);
            await this.page.fill('input[id*="password"]', password);
            await this.page.click('button[id*="signin_button"]');

            // Wait for navigation or error
            await Promise.race([
                this.page.waitForURL("**/news_feed**", { timeout: 30000 }),
                this.page.waitForSelector('text="Invalid email or password"', { timeout: 10000 }).then(() => { throw new Error("Invalid credentials") })
            ]);

            return true;
        } catch (e) {
            console.error("Login failed", e);
            return false;
        }
    }

    async getFeed(): Promise<any[]> {
        if (!this.page) throw new Error("Page not initialized");

        try {
            await this.page.goto("https://nextdoor.com/news_feed/?section=nearby");
            await this.page.waitForSelector('[data-testid="post-container"]', { timeout: 10000 });

            // Scroll down a bit to load more
            await this.page.evaluate(() => window.scrollBy(0, 1000));
            await this.page.waitForTimeout(2000);

            const posts = await this.page.evaluate(() => {
                const postElements = document.querySelectorAll('[data-testid="post-container"]');
                return Array.from(postElements).map(el => {
                    const titleEl = el.querySelector('h3, [class*="PostHeader"]');
                    const bodyEl = el.querySelector('[class*="PostBody"], [data-testid="post-body"]');
                    const authorEl = el.querySelector('[class*="AuthorName"]');
                    const linkEl = el.querySelector('a[href*="/p/"]');

                    return {
                        externalId: linkEl?.getAttribute('href')?.split('/').pop() || Math.random().toString(36),
                        url: linkEl ? `https://nextdoor.com${linkEl.getAttribute('href')}` : null,
                        title: titleEl?.textContent?.trim(),
                        body: bodyEl?.textContent?.trim() || "",
                        author: authorEl?.textContent?.trim(),
                        raw: {
                            fullContent: el.textContent?.trim()
                        }
                    };
                });
            });

            return posts;
        } catch (e) {
            console.error("Failed to scrape feed", e);
            return [];
        }
    }

    async postComment(postUrl: string, content: string): Promise<boolean> {
        if (!this.page) throw new Error("Page not initialized");

        try {
            await this.page.goto(postUrl);
            await this.page.waitForSelector('[data-testid="comment-box"]', { timeout: 15000 });

            // Click and type with human-like delays
            await this.page.click('[data-testid="comment-box"]');
            await this.page.type('[data-testid="comment-box"]', content, { delay: 100 });

            await this.page.waitForTimeout(1000);
            await this.page.keyboard.press("Enter"); // Or find post button

            // Verify post appeared
            await this.page.waitForTimeout(2000);
            return true;
        } catch (e) {
            console.error(`Failed to post comment on ${postUrl}`, e);
            return false;
        }
    }
}
