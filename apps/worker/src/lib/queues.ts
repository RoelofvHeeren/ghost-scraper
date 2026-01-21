import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { QUEUES } from "@ghost-scraper/shared";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null
});

// Queues that we produce to
export const pollQueue = new Queue(QUEUES.POLL_SOURCES, { connection });
export const processQueue = new Queue(QUEUES.PROCESS_CANDIDATE, { connection });
export const replyQueue = new Queue(QUEUES.POST_REPLY, { connection });

// Connection for Workers
export const redisConnection = connection;
