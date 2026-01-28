import dotenv from "dotenv";
import { buildApp } from "./app.js";
import { Server } from "socket.io";
import { setSocketServer } from "./lib/sockets.js";
import { AccountFactory } from "@ghost-scraper/shared";

dotenv.config({ path: "../../.env" });

const PORT = parseInt(process.env.API_PORT || "8080", 10);

async function main() {
    const app = await buildApp();

    try {
        await app.ready(); // Ensure plugins are loaded
        const io = new Server(app.server, {
            cors: {
                origin: "*", // Adjust for production security later
                methods: ["GET", "POST"]
            }
        });

        setSocketServer(io);

        io.on("connection", (socket) => {
            console.log("Client connected:", socket.id);
            socket.on("join_bot_session", (sessionId) => {
                socket.join(`bot-session:${sessionId}`);
                console.log(`Socket ${socket.id} joined session ${sessionId}`);
            });
            socket.on("remote_click", async ({ sessionId, x, y }) => {
                const factory = AccountFactory.getInstance(sessionId);
                if (factory) {
                    await factory.handleRemoteClick(x, y);
                }
            });
        });

        await app.listen({ port: PORT, host: "0.0.0.0" });
        console.log(`Server running at http://localhost:${PORT}`);
        console.log(`Docs available at http://localhost:${PORT}/docs`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

main();
