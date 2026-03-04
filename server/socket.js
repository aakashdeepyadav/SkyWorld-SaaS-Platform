import { Server } from 'socket.io';
import { socketAuth } from './middleware/socketAuth.js';
import { logger } from './utils/logger.js';
import mongoose from 'mongoose';
import Project from './models/Project.js';
import { ROLES } from './utils/constants.js';

// Map of userId → Set<socketId> for multi-device support
const onlineUsers = new Map();

// Simple per-socket rate limiter (token bucket)
const socketRateLimits = new Map();
const RATE_WINDOW_MS = 10_000;
const MAX_EVENTS_PER_WINDOW = 30;

function isRateLimited(socketId) {
    const now = Date.now();
    const entry = socketRateLimits.get(socketId);
    if (!entry || now - entry.start > RATE_WINDOW_MS) {
        socketRateLimits.set(socketId, { start: now, count: 1 });
        return false;
    }
    entry.count += 1;
    return entry.count > MAX_EVENTS_PER_WINDOW;
}

function isValidObjectId(value) {
    return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

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

        // Broadcast online status to user's project rooms only (not globally)
        socket.on('presence:subscribe', () => {
            // Client subscribes after joining rooms — presence events go through rooms
        });

        // ── Join user-specific room (for targeted notifications) ──────────────
        socket.join(`user:${userId}`);

        // ── Join project rooms with authorization ─────────────────────────────
        socket.on('project:join', async (projectId) => {
            if (isRateLimited(socket.id)) return;

            if (!isValidObjectId(projectId)) {
                return socket.emit('error', { message: 'Invalid project ID' });
            }

            try {
                const project = await Project.findById(projectId).select('clientId developerIds').lean();
                if (!project) {
                    return socket.emit('error', { message: 'Project not found' });
                }

                const isAdmin = socket.user.role === ROLES.ADMIN;
                const isClient = project.clientId?.toString() === userId;
                const isDev = (project.developerIds || []).some(d => d.toString() === userId);

                if (!isAdmin && !isClient && !isDev) {
                    return socket.emit('error', { message: 'Access denied' });
                }

                socket.join(`project:${projectId}`);
            } catch (err) {
                logger.error('Socket project:join error:', err.message);
            }
        });

        socket.on('project:leave', (projectId) => {
            if (typeof projectId === 'string') {
                socket.leave(`project:${projectId}`);
            }
        });

        // ── Typing indicators ─────────────────────────────────────────────────
        socket.on('typing:start', ({ projectId }) => {
            if (isRateLimited(socket.id)) return;
            if (!isValidObjectId(projectId)) return;
            socket.to(`project:${projectId}`).emit('typing:start', {
                userId,
                userName: socket.user.name,
            });
        });

        socket.on('typing:stop', ({ projectId }) => {
            if (isRateLimited(socket.id)) return;
            if (!isValidObjectId(projectId)) return;
            socket.to(`project:${projectId}`).emit('typing:stop', { userId });
        });

        // ── Disconnect ────────────────────────────────────────────────────────
        socket.on('disconnect', () => {
            const sockets = onlineUsers.get(userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    onlineUsers.delete(userId);
                }
            }
            socketRateLimits.delete(socket.id);
            logger.info(`Socket disconnected: ${socket.user.name}`);
        });
    });

    // Module-level reference instead of polluting global
    _io = io;

    return io;
}

let _io = null;

/**
 * Get the Socket.IO instance (for use in controllers/services).
 */
export function getIO() {
    return _io;
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
