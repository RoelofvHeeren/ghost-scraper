
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import readline from 'readline';
import { executablePath } from 'puppeteer';

puppeteer.use(StealthPlugin());

// Configuration
const ACCOUNTS_FILE = 'accounts.csv'; // Format: email,password,firstName,lastName,address
const PROXIES_FILE = 'proxies.txt';   // Format: http://user:pass@host:port
const OUTPUT_DIR = './sessions';

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query: string): Promise<string> => {
    return new Promise(resolve => rl.question(query, resolve));
};

async function createAccount(account: any, proxy: string) {
    console.log(`\n🚀 Starting creation for ${account.email} on proxy ${proxy}...`);

    // Parse proxy for puppeteer (remove http://)
    const proxyUrl = new URL(proxy);

    const browser = await puppeteer.launch({
        headless: false, // Must be visible to debug and solve captchas if needed
        executablePath: executablePath(),
        args: [
            `--proxy-server=${proxyUrl.hostname}:${proxyUrl.port}`,
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    const page = await browser.newPage();

    // Authenticate proxy
    await page.authenticate({
        username: proxyUrl.username,
        password: proxyUrl.password
    });

    try {
        // 1. Check IP
        await page.goto('https://api.ipify.org?format=json');
        const content = await page.content();
        console.log(`   ✅ Proxy IP Verified: ${content.match(/\d+\.\d+\.\d+\.\d+/)?.[0]}`);

        // 2. Go to Nextdoor
        await page.goto('https://nextdoor.com/signup/', { waitUntil: 'networkidle2' });

        // 3. Fill Form
        console.log("   ✍️  Filling signup form...");
        // Selectors might change, generic placeholder logic here
        // await page.type('input[name="email"]', account.email);
        // await page.type('input[name="password"]', account.password);
        // ... implementation needed based on exact DOM

        // PAUSE FOR MANUAL INTERVENTION (OR API)
        console.log("   ⚠️  Please manually fill the form/captcha in the browser window.");
        console.log("   ⚠️  When you reach the 'Verify Phone' step, enter your TextVerified number.");
        await askQuestion("   PRESS ENTER when you have fully verified the account and are on the feed...");

        // 4. Export Cookies
        const cookies = await page.cookies();
        const sessionFile = `${OUTPUT_DIR}/${account.email}.json`;
        fs.writeFileSync(sessionFile, JSON.stringify(cookies, null, 2));
        console.log(`   💾 Session saved to ${sessionFile}`);

    } catch (e) {
        console.error(`   ❌ Failed: ${e}`);
    } finally {
        await browser.close();
    }
}

async function main() {
    const proxies = fs.readFileSync(PROXIES_FILE, 'utf-8').split('\n').filter(Boolean);
    const accounts = fs.readFileSync(ACCOUNTS_FILE, 'utf-8').split('\n').filter(Boolean);

    console.log(`Loaded ${accounts.length} accounts and ${proxies.length} proxies.`);

    for (let i = 0; i < accounts.length; i++) {
        const [email, password, first, last, address] = accounts[i].split(',');
        const proxy = proxies[i % proxies.length]; // Rotate proxies

        await createAccount({ email, password, first, last, address }, proxy);
    }

    rl.close();
}

main();
