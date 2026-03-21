import { beforeEach, describe, expect, it, vi } from 'vitest';
import IntegrationCredential from '../../models/IntegrationCredential.js';
import {
  buildGoogleCredentialUpdate,
  GOOGLE_INTEGRATION_SCOPES,
  upsertGoogleCredential,
} from '../../services/googleIntegrationService.js';
import { TEST_ID } from '../helpers.js';

describe('googleIntegrationService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.GOOGLE_OAUTH_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    delete process.env.GOOGLE_CALENDAR_ID;
  });

  it('builds an encrypted credential update that includes the owner user', () => {
    const connectedAt = new Date('2026-03-22T10:00:00.000Z');
    const credentialUpdate = buildGoogleCredentialUpdate({
      tokens: {
        refresh_token: 'refresh-token',
        access_token: 'access-token',
        expiry_date: connectedAt.getTime() + 60_000,
      },
      ownerUserId: TEST_ID,
      email: 'admin@example.com',
      connectedAt,
    });

    expect(String(credentialUpdate.ownerUserId)).toBe(TEST_ID);
    expect(credentialUpdate.email).toBe('admin@example.com');
    expect(credentialUpdate.calendarId).toBe('primary');
    expect(credentialUpdate.scopes).toEqual(GOOGLE_INTEGRATION_SCOPES);
    expect(credentialUpdate.connectedAt).toEqual(connectedAt);
    expect(credentialUpdate.refreshTokenEncrypted).not.toBe('refresh-token');
    expect(credentialUpdate.accessTokenEncrypted).not.toBe('access-token');
    expect(credentialUpdate.accessTokenExpiresAt).toEqual(new Date(connectedAt.getTime() + 60_000));

    const hydratedCredential = new IntegrationCredential({
      provider: 'google',
      ...credentialUpdate,
    });

    expect(hydratedCredential.getRefreshToken()).toBe('refresh-token');
    expect(hydratedCredential.getAccessToken()).toBe('access-token');
  });

  it('upserts the google credential with ownerUserId in the update payload', async () => {
    const findOneAndUpdateSpy = vi
      .spyOn(IntegrationCredential, 'findOneAndUpdate')
      .mockResolvedValue({ _id: 'credential-1' });

    await upsertGoogleCredential({
      tokens: {
        refresh_token: 'refresh-token',
      },
      ownerUserId: TEST_ID,
      email: 'admin@example.com',
    });

    expect(findOneAndUpdateSpy).toHaveBeenCalledTimes(1);
    expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
      { provider: 'google' },
      expect.objectContaining({
        $set: expect.objectContaining({
          ownerUserId: TEST_ID,
          email: 'admin@example.com',
          calendarId: 'primary',
        }),
        $setOnInsert: { provider: 'google' },
      }),
      expect.objectContaining({
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      })
    );
  });
});
