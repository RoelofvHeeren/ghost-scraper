import { Redis } from "ioredis";
import { emitToSession } from "../lib/sockets.js";

// Separate connection for subscribing
const subscriber = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null
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
