import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

const OTP_EXPIRY_MINUTES = 10;
const SMTP_CONNECTION_TIMEOUT_MS = 15000;
const SMTP_GREETING_TIMEOUT_MS = 15000;
const SMTP_SOCKET_TIMEOUT_MS = 20000;

class EmailService {
  constructor() {
    this.transporter = null;
    this.fallbackTransports = [];
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@skyworld.com';
    this.fromName = process.env.FROM_NAME || 'SkyWorld Platform';
    this.initializeTransporter();
  }

  cleanEnvValue(value) {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/^['"]|['"]$/g, '');
  }

  getSmtpConfig() {
    const host = this.cleanEnvValue(process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST);
    const port = Number(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || 587);
    const user = this.cleanEnvValue(process.env.BREVO_SMTP_USER || process.env.SMTP_USER);
    const pass = this.cleanEnvValue(process.env.BREVO_SMTP_PASS || process.env.SMTP_PASS);
    const secure =
      String(process.env.BREVO_SMTP_SECURE || process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';

    if (!host || !user || !pass) return null;

    return {
      host,
      port,
      secure,
      requireTLS: !secure && port === 587,
      connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
      greetingTimeout: SMTP_GREETING_TIMEOUT_MS,
      socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
      auth: { user, pass }
    };
  }

  getFallbackSmtpConfig(primaryConfig) {
    if (!primaryConfig) return [];
    const host = String(primaryConfig.host || '').toLowerCase();
    if (host !== 'smtp-relay.brevo.com') return [];

    const candidates = [
      { port: 2525, secure: false, requireTLS: true },
      { port: 465, secure: true, requireTLS: false }
    ];

    return candidates
      .filter((candidate) => !(candidate.port === primaryConfig.port && candidate.secure === primaryConfig.secure))
      .map((candidate) => ({
        ...primaryConfig,
        port: candidate.port,
        secure: candidate.secure,
        requireTLS: candidate.requireTLS
      }));
  }

  createTransporter(config) {
    return nodemailer.createTransport(config);
  }

  isRetryableSmtpError(error) {
    if (!error) return false;
    const code = String(error.code || '');
    const message = String(error.message || '').toLowerCase();
    return (
      code === 'ETIMEDOUT' ||
      code === 'ECONNECTION' ||
      code === 'ESOCKET' ||
      message.includes('connection timeout') ||
      message.includes('connection closed')
    );
  }

  initializeTransporter() {
    try {
      const smtpConfig = this.getSmtpConfig();
      const hasEthereal = Boolean(process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS);

      if (process.env.NODE_ENV === 'development' && hasEthereal) {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: {
            user: process.env.ETHEREAL_USER,
            pass: process.env.ETHEREAL_PASS
          }
        });
        return;
      }

      if (smtpConfig) {
        this.transporter = this.createTransporter(smtpConfig);
        this.transporter.verify().then(() => {
          logger.info(`Email transporter ready (${smtpConfig.host}:${smtpConfig.port})`);
        }).catch((error) => {
          logger.error(`Email transporter verification failed (${smtpConfig.host}:${smtpConfig.port}):`, error);
        });

        const fallbackConfigs = this.getFallbackSmtpConfig(smtpConfig);
        this.fallbackTransports = fallbackConfigs.map((config) => ({
          config,
          transporter: this.createTransporter(config)
        }));

        this.fallbackTransports.forEach(({ config, transporter }) => {
          transporter.verify().then(() => {
            logger.info(`Email fallback transporter ready (${config.host}:${config.port})`);
          }).catch((error) => {
            logger.warn(`Email fallback transporter verification failed (${config.host}:${config.port}): ${error.message}`);
          });
        });
        return;
      }

      logger.warn('Email transporter not configured. Set BREVO_SMTP_* or SMTP_* variables.');
      this.transporter = null;
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
      this.transporter = null;
    }
  }

  async sendMail({ to, subject, html }) {
    if (!this.transporter) {
      logger.error('Email transporter not initialized');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `${this.fromName} <${this.fromEmail}>`,
        to,
        subject,
        html
      });

      logger.info(`Email sent to ${to}: ${info.messageId}`);
      return true;
    } catch (error) {
      if (this.isRetryableSmtpError(error) && this.fallbackTransports.length > 0) {
        for (const { config, transporter } of this.fallbackTransports) {
          logger.warn(`Primary SMTP failed. Retrying with fallback transport (${config.host}:${config.port})`);
          try {
            const info = await transporter.sendMail({
              from: `${this.fromName} <${this.fromEmail}>`,
              to,
              subject,
              html
            });
            logger.info(`Email sent via fallback transport to ${to}: ${info.messageId}`);
            return true;
          } catch (fallbackError) {
            logger.error(`Fallback email send failed (${config.host}:${config.port}):`, fallbackError);
          }
        }
      }
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    return this.sendMail({
      to: user.email,
      subject: 'Password Reset Request - SkyWorld',
      html: this.getPasswordResetTemplate(user.name, resetUrl)
    });
  }

  async sendPasswordChangeEmail(user) {
    return this.sendMail({
      to: user.email,
      subject: 'Password Changed Successfully - SkyWorld',
      html: this.getPasswordChangeTemplate(user.name)
    });
  }

  async sendAuthOtpEmail(user, otp, purpose) {
    const actionLabel = purpose === 'register' ? 'verify your account' : 'complete login';
    const subject = purpose === 'register'
      ? 'Verify Your Email - SkyWorld'
      : 'Your Login OTP - SkyWorld';

    return this.sendMail({
      to: user.email,
      subject,
      html: this.getAuthOtpTemplate(user.name, otp, actionLabel)
    });
  }

  get logoUrl() {
    const base = (process.env.FRONTEND_URL || 'https://skyworld.com').replace(/\/$/, '');
    return `${base}/wordmark_logo_coloured_fullname.png`;
  }

  get iconLogoUrl() {
    const base = (process.env.FRONTEND_URL || 'https://skyworld.com').replace(/\/$/, '');
    return `${base}/icon_logo_coloured.png`;
  }

  /* ── shared helpers ────────────────────────────────────────────────── */
  _shell(title, body) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title} — SkyWorld</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;-webkit-text-size-adjust:100%;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e4e4e7;border-radius:8px;">

        <!-- Logo bar -->
        <tr>
          <td style="padding:28px 32px 20px;border-bottom:1px solid #f0f0f3;">
            <img src="${this.logoUrl}" alt="SkyWorld Ventures" height="30" style="display:block;height:30px;width:auto;"/>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px 32px;">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f0f0f3;">
            <p style="margin:0 0 4px;font-size:12px;color:#a1a1aa;line-height:1.5;">&copy; 2026 SkyWorld Ventures &middot; All rights reserved.</p>
            <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.5;">This is an automated message. Please do not reply.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  /* ── OTP for signup / email verification ──────────────────────────── */
  getAuthOtpTemplate(userName, otp, actionLabel) {
    const body = `
            <p style="margin:0 0 20px;font-size:15px;color:#18181b;line-height:1.6;">Hi ${userName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">Use the code below to ${actionLabel}. It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:20px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:6px;padding:16px 32px;">
                  <tr><td style="font-size:32px;font-family:'Courier New',monospace;letter-spacing:8px;font-weight:700;color:#18181b;">${otp}</td></tr>
                </table>
              </td></tr>
            </table>

            <p style="margin:24px 0 0;font-size:13px;color:#71717a;line-height:1.6;">
              If you didn't request this code, you can safely ignore this email. Never share this code with anyone — SkyWorld staff will never ask for it.
            </p>`;
    return this._shell('Verification Code', body);
  }

  /* ── Password reset ───────────────────────────────────────────────── */
  getPasswordResetTemplate(userName, resetUrl) {
    const body = `
            <p style="margin:0 0 20px;font-size:15px;color:#18181b;line-height:1.6;">Hi ${userName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">We received a request to reset the password for your SkyWorld account. Click the button below to choose a new password.</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:8px 0 24px;">
                <a href="${resetUrl}" target="_blank" style="display:inline-block;padding:12px 28px;background:#0ea5e9;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:6px;">Reset password</a>
              </td></tr>
            </table>

            <p style="margin:0 0 6px;font-size:13px;color:#a1a1aa;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="margin:0 0 24px;font-size:13px;color:#0ea5e9;word-break:break-all;">${resetUrl}</p>

            <p style="margin:0;font-size:13px;color:#71717a;line-height:1.6;">
              This link expires in 10 minutes. If you didn't request a password reset, no action is needed — your password will stay the same.
            </p>`;
    return this._shell('Password Reset', body);
  }

  /* ── Password changed confirmation ────────────────────────────────── */
  getPasswordChangeTemplate(userName) {
    const body = `
            <p style="margin:0 0 20px;font-size:15px;color:#18181b;line-height:1.6;">Hi ${userName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">Your SkyWorld account password was changed successfully.</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
              <tr><td style="font-size:13px;color:#71717a;line-height:1.6;">
                If you made this change, no further action is required.<br/>
                If you did <strong>not</strong> change your password, please <a href="mailto:support@skyworld.com" style="color:#0ea5e9;text-decoration:none;font-weight:600;">contact support</a> immediately to secure your account.
              </td></tr>
            </table>`;
    return this._shell('Password Changed', body);
  }
}

export const emailService = new EmailService();
export default emailService;
