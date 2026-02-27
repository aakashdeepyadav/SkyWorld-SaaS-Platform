import { describe, it, expect } from 'vitest';
import { AppError } from '../../utils/AppError.js';

describe('AppError', () => {
    it('creates an error with default status 400', () => {
        const err = new AppError('Something failed');
        expect(err.message).toBe('Something failed');
        expect(err.statusCode).toBe(400);
        expect(err.isOperational).toBe(true);
        expect(err.name).toBe('AppError');
        expect(err).toBeInstanceOf(Error);
    });

    it('accepts custom status code', () => {
        const err = new AppError('Not found', 404);
        expect(err.statusCode).toBe(404);
    });

    it('accepts details object', () => {
        const details = { field: 'email', reason: 'duplicate' };
        const err = new AppError('Validation', 400, { details });
        expect(err.details).toEqual(details);
    });

    it('marks non-operational with isOperational=false', () => {
        const err = new AppError('Crash', 500, { isOperational: false });
        expect(err.isOperational).toBe(false);
    });

    describe('static factories', () => {
        it('badRequest()', () => {
            const err = AppError.badRequest('Bad input');
            expect(err.statusCode).toBe(400);
            expect(err.message).toBe('Bad input');
        });

        it('badRequest() with details', () => {
            const err = AppError.badRequest('Fail', { field: 'name' });
            expect(err.details).toEqual({ field: 'name' });
        });

        it('unauthorized()', () => {
            const err = AppError.unauthorized();
            expect(err.statusCode).toBe(401);
            expect(err.message).toBe('Authentication required');
        });

        it('forbidden()', () => {
            const err = AppError.forbidden();
            expect(err.statusCode).toBe(403);
        });

        it('notFound()', () => {
            const err = AppError.notFound('User not found');
            expect(err.statusCode).toBe(404);
            expect(err.message).toBe('User not found');
        });

        it('conflict()', () => {
            const err = AppError.conflict();
            expect(err.statusCode).toBe(409);
        });

        it('tooMany()', () => {
            const err = AppError.tooMany();
            expect(err.statusCode).toBe(429);
        });

        it('internal() is not operational', () => {
            const err = AppError.internal();
            expect(err.statusCode).toBe(500);
            expect(err.isOperational).toBe(false);
        });
    });

    it('has a stack trace', () => {
        const err = new AppError('test');
        expect(err.stack).toBeDefined();
        expect(err.stack).toContain('AppError');
    });
});
