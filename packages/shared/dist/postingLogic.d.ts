export declare const POSTING_LIMITS: {
    MAX_POSTS_PER_DAY_PER_ACCOUNT: number;
    MIN_DELAY_BETWEEN_POSTS_SECONDS: number;
    POSTING_WINDOW_START_HOUR: number;
    POSTING_WINDOW_END_HOUR: number;
};
export declare function canPost(account: {
    dailyPostCount: number;
    status: string;
}): boolean;
