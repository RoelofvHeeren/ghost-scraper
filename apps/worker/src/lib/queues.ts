import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { QUEUES } from "@ghost-scraper/shared";

// Parse REDIS_URL and extract credentials explicitly
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const parsedUrl = new URL(redisUrl);

const redisOptions: any = {
    host: parsedUrl.hostname,
    port: parseInt(parsedUrl.port) || 6379,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    // Remove lazyConnect here as we want BullMQ to handle it or fail fast
    tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined
};

// Auth logic with Logging
console.log(`[Worker Redis Setup] Parsing URL: ${parsedUrl.protocol}//${parsedUrl.host}`);

if (parsedUrl.username) redisOptions.username = parsedUrl.username;

if (parsedUrl.password) {
    redisOptions.password = parsedUrl.password;
    console.log("[Worker Redis Setup] Using password from URL");
} else if (process.env.REDIS_PASSWORD) {
    redisOptions.password = process.env.REDIS_PASSWORD;
    console.log("[Worker Redis Setup] Using password from REDIS_PASSWORD env var");
} else if (process.env.REDISPASSWORD) {
    redisOptions.password = process.env.REDISPASSWORD;
    console.log("[Worker Redis Setup] Using password from REDISPASSWORD env var");
} else {
    console.warn("[Worker Redis Setup] NO PASSWORD FOUND! Connection may fail with NOAUTH.");
}

const connection = new Redis(redisOptions);

// Queues that we produce to
export const pollQueue = new Queue(QUEUES.POLL_SOURCES, { connection: redisOptions });
export const processQueue = new Queue(QUEUES.PROCESS_CANDIDATE, { connection: redisOptions });
export const replyQueue = new Queue(QUEUES.POST_REPLY, { connection: redisOptions });

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

export async function publishBotScreenshot(botId: string, base64Image: string) {
    // Publish to a specific channel that the API will listen to
    const payload = JSON.stringify({
        botId,
        image: base64Image,
        timestamp: new Date().toISOString()
    });
    await connection.publish("bot-screenshots", payload);
}
