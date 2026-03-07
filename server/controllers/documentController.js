import User from '../models/User.js';
import Project from '../models/Project.js';
import Payment from '../models/Payment.js';
import DocumentEmailLog from '../models/DocumentEmailLog.js';
import { createAuditLog } from '../middleware/auth.js';
import { PAYMENT_STATUS } from '../utils/constants.js';
import {
  ADMIN_DOCUMENT_TYPE_VALUES,
  ADMIN_DOCUMENT_TYPES,
} from '../utils/documentEmail.js';
import { generateInvoicePDF } from '../services/invoiceService.js';
import { mailerSendService } from '../services/mailerSendService.js';
import { invalidateDashboardSnapshotCache } from '../services/dashboardAnalyticsService.js';
import {
  generatePaymentReceiptPDF,
  generateProjectStagePDF,
  generateServiceAgreementPDF,
  toMailerSendAttachment,
  buildDocumentDispatchEmail,
} from '../services/documentDispatchService.js';

const MAX_CUSTOM_MESSAGE_LENGTH = 1000;

const sanitizeRequestedDocuments = (documents) => {
  const values = Array.isArray(documents) ? documents : [];
  const normalized = values
    .map((value) => String(value || '').trim().toLowerCase())
    .filter((value) => ADMIN_DOCUMENT_TYPE_VALUES.includes(value));
  return [...new Set(normalized)];
};

const normalizeCustomMessage = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.slice(0, MAX_CUSTOM_MESSAGE_LENGTH);
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getDocumentRecipients = async (req, res, next) => {
  try {
    const { search = '', role = 'client', page = 1, limit = 20 } = req.query;
    const normalizedRole = String(role || '').trim().toLowerCase();
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const query = {};
    if (normalizedRole) query.role = normalizedRole;

    const searchText = String(search || '').trim();
    if (searchText) {
      const regex = new RegExp(escapeRegex(searchText), 'i');
      query.$or = [{ name: regex }, { email: regex }];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('_id name email role company')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      recipients: users,
      total,
      page: safePage,
      pages: Math.ceil(total / safeLimit),
    });
  } catch (error) {
    next(error);
  }
};

export const sendDocumentsToUser = async (req, res, next) => {
  let recipient = null;
  let requestedDocuments = [];

  try {
    const { userId, documents, customMessage } = req.body || {};

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User selection is required',
      });
    }

    requestedDocuments = sanitizeRequestedDocuments(documents);
    if (!requestedDocuments.length) {
      return res.status(400).json({
        success: false,
        message: 'Select at least one valid document type',
      });
    }

    recipient = await User.findById(userId).select('_id name email role');
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Selected user not found',
      });
    }

    const [latestCompletedPayment, projects] = await Promise.all([
      Payment.findOne({
        clientId: recipient._id,
        status: PAYMENT_STATUS.COMPLETED,
      })
        .sort({ paidAt: -1, createdAt: -1 })
        .populate('clientId', 'name email')
        .populate('projectId', 'title')
        .lean(),
      Project.find({ clientId: recipient._id })
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    const leadProject = projects[0] || null;
    const attachments = [];
    const sentDocuments = [];
    const skippedDocuments = [];

    for (const type of requestedDocuments) {
      if (type === ADMIN_DOCUMENT_TYPES.INVOICE) {
        if (!latestCompletedPayment) {
          skippedDocuments.push({
            type,
            reason: 'No completed payment available for invoice',
          });
          continue;
        }
        const invoiceBuffer = await generateInvoicePDF(latestCompletedPayment);
        const invoiceRef = (latestCompletedPayment.razorpayPaymentId || latestCompletedPayment._id)
          .toString()
          .slice(-8)
          .toUpperCase();
        attachments.push(
          toMailerSendAttachment(`SkyWorld-Invoice-${invoiceRef}.pdf`, invoiceBuffer)
        );
        sentDocuments.push(type);
        continue;
      }

      if (type === ADMIN_DOCUMENT_TYPES.AGREEMENT) {
        const agreementBuffer = await generateServiceAgreementPDF({
          user: recipient,
          project: leadProject,
          payment: latestCompletedPayment,
        });
        attachments.push(
          toMailerSendAttachment(
            `SkyWorld-Service-Agreement-${recipient._id.toString().slice(-6)}.pdf`,
            agreementBuffer
          )
        );
        sentDocuments.push(type);
        continue;
      }

      if (type === ADMIN_DOCUMENT_TYPES.PAYMENT_RECEIPT) {
        if (!latestCompletedPayment) {
          skippedDocuments.push({
            type,
            reason: 'No completed payment available for receipt',
          });
          continue;
        }
        const receiptBuffer = await generatePaymentReceiptPDF({
          user: recipient,
          payment: latestCompletedPayment,
        });
        attachments.push(
          toMailerSendAttachment(
            `SkyWorld-Payment-Receipt-${(latestCompletedPayment.razorpayPaymentId || latestCompletedPayment._id)
              .toString()
              .slice(-8)
              .toUpperCase()}.pdf`,
            receiptBuffer
          )
        );
        sentDocuments.push(type);
        continue;
      }

      if (type === ADMIN_DOCUMENT_TYPES.PROJECT_STAGE) {
        const stageBuffer = await generateProjectStagePDF({
          user: recipient,
          projects,
        });
        attachments.push(
          toMailerSendAttachment(
            `SkyWorld-Project-Stage-${recipient._id.toString().slice(-6)}.pdf`,
            stageBuffer
          )
        );
        sentDocuments.push(type);
      }
    }

    if (!attachments.length) {
      return res.status(400).json({
        success: false,
        message: 'No eligible document could be generated for this user',
        skipped: skippedDocuments,
      });
    }

    const safeCustomMessage = normalizeCustomMessage(customMessage);
    const { html, text } = buildDocumentDispatchEmail({
      recipientName: recipient.name,
      documentTypes: sentDocuments,
      customMessage: safeCustomMessage,
    });

    const subject = `SkyWorld Documents - ${new Date().toLocaleDateString('en-IN')}`;
    const sendResult = await mailerSendService.sendEmail({
      to: { email: recipient.email, name: recipient.name },
      subject,
      html,
      text,
      attachments,
    });

    await DocumentEmailLog.create({
      provider: 'mailersend',
      userId: recipient._id,
      sentBy: req.user._id,
      toEmail: recipient.email,
      status: 'sent',
      subject,
      messageId: sendResult.messageId || undefined,
      documentTypes: sentDocuments,
      meta: {
        skippedDocuments,
        attachmentCount: attachments.length,
      },
    });

    await createAuditLog(req, 'admin_document_email_sent', 'user', recipient._id, {
      recipientEmail: recipient.email,
      provider: 'mailersend',
      sentDocuments,
      skippedDocuments,
      messageId: sendResult.messageId || null,
    });

    invalidateDashboardSnapshotCache();

    return res.json({
      success: true,
      message: 'Documents sent successfully',
      sent: sentDocuments,
      skipped: skippedDocuments,
      messageId: sendResult.messageId || null,
    });
  } catch (error) {
    if (recipient) {
      await DocumentEmailLog.create({
        provider: 'mailersend',
        userId: recipient._id,
        sentBy: req.user?._id,
        toEmail: recipient.email,
        status: 'failed',
        documentTypes: requestedDocuments,
        errorMessage: error.message || 'Unknown send error',
      }).catch(() => null);
    }
    next(error);
  }
};
