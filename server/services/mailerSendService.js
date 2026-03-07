import { logger } from '../utils/logger.js';

const MAILERSEND_EMAIL_API = 'https://api.mailersend.com/v1/email';

const cleanEnvValue = (value) => {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/^['"]|['"]$/g, '');
};

class MailerSendService {
  constructor() {
    this.token = cleanEnvValue(process.env.MAILERSEND_API_TOKEN);
    this.fromEmail =
      cleanEnvValue(process.env.MAILERSEND_FROM_EMAIL) ||
      cleanEnvValue(process.env.FROM_EMAIL) ||
      '';
    this.fromName =
      cleanEnvValue(process.env.MAILERSEND_FROM_NAME) ||
      cleanEnvValue(process.env.FROM_NAME) ||
      'SkyWorld';
  }

  isConfigured() {
    return Boolean(this.token && this.fromEmail);
  }

  ensureConfigured() {
    const missing = [];
    if (!this.token) missing.push('MAILERSEND_API_TOKEN');
    if (!this.fromEmail) missing.push('MAILERSEND_FROM_EMAIL');
    if (missing.length > 0) {
      throw new Error(`MailerSend not configured: missing ${missing.join(', ')}`);
    }
  }

  buildPayload({ to, subject, html, text, attachments = [] }) {
    const recipients = Array.isArray(to) ? to : [to];
    return {
      from: { email: this.fromEmail, name: this.fromName },
      to: recipients
        .filter((recipient) => recipient?.email)
        .map((recipient) => ({
          email: String(recipient.email).trim().toLowerCase(),
          ...(recipient.name ? { name: String(recipient.name).trim() } : {}),
        })),
      subject,
      html,
      text,
      attachments: attachments.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        disposition: 'attachment',
      })),
    };
  }

  async sendEmail({ to, subject, html, text = '', attachments = [] }) {
    this.ensureConfigured();
    const payload = this.buildPayload({ to, subject, html, text, attachments });

    if (!payload.to.length) {
      throw new Error('No valid recipient email provided');
    }

    const response = await fetch(MAILERSEND_EMAIL_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const rawBody = await response.text();
    let parsedBody = null;
    try {
      parsedBody = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      parsedBody = null;
    }

    if (!response.ok) {
      const message =
        parsedBody?.message ||
        parsedBody?.error ||
        `MailerSend API request failed with status ${response.status}`;
      logger.error(`MailerSend send failed: ${message}`);
      throw new Error(message);
    }

    const messageId = response.headers.get('x-message-id') || parsedBody?.id || null;
    logger.info(`MailerSend email queued for ${payload.to.map((x) => x.email).join(', ')}`);

    return {
      success: true,
      provider: 'mailersend',
      messageId,
    };
  }
}

export const mailerSendService = new MailerSendService();
export default mailerSendService;
