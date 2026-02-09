
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
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--lang=en-US'
        ];

        if (options.proxyUrl) {
            const proxy = new URL(options.proxyUrl);
            args.push(`--proxy-server=${proxy.hostname}:${proxy.port}`);
        }

        console.log(`🚀 Launching Browser (Headless: true - FORCED)`);

        this.browser = await puppeteer.launch({
            headless: true,
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

        console.log(`[v4.1] 🔍 Checking session for ${username}...`);

        try {
            await this.page.goto('https://nextdoor.com/news_feed/', { waitUntil: 'domcontentloaded', timeout: 30000 });
            // Small wait for JS to run
            await new Promise(r => setTimeout(r, 2000));
        } catch (e: any) {
            console.log(`[v4.1] ⚠️ Initial check navigation warning: ${e.message}`);
        }

        // Robust check: are we actually on the feed?
        const currentUrl = this.page.url();
        const isFeedUrl = currentUrl.includes('/news_feed') && !currentUrl.includes('/login');
        const hasUserNav = await this.page.evaluate(() => !!document.querySelector('[data-testid="user-navigation-menu"], .user-nav, [href*="/profile/"], [data-testid="post-container"]'));

        if (isFeedUrl && hasUserNav) {
            console.log("[v4.1] ✅ Session is valid.");
            return true;
        }

        if (!password) {
            console.log("[v4.1] ⚠️ Session invalid and no password provided.");
            return false;
        }

        console.log(`[v4.1] 🔑 Logging in as ${username}...`);
        await this.page.goto('https://nextdoor.com/login/', { waitUntil: 'networkidle2' });

        try {
            await this.page.waitForSelector('input[id*="email"]', { timeout: 15000 });
            await this.page.type('input[id*="email"]', username, { delay: 100 });
            await this.page.type('input[id*="password"]', password, { delay: 100 });

            console.log("[v4.1] 🖱️ Clicking Sign In button...");
            await Promise.all([
                this.page.waitForNavigation({ waitUntil: 'load', timeout: 45000 }).catch((e: any) => console.log(`[v4.1] ⚠️ Nav timeout: ${e.message}`)),
                this.page.click('button[id*="signin_button"]')
            ]);

            // Post-login wait and check
            await new Promise(r => setTimeout(r, 5000));
            const finalUrl = this.page.url();
            const success = finalUrl.includes('/news_feed') || await this.page.evaluate(() => !!document.querySelector('[data-testid="post-container"]'));

            if (success) {
                console.log("[v4.1] ✅ Login successful.");
                return true;
            } else {
                console.log(`[v4.1] ❌ Login failed. Current URL: ${finalUrl}`);
                // Optional: capture screenshot or HTML if we had a way to return it
                return false;
            }
        } catch (e) {
            console.error("[v4.1] ❌ Login sequence failed", e);
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

        // Wait a bit for dynamic content to load
        await new Promise(r => setTimeout(r, 3000));

        // Try multiple selectors for posts - Nextdoor changes these frequently
        const postSelectors = [
            '[data-testid="post-container"]',
            '[data-testid="activity-feed-item"]',
            'article',
            '[class*="post-card"]',
            '[class*="PostCard"]',
            '[class*="feed-item"]',
            '[class*="FeedItem"]',
            '[class*="story-card"]',
            '[class*="StoryCard"]'
        ];

        let postSelector = '';
        for (const selector of postSelectors) {
            try {
                const count = await this.page.$$eval(selector, els => els.length);
                if (count > 0) {
                    console.log(`✅ Found ${count} elements with selector: ${selector}`);
                    postSelector = selector;
                    break;
                }
            } catch (e) {
                // Selector not found, try next
            }
        }

        if (!postSelector) {
            // Diagnostic: log what we DO see on the page
            const bodyHtml = await this.page.evaluate(() => document.body.innerHTML.slice(0, 5000));
            console.log("⚠️ No known post selectors found. Page HTML sample:");
            console.log(bodyHtml.slice(0, 2000));
            console.log("⚠️ No posts found or timeout.");
            return [];
        }

        // Infinite Scroll (Simulate human reading)
        const scrolls = sourceConfig.maxScrolls || 3;
        for (let i = 0; i < scrolls; i++) {
            await this.page.evaluate(() => window.scrollBy(0, 800 + Math.random() * 400));
            await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000));
        }

        // Extract using the found selector
        const posts = await this.page.evaluate((selector) => {
            const containers = Array.from(document.querySelectorAll(selector));
            return containers.map(el => {
                // Try multiple selectors for each field
                const linkEl = el.querySelector('a[href*="/p/"]') || el.querySelector('a[href*="/post/"]');
                const bodyEl = el.querySelector('[data-testid="post-body"]') ||
                    el.querySelector('[class*="PostBody"]') ||
                    el.querySelector('[class*="post-body"]') ||
                    el.querySelector('p');
                const authorEl = el.querySelector('[class*="AuthorName"]') ||
                    el.querySelector('[class*="author"]') ||
                    el.querySelector('[class*="Author"]');
                const titleEl = el.querySelector('h1, h2, h3') ||
                    el.querySelector('[class*="PostHeader"]') ||
                    el.querySelector('[class*="title"]');

                const href = linkEl?.getAttribute('href') || '';
                const postId = href.split('/').filter(Boolean).pop() || Math.random().toString(36);

                return {
                    externalId: postId,
                    url: linkEl ? `https://nextdoor.com${href}` : null,
                    title: titleEl?.textContent?.trim() || null,
                    body: bodyEl?.textContent?.trim() || el.textContent?.trim().slice(0, 500) || "",
                    author: authorEl?.textContent?.trim() || null,
                    raw: {
                        htmlSnippet: el.innerHTML.slice(0, 500)
                    }
                };
            });
        }, postSelector);

        return posts;
    }

    async postComment(postUrl: string, content: string): Promise<boolean> {
        if (!this.page) throw new Error("Scraper not initialized");

        try {
            console.log(`💬 Posting comment to: ${postUrl}`);
            await this.page.goto(postUrl, { waitUntil: 'networkidle2' });

            // Wait for either the main comment box or another interaction point
            const boxSelector = '[data-testid="comment-box"], [class*="CommentBox"], textarea';
            await this.page.waitForSelector(boxSelector, { timeout: 15000 });

            await this.page.click(boxSelector);
            await new Promise(r => setTimeout(r, 500 + Math.random() * 500));

            // Type with delay
            await this.page.type(boxSelector, content, { delay: 100 + Math.random() * 100 });
            await new Promise(r => setTimeout(r, 1000));

            // Press Enter (Nextdoor often handles this, or look for a button)
            await this.page.keyboard.press('Enter');

            // Wait to ensure it's sent
            await new Promise(r => setTimeout(r, 3000));
            console.log("✅ Comment posted successfully.");
            return true;
        } catch (e) {
            console.error(`❌ Failed to post comment:`, e);
            return false;
        }
    }

    async getCookies() {
        return await this.page?.cookies();
    }

    async close() {
        await this.browser?.close();
    }
}
