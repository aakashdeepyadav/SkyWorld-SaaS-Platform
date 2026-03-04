import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { generateTokens, setTokenCookies } from '../services/authService.js';
import { createAuditLog } from '../middleware/auth.js';

const APP_NAME = 'SkyWorld';

/**
 * @route   POST /api/v1/auth/2fa/setup
 * @desc    Generate a TOTP secret and QR code for 2FA setup
 * @access  Private
 */
export const setup2FA = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('+twoFactorSecret +twoFactorEnabled');

        if (user.twoFactorEnabled) {
            throw AppError.badRequest('Two-factor authentication is already enabled');
        }

        // Generate a new secret
        const secret = speakeasy.generateSecret({
            name: `${APP_NAME} (${user.email})`,
            issuer: APP_NAME,
            length: 20,
        });

        // Save the secret (not yet enabled — user must verify first)
        user.twoFactorSecret = secret.base32;
        await user.save({ validateBeforeSave: false });

        // Generate QR code as data URL
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        res.json({
            success: true,
            data: {
                secret: secret.base32,
                qrCode: qrCodeUrl,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/v1/auth/2fa/verify-setup
 * @desc    Verify a TOTP token and enable 2FA
 * @access  Private
 */
export const verifySetup2FA = async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) throw AppError.badRequest('TOTP token is required');

        const user = await User.findById(req.user._id).select('+twoFactorSecret');
        if (!user.twoFactorSecret) {
            throw AppError.badRequest('Run 2FA setup first');
        }

        // Verify the token against the stored secret
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token,
            window: 1, // Allow 1-step drift (30s)
        });

        if (!verified) {
            throw AppError.badRequest('Invalid token. Please try again.');
        }

        // Generate backup codes
        const backupCodes = Array.from({ length: 8 }, () =>
            crypto.randomBytes(4).toString('hex')
        );

        // Hash backup codes before storing
        const hashedCodes = backupCodes.map(code =>
            crypto.createHash('sha256').update(code).digest('hex')
        );

        user.twoFactorEnabled = true;
        user.twoFactorBackupCodes = hashedCodes;
        await user.save({ validateBeforeSave: false });

        await createAuditLog(req, '2fa_enabled', 'security', user._id);

        res.json({
            success: true,
            message: 'Two-factor authentication enabled successfully',
            data: {
                backupCodes, // Show plain codes once — user must save them
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/v1/auth/2fa/disable
 * @desc    Disable 2FA (requires current password)
 * @access  Private
 */
export const disable2FA = async (req, res, next) => {
    try {
        const { password } = req.body;
        if (!password) throw AppError.badRequest('Password is required to disable 2FA');

        const user = await User.findById(req.user._id).select('+password +twoFactorSecret +twoFactorEnabled +twoFactorBackupCodes');

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) throw AppError.unauthorized('Invalid password');

        user.twoFactorEnabled = false;
        user.twoFactorSecret = undefined;
        user.twoFactorBackupCodes = [];
        await user.save({ validateBeforeSave: false });

        await createAuditLog(req, '2fa_disabled', 'security', user._id);

        res.json({
            success: true,
            message: 'Two-factor authentication disabled',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/v1/auth/2fa/verify
 * @desc    Verify 2FA token during login (completes the login flow)
 * @access  Public (requires tempToken from login step)
 */
export const verify2FALogin = async (req, res, next) => {
    try {
        const { tempToken, token, backupCode } = req.body;

        if (!tempToken) throw AppError.badRequest('Temporary token is required');
        if (!token && !backupCode) throw AppError.badRequest('TOTP token or backup code is required');

        // Decode the temp token to get user ID
        let userId;
        try {
            const decoded = jwt.verify(tempToken, process.env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
            if (decoded.purpose !== '2fa') {
                throw AppError.badRequest('Invalid temporary token');
            }
            userId = decoded.uid;
        } catch (err) {
            if (err instanceof AppError) throw err;
            if (err.name === 'TokenExpiredError') {
                throw AppError.unauthorized('2FA session expired, please login again');
            }
            throw AppError.badRequest('Invalid temporary token');
        }

        const user = await User.findById(userId).select('+twoFactorSecret +twoFactorBackupCodes');
        if (!user || !user.twoFactorSecret) {
            throw AppError.unauthorized('Invalid 2FA session');
        }

        let verified = false;

        if (token) {
            // Verify TOTP token
            verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token,
                window: 1,
            });
        } else if (backupCode) {
            // Verify backup code (one-time use)
            const hashedInput = crypto.createHash('sha256').update(backupCode).digest('hex');
            const hashedBuf = Buffer.from(hashedInput, 'hex');
            let matchIndex = -1;
            for (let i = 0; i < user.twoFactorBackupCodes.length; i++) {
                const storedBuf = Buffer.from(user.twoFactorBackupCodes[i], 'hex');
                if (storedBuf.length === hashedBuf.length && crypto.timingSafeEqual(hashedBuf, storedBuf)) {
                    matchIndex = i;
                }
            }
            if (matchIndex !== -1) {
                verified = true;
                user.twoFactorBackupCodes.splice(matchIndex, 1);
                await user.save({ validateBeforeSave: false });
            }
        }

        if (!verified) {
            throw AppError.unauthorized('Invalid 2FA token');
        }

        // Complete login — issue tokens
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        const { accessToken, refreshToken } = generateTokens(user._id);
        setTokenCookies(res, accessToken, refreshToken);

        await createAuditLog(req, 'user_login', 'auth', user._id, { method: '2fa', success: true });

        res.json({
            success: true,
            message: 'Login successful',
            user: user.toPublicJSON(),
        });
    } catch (error) {
        next(error);
    }
};
