import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

class SocketService {
    private socket: Socket;

    constructor() {
        this.socket = io(SOCKET_URL);
    }

    joinBotSession(botId: string) {
        this.socket.emit("join_bot_session", botId);
    }

    onLog(callback: (data: any) => void) {
        this.socket.on("log", callback);
    }

    onScreenshot(callback: (data: any) => void) {
        this.socket.on("screenshot", callback);
    }

    onStepUpdate(callback: (step: string) => void) {
        this.socket.on("step_update", callback);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

export const socketSvc = new SocketService();
