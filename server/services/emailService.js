import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

const OTP_EXPIRY_MINUTES = 10;

class EmailService {
  constructor() {
    this.transporter = null;
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@skyworld.com';
    this.fromName = process.env.FROM_NAME || 'SkyWorld Platform';
    this.initializeTransporter();
  }

  getSmtpConfig() {
    const host = process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST;
    const port = Number(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || 587);
    const user = process.env.BREVO_SMTP_USER || process.env.SMTP_USER;
    const pass = process.env.BREVO_SMTP_PASS || process.env.SMTP_PASS;
    const secure = String(process.env.SMTP_SECURE || 'false') === 'true';

    if (!host || !user || !pass) return null;

    return {
      host,
      port,
      secure,
      auth: { user, pass }
    };
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
        this.transporter = nodemailer.createTransport(smtpConfig);
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

  getAuthOtpTemplate(userName, otp, actionLabel) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code - SkyWorld</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0EA5E9; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .otp { font-size: 28px; letter-spacing: 6px; font-weight: 700; color: #0f172a; text-align: center; margin: 20px 0; }
          .security-note { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Verification Code</h1>
            <p>SkyWorld Platform</p>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>Use this OTP to ${actionLabel}:</p>
            <div class="otp">${otp}</div>
            <div class="security-note">
              <strong>Security notice:</strong>
              <ul>
                <li>This code expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong></li>
                <li>Never share this code with anyone</li>
              </ul>
            </div>
            <p>If this was not you, ignore this email and secure your account.</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply.</p>
            <p>&copy; 2026 SkyWorld Ventures. All rights reserved.</p>
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
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0EA5E9; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #0EA5E9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .security-note { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
            <p>SkyWorld Platform</p>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>We received a request to reset your password. Click the button below:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <div class="security-note">
              <strong>Security notice:</strong>
              <ul>
                <li>This link expires in <strong>10 minutes</strong></li>
                <li>If you did not request this, ignore this email</li>
              </ul>
            </div>
            <p>If the button does not work, use this link:</p>
            <p style="word-break: break-all; color: #0EA5E9;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply.</p>
            <p>&copy; 2026 SkyWorld Ventures. All rights reserved.</p>
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
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Changed</h1>
            <p>SkyWorld Platform</p>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>Your password was changed successfully.</p>
            <p>If this was not you, contact support immediately.</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply.</p>
            <p>&copy; 2026 SkyWorld Ventures. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
export default emailService;
