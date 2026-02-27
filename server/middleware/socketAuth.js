import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

/**
 * Authenticate Socket.IO connections using the same JWT access token
 * stored in HTTP-only cookies.
 */
export const socketAuth = async (socket, next) => {
    try {
        // Socket.IO handshake sends cookies in the headers
        const rawCookies = socket.handshake.headers.cookie;
        if (!rawCookies) {
            return next(new Error('Authentication required'));
        }

        const cookies = cookie.parse(rawCookies);
        const token = cookies.accessToken;

        if (!token) {
            return next(new Error('Access token not found'));
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        const user = await User.findById(decoded.userId).select('_id name email role avatar isActive');

        if (!user || !user.isActive) {
            return next(new Error('User not found or deactivated'));
        }

        // Attach user to socket for downstream use
        socket.user = user;
        next();
    } catch (error) {
        logger.warn('Socket auth failed:', error.message);
        next(new Error('Invalid or expired token'));
    }
};
