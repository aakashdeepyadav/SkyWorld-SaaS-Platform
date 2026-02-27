import { Server } from 'socket.io';
import { socketAuth } from './middleware/socketAuth.js';
import { logger } from './utils/logger.js';

// Map of userId → Set<socketId> for multi-device support
const onlineUsers = new Map();

/**
 * Initialize Socket.IO on the existing HTTP server.
 * Returns the io instance so controllers can emit events.
 */
export function initSocket(httpServer, allowedOrigins) {
    const io = new Server(httpServer, {
        cors: {
            origin: allowedOrigins,
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    // Authenticate every connection
    io.use(socketAuth);

    io.on('connection', (socket) => {
        const userId = socket.user._id.toString();
        logger.info(`Socket connected: ${socket.user.name} (${userId})`);

        // ── Track online presence ─────────────────────────────────────────────
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId).add(socket.id);

        // Broadcast online status
        io.emit('user:online', { userId });

        // ── Join user-specific room (for targeted notifications) ──────────────
        socket.join(`user:${userId}`);

        // ── Join project rooms ────────────────────────────────────────────────
        socket.on('project:join', (projectId) => {
            socket.join(`project:${projectId}`);
            logger.info(`${socket.user.name} joined project room: ${projectId}`);
        });

        socket.on('project:leave', (projectId) => {
            socket.leave(`project:${projectId}`);
        });

        // ── Typing indicators ─────────────────────────────────────────────────
        socket.on('typing:start', ({ projectId }) => {
            socket.to(`project:${projectId}`).emit('typing:start', {
                userId,
                userName: socket.user.name,
            });
        });

        socket.on('typing:stop', ({ projectId }) => {
            socket.to(`project:${projectId}`).emit('typing:stop', { userId });
        });

        // ── Disconnect ────────────────────────────────────────────────────────
        socket.on('disconnect', () => {
            const sockets = onlineUsers.get(userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    onlineUsers.delete(userId);
                    io.emit('user:offline', { userId });
                }
            }
            logger.info(`Socket disconnected: ${socket.user.name}`);
        });
    });

    // Store io instance globally for controllers to access
    global.__io = io;

    return io;
}

/**
 * Get the Socket.IO instance (for use in controllers/services).
 */
export function getIO() {
    return global.__io;
}

/**
 * Emit a notification to a specific user (all their connected devices).
 */
export function emitToUser(userId, event, data) {
    const io = getIO();
    if (io) {
        io.to(`user:${userId}`).emit(event, data);
    }
}

/**
 * Emit an event to all members of a project room.
 */
export function emitToProject(projectId, event, data) {
    const io = getIO();
    if (io) {
        io.to(`project:${projectId}`).emit(event, data);
    }
}

/**
 * Get list of currently online user IDs.
 */
export function getOnlineUserIds() {
    return Array.from(onlineUsers.keys());
}
