import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer';

// Use same stealth logic as AccountFactory
puppeteer.use(StealthPlugin());

async function main() {
    console.log('🚀 Starting Stealth Demo...');
    const browser = await puppeteer.launch({
        headless: false, // SHOW THE BROWSER
        executablePath: executablePath(),
        args: ['--window-size=1280,1000']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });

    // Use a simple form for demonstration
    console.log('🌐 Navigating to demo form...');
    await page.goto('https://fill.dev/form/contact-simple', { waitUntil: 'networkidle2' });

    // --- Helper Functions (Copied from AccountFactory for standalone demo) ---
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const humanDelay = async (min = 500, max = 2000) => {
        const ms = Math.floor(Math.random() * (max - min + 1) + min);
        await delay(ms);
    };

    let currentMouse = { x: 0, y: 0 };

    const cubicBezier = (t: number, p0: number, p1: number, p2: number, p3: number) => {
        return (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3;
    };

    const humanMoveTo = async (targetX: number, targetY: number) => {
        const startX = currentMouse.x;
        const startY = currentMouse.y;

        // Random control points
        const cp1x = startX + (targetX - startX) * (Math.random() * 0.5 + 0.1) + (Math.random() * 100 - 50);
        const cp1y = startY + (targetY - startY) * (Math.random() * 0.5 + 0.1) + (Math.random() * 100 - 50);
        const cp2x = startX + (targetX - startX) * (Math.random() * 0.5 + 0.4) + (Math.random() * 100 - 50);
        const cp2y = startY + (targetY - startY) * (Math.random() * 0.5 + 0.4) + (Math.random() * 100 - 50);

        const steps = 50;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = cubicBezier(t, startX, cp1x, cp2x, targetX);
            const y = cubicBezier(t, startY, cp1y, cp2y, targetY);
            await page.mouse.move(x, y);
            currentMouse = { x, y };
            // Visual delay to see movement
            await delay(5);
        }
    };

    const humanScrollTo = async (selector: string) => {
        const el = await page.$(selector);
        if (el) {
            await el.evaluate(e => e.scrollIntoView({ behavior: 'smooth', block: 'center' }));
            await humanDelay(500, 1000);
        }
    };

    const humanType = async (selector: string, text: string) => {
        console.log(`⌨️ Typing "${text}" into ${selector}...`);

        // 1. Scroll
        await humanScrollTo(selector);

        // 2. Move & Click
        const el = await page.$(selector);
        if (el) {
            const box = await el.boundingBox();
            if (box) {
                const tx = box.x + box.width / 2;
                const ty = box.y + box.height / 2;
                await humanMoveTo(tx, ty);
                await humanDelay(200, 400);
                await page.mouse.click(tx, ty);
            }
        }

        // 3. Type
        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            // Typo chance
            if (Math.random() < 0.1) {
                await page.keyboard.type('z');
                await delay(200);
                await page.keyboard.press('Backspace');
                await delay(200);
            }

            await page.keyboard.type(char);

            // Random delays (100ms - 400ms)
            let charDelay = Math.floor(Math.random() * 300 + 100);
            if (char === ' ') charDelay += 300;

            await delay(charDelay);
        }
    };
    // ---------------------------------------------------------

    // Demo Actions
    await humanType('input[name="name"]', "Ben Black");
    await humanType('input[name="email"]', "ben.black@example.com");
    await humanType('textarea[name="message"]', "This is a demonstration of human-like typing and mouse movement.");

    console.log('✅ Demo Complete! Closing in 5 seconds...');
    await delay(5000);
    await browser.close();
}

main().catch(console.error);
