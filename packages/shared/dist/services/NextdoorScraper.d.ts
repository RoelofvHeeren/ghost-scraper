interface ScrapeResult {
    externalId: string;
    url: string | null;
    title: string | null;
    body: string;
    author: string | null;
    postedAt?: string;
    raw: any;
}
export declare class NextdoorScraper {
    private browser;
    private page;
    init(options: {
        proxyUrl?: string;
        sessionData?: any;
        lat?: number;
        lng?: number;
    }): Promise<void>;
    login(username: string, password?: string): Promise<boolean>;
    scrapeSource(sourceConfig: any): Promise<ScrapeResult[]>;
    postComment(postUrl: string, content: string): Promise<boolean>;
    getCookies(): Promise<import("puppeteer-core").Cookie[] | undefined>;
    close(): Promise<void>;
}
export {};
