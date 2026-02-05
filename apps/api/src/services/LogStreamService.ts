import { Redis } from "ioredis";
import { emitToSession } from "../lib/sockets.js";

// Separate connection for subscribing - Railway format: redis://default:password@host:port
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const subscriber = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    // Disable TLS verification for Railway's internal Redis
    tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined
});

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
