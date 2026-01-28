
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath, Page, Browser } from 'puppeteer';
import { TextVerifiedService } from './TextVerifiedService.js';

puppeteer.use(StealthPlugin());

interface ScrapeResult {
    externalId: string;
    url: string | null;
    title: string | null;
    body: string;
    author: string | null;
    postedAt?: string;
    raw: any;
}

export class NextdoorScraper {
    private browser: Browser | null = null;
    private page: Page | null = null;

    async init(options: { proxyUrl?: string, sessionData?: any, lat?: number, lng?: number }) {
        const args = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--lang=en-US'
        ];

        if (options.proxyUrl) {
            const proxy = new URL(options.proxyUrl);
            args.push(`--proxy-server=${proxy.hostname}:${proxy.port}`);
        }

        this.browser = await puppeteer.launch({
            headless: process.env.NEXTDOOR_HEADLESS !== 'false',
            executablePath: executablePath(),
            args
        });

        const context = this.browser.defaultBrowserContext();
        await context.overridePermissions('https://nextdoor.com', ['geolocation']);

        this.page = await this.browser.newPage();

        if (options.proxyUrl) {
            const proxy = new URL(options.proxyUrl);
            if (proxy.username && proxy.password) {
                await this.page.authenticate({ username: proxy.username, password: proxy.password });
            }
        }

        if (options.lat && options.lng) {
            await this.page.setGeolocation({ latitude: options.lat, longitude: options.lng });
        }

        if (options.sessionData && options.sessionData.cookies) {
            await this.page.setCookie(...options.sessionData.cookies);
        }
    }

    async login(username: string, password?: string): Promise<boolean> {
        if (!this.page) throw new Error("Scraper not initialized");

        await this.page.goto('https://nextdoor.com/news_feed/', { waitUntil: 'networkidle2' });

        // Check if logged in
        if (this.page.url().includes('news_feed')) {
            return true;
        }

        if (!password) return false;

        console.log(`🔑 Logging in as ${username}...`);
        await this.page.goto('https://nextdoor.com/login/', { waitUntil: 'networkidle2' });
        await this.page.type('input[id*="email"]', username, { delay: 50 });
        await this.page.type('input[id*="password"]', password, { delay: 50 });
        await this.page.click('button[id*="signin_button"]');

        try {
            await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
            return this.page.url().includes('news_feed');
        } catch (e) {
            return false;
        }
    }

    async scrapeSource(sourceConfig: any): Promise<ScrapeResult[]> {
        if (!this.page) throw new Error("Scraper not initialized");

        // Determine target URL
        let url = 'https://nextdoor.com/news_feed/?section=nearby';
        if (sourceConfig.type === 'GROUP' && sourceConfig.url) {
            url = sourceConfig.url;
        }

        console.log(`📡 Scraping URL: ${url}`);
        await this.page.goto(url, { waitUntil: 'networkidle2' });

        // Wait for posts to load
        const postSelector = '[data-testid="post-container"]';
        try {
            await this.page.waitForSelector(postSelector, { timeout: 15000 });
        } catch (e) {
            console.log("⚠️ No posts found or timeout.");
            return [];
        }

        // Infinite Scroll (Simulate human reading)
        const scrolls = sourceConfig.maxScrolls || 3;
        for (let i = 0; i < scrolls; i++) {
            await this.page.evaluate(() => window.scrollBy(0, 800 + Math.random() * 400));
            await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000));
        }

        // Extract
        const posts = await this.page.evaluate(() => {
            const containers = Array.from(document.querySelectorAll('[data-testid="post-container"]'));
            return containers.map(el => {
                const linkEl = el.querySelector('a[href*="/p/"]');
                const bodyEl = el.querySelector('[data-testid="post-body"], [class*="PostBody"]');
                const authorEl = el.querySelector('[class*="AuthorName"]');
                const titleEl = el.querySelector('h1, h2, h3, [class*="PostHeader"]');

                return {
                    externalId: linkEl?.getAttribute('href')?.split('/').pop() || Math.random().toString(36),
                    url: linkEl ? `https://nextdoor.com${linkEl.getAttribute('href')}` : null,
                    title: titleEl?.textContent?.trim() || null,
                    body: bodyEl?.textContent?.trim() || "",
                    author: authorEl?.textContent?.trim() || null,
                    raw: {
                        htmlSnippet: el.innerHTML.slice(0, 500)
                    }
                };
            });
        });

        return posts;
    }

    async getCookies() {
        return await this.page?.cookies();
    }

    async close() {
        await this.browser?.close();
    }
}
