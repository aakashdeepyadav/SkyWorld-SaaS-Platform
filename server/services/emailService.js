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

  getAuthOtpTemplate(userName, otp, actionLabel) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code - SkyWorld</title>
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f1f5f9; }
          .wrapper { width: 100%; background-color: #f1f5f9; padding: 40px 0; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); }
          .header { background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 50%, #0369A1 100%); color: white; padding: 40px 30px; text-align: center; }
          .header img { max-height: 44px; width: auto; margin-bottom: 16px; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
          .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.85; }
          .content { padding: 36px 32px; }
          .content h2 { margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #0f172a; }
          .content p { margin: 0 0 16px; font-size: 15px; color: #475569; }
          .otp-box { background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border: 2px dashed #0EA5E9; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
          .otp-box .label { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 8px; font-weight: 600; }
          .otp-code { font-size: 36px; letter-spacing: 10px; font-weight: 800; color: #0369A1; font-family: 'Courier New', monospace; }
          .security-note { background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; }
          .security-note strong { display: flex; align-items: center; font-size: 14px; color: #92400e; margin-bottom: 8px; }
          .security-note ul { margin: 0; padding-left: 18px; }
          .security-note li { font-size: 13px; color: #78716c; margin-bottom: 4px; }
          .divider { height: 1px; background: #e2e8f0; margin: 28px 0; }
          .help-text { font-size: 13px; color: #94a3b8; text-align: center; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center; }
          .footer-logo { max-height: 28px; width: auto; margin-bottom: 12px; opacity: 0.7; }
          .footer p { margin: 0 0 4px; font-size: 12px; color: #94a3b8; }
          .footer a { color: #0EA5E9; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <img src="${this.logoUrl}" alt="SkyWorld" />
              <h1>Email Verification Code</h1>
              <p>Secure access to your SkyWorld account</p>
            </div>
            <div class="content">
              <h2>Hello ${userName},</h2>
              <p>Use the verification code below to ${actionLabel}. This code is valid for a limited time only.</p>
              <div class="otp-box">
                <div class="label">Your Verification Code</div>
                <div class="otp-code">${otp}</div>
              </div>
              <div class="security-note">
                <strong>&#128274; Security Notice</strong>
                <ul>
                  <li>This code expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong></li>
                  <li>Never share this code with anyone, including SkyWorld staff</li>
                  <li>We will never ask for this code via phone or chat</li>
                </ul>
              </div>
              <div class="divider"></div>
              <p class="help-text">If you did not request this code, please ignore this email or <a href="mailto:support@skyworld.com">contact support</a> if you have concerns.</p>
            </div>
            <div class="footer">
              <img src="${this.iconLogoUrl}" alt="SkyWorld" class="footer-logo" />
              <p>&copy; 2026 SkyWorld Ventures. All rights reserved.</p>
              <p>This is an automated message — please do not reply directly.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordResetTemplate(userName, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - SkyWorld</title>
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f1f5f9; }
          .wrapper { width: 100%; background-color: #f1f5f9; padding: 40px 0; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); }
          .header { background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 50%, #0369A1 100%); color: white; padding: 40px 30px; text-align: center; }
          .header img { max-height: 44px; width: auto; margin-bottom: 16px; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
          .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.85; }
          .content { padding: 36px 32px; }
          .content h2 { margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #0f172a; }
          .content > p { margin: 0 0 16px; font-size: 15px; color: #475569; }
          .icon-circle { width: 64px; height: 64px; background: linear-gradient(135deg, #fee2e2, #fecaca); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
          .btn-reset { display: inline-block; background: linear-gradient(135deg, #0EA5E9, #0284C7); color: #ffffff !important; padding: 14px 40px; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 600; letter-spacing: 0.3px; margin: 24px 0; box-shadow: 0 4px 14px rgba(14, 165, 233, 0.35); }
          .btn-reset:hover { background: linear-gradient(135deg, #0284C7, #0369A1); }
          .link-fallback { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-top: 16px; word-break: break-all; }
          .link-fallback p { margin: 0 0 6px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
          .link-fallback a { font-size: 13px; color: #0EA5E9; text-decoration: none; }
          .security-note { background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; }
          .security-note strong { display: flex; align-items: center; font-size: 14px; color: #92400e; margin-bottom: 8px; }
          .security-note ul { margin: 0; padding-left: 18px; }
          .security-note li { font-size: 13px; color: #78716c; margin-bottom: 4px; }
          .divider { height: 1px; background: #e2e8f0; margin: 28px 0; }
          .help-text { font-size: 13px; color: #94a3b8; text-align: center; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center; }
          .footer-logo { max-height: 28px; width: auto; margin-bottom: 12px; opacity: 0.7; }
          .footer p { margin: 0 0 4px; font-size: 12px; color: #94a3b8; }
          .footer a { color: #0EA5E9; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <img src="${this.logoUrl}" alt="SkyWorld" />
              <h1>Password Reset Request</h1>
              <p>We received a request to reset your password</p>
            </div>
            <div class="content">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
                <div class="icon-circle">
                  <span style="font-size: 28px;">&#128275;</span>
                </div>
              </td></tr></table>
              <h2>Hello ${userName},</h2>
              <p>Someone requested a password reset for your SkyWorld account. If this was you, click the button below to set a new password.</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
                <a href="${resetUrl}" class="btn-reset">Reset My Password</a>
              </td></tr></table>
              <div class="link-fallback">
                <p>Button not working? Copy and paste this link:</p>
                <a href="${resetUrl}">${resetUrl}</a>
              </div>
              <div class="security-note">
                <strong>&#128274; Security Notice</strong>
                <ul>
                  <li>This link expires in <strong>10 minutes</strong></li>
                  <li>If you did not request a password reset, safely ignore this email</li>
                  <li>Your password will not change until you create a new one</li>
                </ul>
              </div>
              <div class="divider"></div>
              <p class="help-text">Need help? <a href="mailto:support@skyworld.com">Contact our support team</a></p>
            </div>
            <div class="footer">
              <img src="${this.iconLogoUrl}" alt="SkyWorld" class="footer-logo" />
              <p>&copy; 2026 SkyWorld Ventures. All rights reserved.</p>
              <p>This is an automated message — please do not reply directly.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordChangeTemplate(userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed - SkyWorld</title>
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f1f5f9; }
          .wrapper { width: 100%; background-color: #f1f5f9; padding: 40px 0; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%); color: white; padding: 40px 30px; text-align: center; }
          .header img { max-height: 44px; width: auto; margin-bottom: 16px; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
          .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.85; }
          .content { padding: 36px 32px; }
          .content h2 { margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #0f172a; }
          .content p { margin: 0 0 16px; font-size: 15px; color: #475569; }
          .success-box { background: linear-gradient(135deg, #ecfdf5, #d1fae5); border: 1px solid #6ee7b7; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
          .success-box .icon { font-size: 40px; margin-bottom: 8px; }
          .success-box .label { font-size: 16px; font-weight: 600; color: #065f46; }
          .warning-note { background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; }
          .warning-note strong { display: block; font-size: 14px; color: #991b1b; margin-bottom: 4px; }
          .warning-note p { margin: 0; font-size: 13px; color: #7f1d1d; }
          .divider { height: 1px; background: #e2e8f0; margin: 28px 0; }
          .help-text { font-size: 13px; color: #94a3b8; text-align: center; }
          .help-text a { color: #0EA5E9; text-decoration: none; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center; }
          .footer-logo { max-height: 28px; width: auto; margin-bottom: 12px; opacity: 0.7; }
          .footer p { margin: 0 0 4px; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <img src="${this.logoUrl}" alt="SkyWorld" />
              <h1>Password Changed Successfully</h1>
              <p>Your account security has been updated</p>
            </div>
            <div class="content">
              <h2>Hello ${userName},</h2>
              <p>Your SkyWorld account password has been changed successfully.</p>
              <div class="success-box">
                <div class="icon">&#9989;</div>
                <div class="label">Password Updated</div>
              </div>
              <div class="warning-note">
                <strong>&#9888;&#65039; Didn't make this change?</strong>
                <p>If you did not change your password, your account may be compromised. Please <a href="mailto:support@skyworld.com" style="color: #dc2626; font-weight: 600;">contact support immediately</a>.</p>
              </div>
              <div class="divider"></div>
              <p class="help-text">Need help? <a href="mailto:support@skyworld.com">Contact our support team</a></p>
            </div>
            <div class="footer">
              <img src="${this.iconLogoUrl}" alt="SkyWorld" class="footer-logo" />
              <p>&copy; 2026 SkyWorld Ventures. All rights reserved.</p>
              <p>This is an automated message — please do not reply directly.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
export default emailService;
