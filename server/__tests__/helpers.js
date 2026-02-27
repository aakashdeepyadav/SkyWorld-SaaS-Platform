/**
 * Shared test helpers and mocks.
 */
import { vi } from 'vitest';

/* ── Mock request / response factories ── */

export function mockReq(overrides = {}) {
    return {
        body: {},
        params: {},
        query: {},
        user: { _id: '507f1f77bcf86cd799439011', name: 'Test User', role: 'client', email: 'test@test.com' },
        cookies: {},
        ip: '127.0.0.1',
        get: vi.fn().mockReturnValue('test-user-agent'),
        ...overrides,
    };
}

export function mockRes() {
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        cookie: vi.fn().mockReturnThis(),
        clearCookie: vi.fn().mockReturnThis(),
        _getJSON: () => res.json.mock.calls[0]?.[0],
        _getStatus: () => res.status.mock.calls[0]?.[0],
    };
    return res;
}

export function mockNext() {
    return vi.fn();
}

/* ── Mongo ObjectId helper ── */
export const TEST_ID = '507f1f77bcf86cd799439011';
export const TEST_ID_2 = '507f1f77bcf86cd799439012';
