import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { ADMIN_DOCUMENT_LABELS } from '../utils/documentEmail.js';

const brandColor = '#0ea5e9';
const darkColor = '#0f172a';
const accentColor = '#10b981';
const warningColor = '#f59e0b';
const grayColor = '#64748b';
const lightGray = '#f1f5f9';
const borderColor = '#e2e8f0';

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

// Add professional header with logo
const addProfessionalHeader = (doc, title, accentColorOverride = brandColor) => {
  // Top banner with brand color
  doc.rect(0, 0, 612, 80).fillColor(accentColorOverride).fill();
  
  // Company Logo/Name
  const logoPath = path.resolve('..', 'client', 'public', 'wordmark_logo_white_.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 48, 15, { height: 50 });
  } else {
    doc.fontSize(26).fillColor('#ffffff').text('SkyWorld', 48, 20);
    doc.fontSize(8).fillColor('#ffffff').text('VENTURES', 48, 50);
  }
  
  // Document title (right-aligned)
  doc
    .fontSize(20)
    .fillColor('#ffffff')
    .text(title, 320, 25, { align: 'right', width: 244 })
    .fontSize(9)
    .fillColor('rgba(255,255,255,0.7)')
    .text(`Issued ${formatDate(new Date())}`, 320, 55, { align: 'right', width: 244 });
};

const addSectionHeader = (doc, title, y = null) => {
  if (y !== null) doc.y = y;
  doc.moveDown(0.6);
  doc
    .fontSize(12)
    .fillColor(darkColor)
    .font('Helvetica-Bold')
    .text(title);
  doc
    .moveTo(48, doc.y + 4)
    .lineTo(564, doc.y + 4)
    .strokeColor(brandColor)
    .lineWidth(2)
    .stroke();
  doc.moveDown(0.4);
  doc.font('Helvetica');
};

const addInfoBox = (doc, label, value, boxColor = lightGray) => {
  const yBefore = doc.y;
  doc
    .rect(48, yBefore, 516, 45)
    .fillColor(boxColor)
    .fill();
  
  doc
    .fontSize(9)
    .fillColor(grayColor)
    .font('Helvetica-Bold')
    .text(label, 58, yBefore + 8)
    .font('Helvetica')
    .fontSize(12)
    .fillColor(darkColor)
    .text(value, 58, yBefore + 22);
  doc.moveDown();
};

const writeSectionTitle = (doc, title) => {
  doc.moveDown(0.4);
  doc.fontSize(12).fillColor('#0f172a').text(title, { underline: true });
  doc.moveDown(0.2);
};

const getProjectStageLabel = (project) => {
  const paymentDone = Boolean(project?.finalPaid);
  if (paymentDone) return 'Final payment completed';
  if (project?.advancePaid) return 'Advance payment received';
  if (project?.paymentStatus === 'completed') return 'Payment complete';
  return 'Awaiting payment';
};

export const generateServiceAgreementPDF = async ({ user, project, payment }) =>
  createPdfBuffer((doc) => {
    // Professional header
    addProfessionalHeader(doc, 'Service Agreement', brandColor);
    doc.moveDown(2);

    // Client Information
    addSectionHeader(doc, 'Client Information');
    addInfoBox(doc, 'CLIENT NAME', user?.name || 'Client');
    addInfoBox(doc, 'EMAIL ADDRESS', user?.email || 'N/A');
    doc.moveDown(0.4);

    // Project Scope
    addSectionHeader(doc, 'Project Scope');
    addInfoBox(doc, 'PROJECT TITLE', project?.title || 'Service engagement');
    addInfoBox(doc, 'SERVICE CATEGORY', project?.serviceType || 'General service', lightGray);
    addInfoBox(doc, 'PLAN TYPE', project?.plan || 'Custom');
    if (project?.description) {
      doc.moveDown(0.2);
      doc
        .fontSize(10)
        .fillColor(darkColor)
        .text('Description:', { underline: true });
      doc.fontSize(10).fillColor(grayColor).text(project.description);
      doc.moveDown(0.4);
    }

    // Commercial Terms
    addSectionHeader(doc, 'Commercial Terms');
    const total = payment?.totalPlanPrice || project?.totalPlanPrice || payment?.amount || project?.budget || 0;
    const currency = payment?.currency || 'INR';
    
    doc
      .fontSize(11)
      .fillColor(darkColor)
      .text('Total Project Value: ', { continued: true })
      .fillColor(brandColor)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(formatCurrency(total, currency));
    
    doc.moveDown(0.4);
    doc
      .fontSize(10)
      .fillColor(darkColor)
      .font('Helvetica')
      .text('Payment Structure: 50% advance + 50% on final delivery');
    
    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .fillColor(grayColor)
      .text('Additional scope changes may require updated estimates and timeline adjustments.');
    
    doc.moveDown(0.8);

    // Standard Terms
    addSectionHeader(doc, 'Terms & Conditions');
    const terms = [
      { num: 1, text: 'Work commences after initial confirmation and first payment clearance' },
      { num: 2, text: 'Client responsible for providing timely feedback and required assets' },
      { num: 3, text: 'Delivery dates are estimates subject to scope changes' },
      { num: 4, text: 'Support and revisions follow selected package guidelines' },
      { num: 5, text: 'Final handover upon completion of agreed deliverables' },
    ];

    terms.forEach(({ num, text }) => {
      doc
        .fontSize(10)
        .fillColor(darkColor)
        .font('Helvetica-Bold')
        .text(`${num}.`, { continued: true })
        .font('Helvetica')
        .fillColor(grayColor)
        .text(` ${text}`);
      doc.moveDown(0.3);
    });

    doc.moveDown(1);

    // Footer
    doc
      .moveTo(48, doc.y)
      .lineTo(564, doc.y)
      .strokeColor(borderColor)
      .lineWidth(1)
      .stroke();
    
    doc.moveDown(0.5);
    doc
      .fontSize(9)
      .fillColor(grayColor)
      .text('This agreement is between SkyWorld and the client mentioned above.', { align: 'center' })
      .text('For questions, contact: hello@skyworld.dev', { align: 'center' });
  });

export const generatePaymentReceiptPDF = async ({ user, payment }) =>
  createPdfBuffer((doc) => {
    // Professional header
    addProfessionalHeader(doc, 'Payment Receipt', accentColor);
    doc.moveDown(2);

    // Payment Status Badge
    const statusColor = payment?.status === 'completed' ? accentColor : warningColor;
    const statusText = (payment?.status || 'completed').toUpperCase();
    doc
      .rect(48, doc.y, 150, 35)
      .fillColor(statusColor)
      .fill();
    doc
      .fontSize(12)
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .text(statusText, 48, doc.y + 10, { width: 150, align: 'center' });
    doc.moveDown(2);
    doc.font('Helvetica');

    // Recipient Information
    addSectionHeader(doc, 'Recipient Information');
    addInfoBox(doc, 'RECIPIENT NAME', user?.name || 'Client');
    addInfoBox(doc, 'EMAIL ADDRESS', user?.email || 'N/A', lightGray);
    doc.moveDown(0.4);

    // Payment Details
    addSectionHeader(doc, 'Payment Details');
    const amount = payment?.amount || 0;
    const currency = payment?.currency || 'INR';
    
    // Amount highlight box
    doc
      .rect(48, doc.y, 516, 50)
      .fillColor('#f0f9ff')
      .fill();
    doc
      .fontSize(10)
      .fillColor(grayColor)
      .font('Helvetica-Bold')
      .text('AMOUNT PAID', 58, doc.y + 8)
      .font('Helvetica')
      .fontSize(18)
      .fillColor(accentColor)
      .text(formatCurrency(amount, currency), 58, doc.y + 22);
    doc.moveDown(3.2);

    // Transaction Details Grid
    const col1X = 48;
    const col2X = 310;
    const lineHeight = 24;
    let y = doc.y;

    const details = [
      { label: 'Payment Date', value: formatDate(payment?.paidAt || payment?.createdAt) },
      { label: 'Transaction ID', value: payment?.razorpayPaymentId || payment?.transactionId || payment?._id || 'N/A' },
      { label: 'Order ID', value: payment?.razorpayOrderId || 'N/A' },
      { label: 'Project', value: payment?.projectId?.title || 'General payment' },
    ];

    details.forEach(({ label, value }, idx) => {
      if (idx % 2 === 0) y = doc.y;
      doc
        .fontSize(9)
        .fillColor(grayColor)
        .font('Helvetica-Bold')
        .text(label, idx % 2 === 0 ? col1X : col2X, y);
      doc
        .fontSize(10)
        .fillColor(darkColor)
        .font('Helvetica')
        .text(value, idx % 2 === 0 ? col1X : col2X, doc.y);
      
      if (idx % 2 === 1) doc.moveDown(0.5);
    });

    doc.moveDown(1);

    // Footer
    doc
      .moveTo(48, doc.y)
      .lineTo(564, doc.y)
      .strokeColor(borderColor)
      .lineWidth(1)
      .stroke();
    
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .fillColor(darkColor)
      .text('Receipt Confirmation', { align: 'center', underline: true })
      .moveDown(0.3);
    doc
      .fontSize(9)
      .fillColor(grayColor)
      .text('This receipt confirms payment acknowledgement to SkyWorld Ventures.', { align: 'center' })
      .text('Your payment has been processed successfully.', { align: 'center' });
  });

export const generateProjectStagePDF = async ({ user, projects = [] }) =>
  createPdfBuffer((doc) => {
    // Professional header
    addProfessionalHeader(doc, 'Project Stage Report', brandColor);
    doc.moveDown(2);

    // Client Information
    addSectionHeader(doc, 'Client Information');
    addInfoBox(doc, 'CLIENT NAME', user?.name || 'Client');
    addInfoBox(doc, 'EMAIL ADDRESS', user?.email || 'N/A', lightGray);
    doc.moveDown(0.4);

    // Projects Section
    addSectionHeader(doc, 'Current Project Status');
    
    if (!projects.length) {
      doc
        .rect(48, doc.y, 516, 60)
        .fillColor(lightGray)
        .fill();
      doc
        .fontSize(11)
        .fillColor(grayColor)
        .text('No active projects yet', 58, doc.y + 15)
        .fontSize(10)
        .text('Your projects will appear here once work is initiated.', 58, doc.y);
      doc.moveDown(4);
    } else {
      projects.slice(0, 6).forEach((project, index) => {
        // Project card
        doc
          .rect(48, doc.y, 516, 100)
          .strokeColor(borderColor)
          .lineWidth(1)
          .stroke();
        
        // Project header
        doc
          .fontSize(12)
          .fillColor(darkColor)
          .font('Helvetica-Bold')
          .text(`${index + 1}. ${project.title || 'Project'}`, 58, doc.y + 8)
          .font('Helvetica');
        
        // Project details grid
        const details = [
          { label: 'Status', value: (project.status || 'planning').charAt(0).toUpperCase() + (project.status || 'planning').slice(1) },
          { label: 'Progress', value: `${Number(project.progress || 0)}%` },
          { label: 'Payment Stage', value: getProjectStageLabel(project) },
          { label: 'Delivery', value: (project.deliveryStatus || 'pending').charAt(0).toUpperCase() + (project.deliveryStatus || 'pending').slice(1) },
        ];
        
        // 2x2 grid of details
        details.forEach(({ label, value }, idx) => {
          const row = Math.floor(idx / 2);
          const col = idx % 2;
          const x = col === 0 ? 58 : 300;
          const y = doc.y + 28 + (row * 18);
          
          doc
            .fontSize(8)
            .fillColor(grayColor)
            .font('Helvetica-Bold')
            .text(label, x, y);
          doc
            .fontSize(10)
            .fillColor(darkColor)
            .font('Helvetica')
            .text(value, x, y + 12);
        });
        
        doc.moveDown(5.5);
      });
    }

    doc.moveDown(1);

    // Footer
    doc
      .moveTo(48, doc.y)
      .lineTo(564, doc.y)
      .strokeColor(borderColor)
      .lineWidth(1)
      .stroke();
    
    doc.moveDown(0.5);
    doc
      .fontSize(9)
      .fillColor(grayColor)
      .text('This is an automated report from SkyWorld.', { align: 'center' })
      .text('Contact hello@skyworld.dev for project inquiries', { align: 'center' });
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
