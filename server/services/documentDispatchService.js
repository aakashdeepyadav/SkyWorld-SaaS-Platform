import PDFDocument from 'pdfkit';
import { ADMIN_DOCUMENT_LABELS } from '../utils/documentEmail.js';

const formatDate = (value) =>
  new Date(value || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatCurrency = (amount, currency = 'INR') => {
  const normalized = (currency || 'INR').toUpperCase();
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: normalized,
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
  } catch {
    return `${normalized} ${Number(amount || 0).toLocaleString('en-IN')}`;
  }
};

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const createPdfBuffer = (render) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 48 });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      render(doc);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });

const writeSectionTitle = (doc, title) => {
  doc.moveDown(0.4);
  doc.fontSize(12).fillColor('#0f172a').text(title, { underline: true });
  doc.moveDown(0.2);
};

const getProjectStageLabel = (project) => {
  const paymentDone = Boolean(project?.finalPaid);
  if (paymentDone) return 'Final payment done';
  if (project?.advancePaid) return 'Half payment done';
  if (project?.paymentStatus === 'completed') return 'Payment complete';
  return 'Awaiting payment';
};

export const generateServiceAgreementPDF = async ({ user, project, payment }) =>
  createPdfBuffer((doc) => {
    doc.fontSize(22).fillColor('#0ea5e9').text('SkyWorld Service Agreement');
    doc.fontSize(10).fillColor('#64748b').text(`Generated on ${formatDate(new Date())}`);
    doc.moveDown(1);

    writeSectionTitle(doc, 'Client');
    doc
      .fontSize(11)
      .fillColor('#0f172a')
      .text(`Name: ${user?.name || 'Client'}`)
      .text(`Email: ${user?.email || 'N/A'}`);

    writeSectionTitle(doc, 'Project Scope');
    doc
      .fontSize(11)
      .fillColor('#0f172a')
      .text(`Project: ${project?.title || 'Service engagement'}`)
      .text(`Category: ${project?.serviceType || 'General service'}`)
      .text(`Plan: ${project?.plan || 'Custom'}`);
    if (project?.description) {
      doc.moveDown(0.2);
      doc.text(`Description: ${project.description}`);
    }

    writeSectionTitle(doc, 'Commercial Terms');
    const total = payment?.totalPlanPrice || project?.totalPlanPrice || payment?.amount || project?.budget || 0;
    const currency = payment?.currency || 'INR';
    doc
      .fontSize(11)
      .fillColor('#0f172a')
      .text(`Total project value: ${formatCurrency(total, currency)}`)
      .text('Milestone payment model: 50% advance and 50% before final delivery')
      .text('All scope changes beyond agreed deliverables may require updated estimate and timeline');

    writeSectionTitle(doc, 'Standard Terms');
    doc
      .fontSize(10)
      .fillColor('#334155')
      .text('1. Work starts after initial confirmation and first payment acknowledgement.')
      .text('2. Client provides timely feedback and required assets/content.')
      .text('3. Delivery dates are estimates and may shift based on scope changes.')
      .text('4. Support and revisions follow the selected package terms.')
      .text('5. Final handover occurs after completion criteria are met.');

    doc.moveDown(1.2);
    doc.fontSize(10).fillColor('#64748b').text('Authorized by SkyWorld Admin');
  });

export const generatePaymentReceiptPDF = async ({ user, payment }) =>
  createPdfBuffer((doc) => {
    doc.fontSize(22).fillColor('#10b981').text('SkyWorld Payment Receipt');
    doc.fontSize(10).fillColor('#64748b').text(`Issued on ${formatDate(new Date())}`);
    doc.moveDown(1);

    writeSectionTitle(doc, 'Recipient');
    doc
      .fontSize(11)
      .fillColor('#0f172a')
      .text(`Name: ${user?.name || 'Client'}`)
      .text(`Email: ${user?.email || 'N/A'}`);

    writeSectionTitle(doc, 'Payment Details');
    const amount = payment?.amount || 0;
    const currency = payment?.currency || 'INR';
    doc
      .fontSize(11)
      .fillColor('#0f172a')
      .text(`Amount paid: ${formatCurrency(amount, currency)}`)
      .text(`Status: ${String(payment?.status || 'completed').toUpperCase()}`)
      .text(`Payment date: ${formatDate(payment?.paidAt || payment?.createdAt)}`)
      .text(`Transaction ID: ${payment?.razorpayPaymentId || payment?.transactionId || payment?._id || 'N/A'}`)
      .text(`Order ID: ${payment?.razorpayOrderId || 'N/A'}`);

    if (payment?.projectId?.title) {
      doc.moveDown(0.3);
      doc.text(`Project: ${payment.projectId.title}`);
    }

    doc.moveDown(1.2);
    doc.fontSize(10).fillColor('#64748b').text('This receipt confirms payment acknowledgement by SkyWorld.');
  });

export const generateProjectStagePDF = async ({ user, projects = [] }) =>
  createPdfBuffer((doc) => {
    doc.fontSize(22).fillColor('#0ea5e9').text('SkyWorld Project Stage Report');
    doc.fontSize(10).fillColor('#64748b').text(`Generated on ${formatDate(new Date())}`);
    doc.moveDown(1);

    writeSectionTitle(doc, 'Client');
    doc
      .fontSize(11)
      .fillColor('#0f172a')
      .text(`Name: ${user?.name || 'Client'}`)
      .text(`Email: ${user?.email || 'N/A'}`);

    writeSectionTitle(doc, 'Current Stage');
    if (!projects.length) {
      doc
        .fontSize(11)
        .fillColor('#334155')
        .text('No active project found yet. Your project will appear here once work is initiated.');
      return;
    }

    projects.slice(0, 6).forEach((project, index) => {
      doc
        .moveDown(0.4)
        .fontSize(12)
        .fillColor('#0f172a')
        .text(`${index + 1}. ${project.title || 'Project'}`);
      doc
        .fontSize(10)
        .fillColor('#334155')
        .text(`Status: ${project.status || 'planning'}`)
        .text(`Progress: ${Number(project.progress || 0)}%`)
        .text(`Payment stage: ${getProjectStageLabel(project)}`)
        .text(`Delivery status: ${project.deliveryStatus || 'pending'}`);
    });
  });

export const toMailerSendAttachment = (filename, buffer) => ({
  filename,
  content: buffer.toString('base64'),
});

export const buildDocumentDispatchEmail = ({
  recipientName,
  documentTypes,
  customMessage,
}) => {
  const safeName = escapeHtml(recipientName || 'Client');
  const docs = documentTypes
    .map((type) => ADMIN_DOCUMENT_LABELS[type] || type)
    .filter(Boolean);

  const listHtml = docs.map((doc) => `<li>${escapeHtml(doc)}</li>`).join('');
  const customBlock = customMessage
    ? `<p style="margin:12px 0;color:#334155;">${escapeHtml(customMessage)}</p>`
    : '';

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:#0ea5e9;color:#fff;padding:18px 20px;">
          <h2 style="margin:0;font-size:20px;">SkyWorld Documents</h2>
          <p style="margin:6px 0 0;font-size:13px;opacity:.9;">Your requested project documents are attached.</p>
        </div>
        <div style="padding:20px;">
          <p style="margin:0 0 10px;color:#0f172a;">Hi ${safeName},</p>
          <p style="margin:0 0 10px;color:#334155;">Please find the following documents attached:</p>
          <ul style="margin:8px 0 14px 18px;color:#1e293b;">${listHtml}</ul>
          ${customBlock}
          <p style="margin:14px 0 0;color:#334155;">For any clarification, reply to this email or contact SkyWorld support.</p>
          <p style="margin:16px 0 0;color:#64748b;font-size:12px;">This email was sent by a SkyWorld administrator.</p>
        </div>
      </div>
    </div>
  `;

  const text = [
    `Hi ${safeName},`,
    '',
    'Please find the following SkyWorld documents attached:',
    ...docs.map((doc) => `- ${doc}`),
    customMessage ? `\nAdmin message: ${customMessage}` : '',
    '',
    'For any clarification, contact SkyWorld support.',
  ]
    .filter(Boolean)
    .join('\n');

  return { html, text };
};
