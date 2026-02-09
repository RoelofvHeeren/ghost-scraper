import { Redis } from "ioredis";
import { emitToSession } from "../lib/sockets.js";

// Parse REDIS_URL and extract credentials explicitly for subscriber
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const parsedUrl = new URL(redisUrl);

const redisOptions: any = {
    host: parsedUrl.hostname,
    port: parseInt(parsedUrl.port) || 6379,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    // Remove lazyConnect here as we want the subscriber to connect immediately or fail fast
    tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined
};

// Auth logic with Logging
console.log(`[LogStream Redis Setup] Parsing URL: ${parsedUrl.protocol}//${parsedUrl.host}`);

if (parsedUrl.username) redisOptions.username = parsedUrl.username;

if (parsedUrl.password) {
    redisOptions.password = parsedUrl.password;
    console.log("[LogStream Redis Setup] Using password from URL");
} else if (process.env.REDIS_PASSWORD) {
    redisOptions.password = process.env.REDIS_PASSWORD;
    console.log("[LogStream Redis Setup] Using password from REDIS_PASSWORD env var");
} else if (process.env.REDISPASSWORD) {
    redisOptions.password = process.env.REDISPASSWORD;
    console.log("[LogStream Redis Setup] Using password from REDISPASSWORD env var");
} else {
    console.warn("[LogStream Redis Setup] NO PASSWORD FOUND! Connection may fail with NOAUTH.");
}

const subscriber = new Redis(redisOptions);

export function initLogStream() {
    console.log("🔌 Initializing Log Stream Service...");

    subscriber.subscribe("bot-logs", (err: any) => {
        if (err) {
            console.error("Failed to subscribe to bot-logs:", err);
            return;
        }
        console.log("✅ Subscribed to 'bot-logs' channel");
    });

    subscriber.on("message", (channel: string, message: string) => {
        if (channel === "bot-logs") {
            try {
                const payload = JSON.parse(message);
                const { botId, ...data } = payload;
                if (botId) {
                    emitToSession(botId, 'log', data);
                }
            } catch (e) {
                console.error("Failed to parse log message:", e);
            }
        }
    });
}
