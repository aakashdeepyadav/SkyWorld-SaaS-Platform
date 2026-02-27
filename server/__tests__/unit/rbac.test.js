import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockReq, mockRes, mockNext } from '../helpers.js';

// Mock dependencies
vi.mock('../../utils/constants.js', () => ({
    ROLES: { ADMIN: 'admin', DEVELOPER: 'developer', CLIENT: 'client' },
}));

vi.mock('../../middleware/auth.js', () => ({
    createAuditLog: vi.fn(),
}));

const { authorize, adminOnly, adminOrDeveloper, ownerOrAdmin } = await import('../../middleware/rbac.js');

describe('RBAC Middleware', () => {
    describe('authorize()', () => {
        it('allows admin to access admin-only route', async () => {
            const req = mockReq({ user: { _id: '1', role: 'admin' } });
            const res = mockRes();
            const next = mockNext();

            const middleware = authorize('admin');
            await middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('rejects client from admin-only route', async () => {
            const req = mockReq({ user: { _id: '1', role: 'client' } });
            const res = mockRes();
            const next = mockNext();

            const middleware = authorize('admin');
            await middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });

        it('allows multiple roles', async () => {
            const req = mockReq({ user: { _id: '1', role: 'developer' } });
            const res = mockRes();
            const next = mockNext();

            const middleware = authorize('admin', 'developer');
            await middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('rejects unauthenticated users', async () => {
            const req = mockReq({ user: null });
            const res = mockRes();
            const next = mockNext();

            const middleware = authorize('admin');
            await middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('preset middleware', () => {
        it('adminOnly rejects developer', async () => {
            const req = mockReq({ user: { _id: '1', role: 'developer' } });
            const res = mockRes();
            const next = mockNext();

            await adminOnly(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('adminOrDeveloper allows developer', async () => {
            const req = mockReq({ user: { _id: '1', role: 'developer' } });
            const res = mockRes();
            const next = mockNext();

            await adminOrDeveloper(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });

    describe('ownerOrAdmin()', () => {
        it('allows admin for any resource', async () => {
            const req = mockReq({
                user: { _id: '1', role: 'admin' },
                resource: { userId: '999' },
            });
            const res = mockRes();
            const next = mockNext();

            const middleware = ownerOrAdmin();
            await middleware(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('allows resource owner', async () => {
            const req = mockReq({
                user: { _id: '123', role: 'client' },
                resource: { clientId: '123' },
            });
            const res = mockRes();
            const next = mockNext();

            const middleware = ownerOrAdmin();
            await middleware(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('rejects non-owner non-admin', async () => {
            const req = mockReq({
                user: { _id: '123', role: 'client' },
                resource: { clientId: '999' },
            });
            const res = mockRes();
            const next = mockNext();

            const middleware = ownerOrAdmin();
            await middleware(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });
});
