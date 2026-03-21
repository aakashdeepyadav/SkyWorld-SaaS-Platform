import { describe, expect, it } from 'vitest';
import User, {
  formatUserCode,
  normalizeUserCode,
  USER_CODE_CONFIG,
} from '../../models/User.js';
import { ROLES } from '../../utils/constants.js';

describe('userCode formatting', () => {
  it('formats new user codes with a single-letter prefix and 7 digits', () => {
    expect(formatUserCode(USER_CODE_CONFIG[ROLES.CLIENT].prefix, 1)).toBe('C0000001');
    expect(formatUserCode(USER_CODE_CONFIG[ROLES.DEVELOPER].prefix, 42)).toBe('D0000042');
    expect(formatUserCode(USER_CODE_CONFIG[ROLES.ADMIN].prefix, 305)).toBe('A0000305');
  });

  it('normalizes legacy stored user codes to the new public format', () => {
    expect(normalizeUserCode('CLT-001')).toBe('C0000001');
    expect(normalizeUserCode('DEV-012')).toBe('D0000012');
    expect(normalizeUserCode('ADM-105')).toBe('A0000105');
    expect(normalizeUserCode('C001')).toBe('C0000001');
  });

  it('exposes normalized user codes through the mongoose getter', () => {
    const user = new User({
      email: 'code-test@example.com',
      name: 'Code Test',
      role: ROLES.CLIENT,
      userCode: 'CLT-009',
    });

    expect(user.userCode).toBe('C0000009');
    expect(user.toPublicJSON().userCode).toBe('C0000009');
  });
});
