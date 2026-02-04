import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { QUEUES } from "@ghost-scraper/shared";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null
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
