import IntegrationCredential from '../models/IntegrationCredential.js';

export const GOOGLE_INTEGRATION_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/spreadsheets',
];

export const buildGoogleCredentialUpdate = ({
  tokens,
  ownerUserId,
  email,
  calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary',
  connectedAt = new Date(),
}) => {
  const credentialDraft = new IntegrationCredential({
    provider: 'google',
    ownerUserId,
    calendarId,
    email,
    scopes: GOOGLE_INTEGRATION_SCOPES,
    connectedAt,
  });

  credentialDraft.setRefreshToken(tokens.refresh_token);

  if (tokens.access_token) {
    credentialDraft.setAccessToken(
      tokens.access_token,
      tokens.expiry_date ? new Date(tokens.expiry_date) : null
    );
  }

  return {
    ownerUserId,
    refreshTokenEncrypted: credentialDraft.refreshTokenEncrypted,
    accessTokenEncrypted: credentialDraft.accessTokenEncrypted || null,
    accessTokenExpiresAt: credentialDraft.accessTokenExpiresAt || null,
    calendarId,
    email,
    scopes: GOOGLE_INTEGRATION_SCOPES,
    connectedAt,
  };
};

export const upsertGoogleCredential = async (params) => {
  const credentialUpdate = buildGoogleCredentialUpdate(params);

  return IntegrationCredential.findOneAndUpdate(
    { provider: 'google' },
    {
      $set: credentialUpdate,
      $setOnInsert: { provider: 'google' },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );
};
