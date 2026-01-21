export const POSTING_LIMITS = {
    MAX_POSTS_PER_DAY_PER_ACCOUNT: 4,
    MIN_DELAY_BETWEEN_POSTS_SECONDS: 120,
    POSTING_WINDOW_START_HOUR: 8, // 8 AM
    POSTING_WINDOW_END_HOUR: 20   // 8 PM
};

export function canPost(account: { dailyPostCount: number, status: string }): boolean {
    if (account.status !== 'ACTIVE') return false;
    if (account.dailyPostCount >= POSTING_LIMITS.MAX_POSTS_PER_DAY_PER_ACCOUNT) return false;

    // Time window check not implemented here, assumed caller checks or cron check

    return true;
}
