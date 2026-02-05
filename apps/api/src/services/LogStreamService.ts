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
    lazyConnect: true,
    tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined
};

if (parsedUrl.username) redisOptions.username = parsedUrl.username;
if (parsedUrl.password) redisOptions.password = parsedUrl.password;

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
