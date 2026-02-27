import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../utils/AppError.js';

// We need to mock the dependencies before importing the module under test
vi.mock('../../utils/logger.js', () => ({
    logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('mongoose', () => {
    class CastError extends Error {
        constructor() { super('Cast error'); this.name = 'CastError'; }
    }
    class ValidationError extends Error {
        constructor() {
            super('Validation error');
            this.name = 'ValidationError';
            this.errors = { field1: { path: 'field1', message: 'Required' } };
        }
    }
    return {
        default: {
            Error: { CastError, ValidationError },
        },
    };
});

// Now import the handler
const { errorHandler } = await import('../../middleware/errorHandler.js');

function makeRes() {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    return res;
}

function makeReq() {
    return { path: '/test', method: 'GET', ip: '127.0.0.1' };
}

describe('errorHandler', () => {
    let res;
    let req;

    beforeEach(() => {
        res = makeRes();
        req = makeReq();
    });

    it('handles AppError with correct status and message', () => {
        const err = AppError.notFound('User not found');
        errorHandler(err, req, res, vi.fn());
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: false, message: 'User not found' })
        );
    });

    it('handles AppError.badRequest with details', () => {
        const err = AppError.badRequest('Validation', [{ field: 'email' }]);
        errorHandler(err, req, res, vi.fn());
        expect(res.status).toHaveBeenCalledWith(400);
        const body = res.json.mock.calls[0][0];
        expect(body.errors).toBeDefined();
    });

    it('handles Mongoose CastError as 404', async () => {
        const mongoose = (await import('mongoose')).default;
        const err = new mongoose.Error.CastError();
        errorHandler(err, req, res, vi.fn());
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('handles duplicate key error (code 11000)', () => {
        const err = new Error('Duplicate');
        err.code = 11000;
        err.keyPattern = { email: 1 };
        errorHandler(err, req, res, vi.fn());
        expect(res.status).toHaveBeenCalledWith(400);
        const body = res.json.mock.calls[0][0];
        expect(body.message).toContain('email');
    });

    it('handles JWT errors as 401', () => {
        const err = new Error('jwt malformed');
        err.name = 'JsonWebTokenError';
        errorHandler(err, req, res, vi.fn());
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json.mock.calls[0][0].message).toBe('Invalid token');
    });

    it('handles TokenExpiredError as 401', () => {
        const err = new Error('jwt expired');
        err.name = 'TokenExpiredError';
        errorHandler(err, req, res, vi.fn());
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 500 for unknown errors', () => {
        const err = new Error('Something unexpected');
        errorHandler(err, req, res, vi.fn());
        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('includes stack trace in development', () => {
        const origEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';
        const err = new AppError('Dev error');
        errorHandler(err, req, res, vi.fn());
        const body = res.json.mock.calls[0][0];
        expect(body.stack).toBeDefined();
        process.env.NODE_ENV = origEnv;
    });
});
