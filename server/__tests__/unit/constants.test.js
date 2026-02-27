import { describe, it, expect } from 'vitest';
import {
    ROLES,
    SERVICE_CATEGORIES,
    REQUEST_STATUS,
    PROJECT_STATUS,
    DELIVERY_STATUS,
    PAYMENT_STATUS,
    FILE_TYPES,
    PASSWORD_POLICY,
    RATE_LIMITS,
    LOCKOUT_POLICY,
    CUSTOM_REQUEST_STATUS,
} from '../../utils/constants.js';

describe('Constants', () => {
    describe('ROLES', () => {
        it('has all required roles', () => {
            expect(ROLES.ADMIN).toBe('admin');
            expect(ROLES.DEVELOPER).toBe('developer');
            expect(ROLES.CLIENT).toBe('client');
        });

        it('has no extra roles', () => {
            expect(Object.keys(ROLES)).toHaveLength(3);
        });
    });

    describe('SERVICE_CATEGORIES', () => {
        it('has the three business categories', () => {
            expect(Object.values(SERVICE_CATEGORIES)).toContain('app-development');
            expect(Object.values(SERVICE_CATEGORIES)).toContain('web-development');
            expect(Object.values(SERVICE_CATEGORIES)).toContain('branding-creative');
        });
    });

    describe('REQUEST_STATUS', () => {
        it('has all lifecycle statuses', () => {
            expect(REQUEST_STATUS.PENDING).toBe('pending');
            expect(REQUEST_STATUS.APPROVED).toBe('approved');
            expect(REQUEST_STATUS.IN_PROGRESS).toBeDefined();
            expect(REQUEST_STATUS.COMPLETED).toBe('completed');
            expect(REQUEST_STATUS.CANCELLED).toBe('cancelled');
        });
    });

    describe('PROJECT_STATUS', () => {
        it('includes planning and review', () => {
            expect(PROJECT_STATUS.PLANNING).toBe('planning');
            expect(PROJECT_STATUS.REVIEW).toBe('review');
        });
    });

    describe('PAYMENT_STATUS', () => {
        it('has refunded status', () => {
            expect(PAYMENT_STATUS.REFUNDED).toBe('refunded');
        });
    });

    describe('PASSWORD_POLICY', () => {
        it('requires minimum 8 characters', () => {
            expect(PASSWORD_POLICY.minLength).toBeGreaterThanOrEqual(8);
        });
    });

    describe('RATE_LIMITS', () => {
        it('has global limit', () => {
            expect(RATE_LIMITS.global).toBeDefined();
            expect(RATE_LIMITS.global.max).toBeGreaterThan(0);
            expect(RATE_LIMITS.global.windowMs).toBeGreaterThan(0);
        });

        it('has auth limit stricter than global', () => {
            expect(RATE_LIMITS.auth.max).toBeLessThan(RATE_LIMITS.global.max);
        });
    });

    describe('LOCKOUT_POLICY', () => {
        it('locks after a reasonable number of attempts', () => {
            expect(LOCKOUT_POLICY.maxAttempts).toBeGreaterThanOrEqual(3);
            expect(LOCKOUT_POLICY.maxAttempts).toBeLessThanOrEqual(10);
        });

        it('has a lockout duration', () => {
            expect(LOCKOUT_POLICY.lockDurationMs).toBeGreaterThan(0);
        });
    });
});
