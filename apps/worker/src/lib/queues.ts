import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { QUEUES } from "@ghost-scraper/shared";

// Parse REDIS_URL and extract credentials explicitly
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const parsedUrl = new URL(redisUrl);
const connection = new Redis({
    host: parsedUrl.hostname,
    port: parseInt(parsedUrl.port) || 6379,
    username: parsedUrl.username || undefined,
    password: parsedUrl.password || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined
});

// Queues that we produce to
export const pollQueue = new Queue(QUEUES.POLL_SOURCES, { connection: connection as any });
export const processQueue = new Queue(QUEUES.PROCESS_CANDIDATE, { connection: connection as any });
export const replyQueue = new Queue(QUEUES.POST_REPLY, { connection: connection as any });

// Connection for Workers
export const redisConnection = connection;

export async function publishBotLog(botId: string, message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') {
    const payload = JSON.stringify({
        botId,
        message,
        type,
        timestamp: new Date().toISOString()
    });
    // Publish to a specific channel that the API will listen to
    await connection.publish("bot-logs", payload);
}
