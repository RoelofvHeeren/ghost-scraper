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
