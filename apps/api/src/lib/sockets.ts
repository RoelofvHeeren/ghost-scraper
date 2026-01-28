import { Server } from "socket.io";

let io: Server | null = null;

export function setSocketServer(server: Server) {
    io = server;
}

export function getSocketServer(): Server | null {
    return io;
}

export function emitToSession(sessionId: string, event: string, data: any) {
    if (io) {
        io.to(`bot-session:${sessionId}`).emit(event, data);
    }
}
