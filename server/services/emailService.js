import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

/**
 * Email service configuration and utilities
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@skyworld.com';
    this.fromName = process.env.FROM_NAME || 'SkyWorld Platform';
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter based on environment
   */
  initializeTransporter() {
    try {
      if (process.env.NODE_ENV === 'development') {
        // Use ethereal.email for development
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: {
            user: process.env.ETHEREAL_USER,
            pass: process.env.ETHEREAL_PASS
          }
        });
      } else {
        // Production email service (SendGrid, AWS SES, etc.)
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
      }
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
      this.transporter = null;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, resetToken) {
    if (!this.transporter) {
      logger.error('Email transporter not initialized');
      return false;
    }

    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: user.email,
        subject: 'Password Reset Request - SkyWorld',
        html: this.getPasswordResetTemplate(user.name, resetUrl)
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to ${user.email}: ${info.messageId}`);
      
      return true;
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      return false;
    }
  }

  /**
   * Password reset email template
   */
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
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          .security-note { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
            <p>SkyWorld Platform</p>
          </div>
          
          <div class="content">
            <h2>Hello ${userName},</h2>
            
            <p>We received a request to reset your password for your SkyWorld account. Click the button below to reset your password:</p>
            
            <a href="${resetUrl}" class="button">Reset Password</a>
            
            <div class="security-note">
              <strong>⚠️ Security Notice:</strong>
              <ul>
                <li>This link will expire in <strong>10 minutes</strong></li>
                <li>You can only reset your password <strong>2 times per day</strong></li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #0EA5E9;">${resetUrl}</p>
            
            <p>Stay safe,<br>The SkyWorld Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© 2026 SkyWorld Ventures. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send password change confirmation email
   */
  async sendPasswordChangeEmail(user) {
    if (!this.transporter) {
      logger.error('Email transporter not initialized');
      return false;
    }

    try {
      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: user.email,
        subject: 'Password Changed Successfully - SkyWorld',
        html: this.getPasswordChangeTemplate(user.name)
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Password change confirmation sent to ${user.email}: ${info.messageId}`);
      
      return true;
    } catch (error) {
      logger.error('Failed to send password change email:', error);
      return false;
    }
  }

  /**
   * Password change confirmation template
   */
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
            <h1>✅ Password Changed</h1>
            <p>SkyWorld Platform</p>
          </div>
          
          <div class="content">
            <h2>Hello ${userName},</h2>
            
            <p>Your password has been successfully changed for your SkyWorld account.</p>
            
            <p>If you didn't make this change, please contact our support team immediately.</p>
            
            <p>Thank you,<br>The SkyWorld Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© 2026 SkyWorld Ventures. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Create singleton instance
export const emailService = new EmailService();
export default emailService;
