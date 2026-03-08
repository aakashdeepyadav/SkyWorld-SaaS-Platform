import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { ADMIN_DOCUMENT_LABELS } from '../utils/documentEmail.js';

/* ═══════════════════════════════════════════════════════════════════
   Brand Tokens
   ═══════════════════════════════════════════════════════════════════ */
const brandColor = '#37bbec';
const brandDeep = '#249fce';
const darkColor = '#0f172a';
const accentColor = '#059669';
const warningColor = '#d97706';
const grayColor = '#64748b';
const lightGray = '#f8fafc';
const lightBrand = '#ebf8ff';
const borderColor = '#e2e8f0';
const white = '#ffffff';

const COMPANY_NAME = 'SkyWorld Ventures';
const COMPANY_EMAIL = 'hello@skyworld.dev';
const COMPANY_URL = 'skyworld.dev';

/* ═══════════════════════════════════════════════════════════════════
   Formatters
   ═══════════════════════════════════════════════════════════════════ */
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
    return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  }
};

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/* ═══════════════════════════════════════════════════════════════════
   Shared PDF helpers
   ═══════════════════════════════════════════════════════════════════ */
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

const getLogoPath = (variant = 'white') => {
  const names = variant === 'white'
    ? ['wordmark_logo_white_.png', 'wordmark_logo_all_white_fullname.png']
    : ['wordmark_logo_black_fullname.png', 'wordmark_logo_coloured_fullname.png'];
  for (const name of names) {
    const p = path.resolve('..', 'client', 'public', name);
    if (fs.existsSync(p)) return p;
  }
  return null;
};

/**
 * Professional header with branded banner, logo, and document title.
 */
const addHeader = (doc, title, accent = brandColor) => {
  // Full-width banner
  doc.rect(0, 0, 612, 82).fillColor(accent).fill();

  // Subtle bottom accent strip
  doc.rect(0, 82, 612, 3).fillColor(brandDeep).fill();

  // Logo (left)
  const logoPath = getLogoPath('white');
  if (logoPath) {
    doc.image(logoPath, 48, 16, { height: 48 });
  } else {
    doc.fontSize(22).fillColor(white).font('Helvetica-Bold').text('SkyWorld', 48, 22);
    doc.fontSize(7).fillColor('rgba(255,255,255,0.8)').font('Helvetica').text('VENTURES', 48, 48);
  }

  // Document title (right)
  doc
    .fontSize(18)
    .fillColor(white)
    .font('Helvetica-Bold')
    .text(title, 300, 22, { align: 'right', width: 264 });
  doc
    .fontSize(9)
    .fillColor('rgba(255,255,255,0.75)')
    .font('Helvetica')
    .text(`Issued: ${formatDate(new Date())}`, 300, 50, { align: 'right', width: 264 });

  doc.y = 105;
};

/**
 * Section heading with left accent bar.
 */
const addSection = (doc, title) => {
  doc.moveDown(0.8);
  const y = doc.y;
  // Accent bar
  doc.rect(48, y, 3, 16).fillColor(brandColor).fill();
  doc
    .fontSize(12)
    .fillColor(darkColor)
    .font('Helvetica-Bold')
    .text(title, 58, y + 1);
  doc.font('Helvetica');
  doc.moveDown(0.5);
};

/**
 * Key-value info row.
 */
const addField = (doc, label, value) => {
  doc
    .fontSize(8)
    .fillColor(grayColor)
    .font('Helvetica-Bold')
    .text(label.toUpperCase(), 48, doc.y);
  doc
    .fontSize(11)
    .fillColor(darkColor)
    .font('Helvetica')
    .text(String(value || 'N/A'));
  doc.moveDown(0.4);
};

/**
 * Highlighted value box.
 */
const addValueBox = (doc, label, value, boxColor = lightBrand) => {
  const y = doc.y;
  doc.rect(48, y, 516, 48).fillColor(boxColor).fill();
  doc
    .fontSize(8)
    .fillColor(grayColor)
    .font('Helvetica-Bold')
    .text(label.toUpperCase(), 60, y + 8);
  doc
    .fontSize(16)
    .fillColor(darkColor)
    .font('Helvetica-Bold')
    .text(String(value), 60, y + 24);
  doc.font('Helvetica');
  doc.y = y + 56;
};

/**
 * Professional footer at page bottom.
 */
const addFooter = (doc, note = '') => {
  const y = doc.y < 700 ? 720 : doc.y + 20;
  doc
    .moveTo(48, y)
    .lineTo(564, y)
    .strokeColor(borderColor)
    .lineWidth(0.5)
    .stroke();
  doc.moveDown(0.3);
  if (note) {
    doc.fontSize(9).fillColor(darkColor).text(note, 48, y + 8, { align: 'center', width: 516 });
  }
  doc
    .fontSize(8)
    .fillColor(grayColor)
    .text(`${COMPANY_NAME}  •  ${COMPANY_URL}  •  ${COMPANY_EMAIL}`, 48, note ? y + 24 : y + 8, {
      align: 'center',
      width: 516,
    });
};

const getProjectStageLabel = (project) => {
  if (project?.finalPaid) return 'Final payment completed';
  if (project?.advancePaid) return 'Advance payment received';
  if (project?.paymentStatus === 'completed') return 'Payment complete';
  return 'Awaiting payment';
};

/* ═══════════════════════════════════════════════════════════════════
   1. SERVICE AGREEMENT
   ═══════════════════════════════════════════════════════════════════ */
export const generateServiceAgreementPDF = async ({ user, project, payment }) =>
  createPdfBuffer((doc) => {
    addHeader(doc, 'Service Agreement');

    // Client info
    addSection(doc, 'Client Information');
    addField(doc, 'Client Name', user?.name || 'Client');
    addField(doc, 'Email', user?.email || 'N/A');
    if (user?.company) addField(doc, 'Company', user.company);

    // Project scope
    addSection(doc, 'Project Scope');
    addField(doc, 'Project Title', project?.title || 'Service engagement');
    addField(doc, 'Service Category', project?.serviceType || 'General');
    addField(doc, 'Plan', project?.plan || 'Custom');
    if (project?.description) {
      doc.fontSize(10).fillColor(grayColor).text(project.description);
      doc.moveDown(0.3);
    }

    // Commercial terms
    addSection(doc, 'Commercial Terms');
    const total = payment?.totalPlanPrice || project?.totalPlanPrice || payment?.amount || project?.budget || 0;
    const currency = payment?.currency || 'INR';

    addValueBox(doc, 'Total Project Value', formatCurrency(total, currency));
    doc.moveDown(0.2);

    // Payment breakdown
    const advance = Math.round(total * 0.5);
    const final = total - advance;

    doc.fontSize(10).fillColor(darkColor);
    doc.text('Payment Structure:', { underline: false });
    doc.moveDown(0.2);

    // Payment table
    const tableY = doc.y;
    doc.rect(48, tableY, 516, 24).fillColor(darkColor).fill();
    doc.fontSize(9).fillColor(white).font('Helvetica-Bold');
    doc.text('Phase', 60, tableY + 7);
    doc.text('Amount', 350, tableY + 7, { width: 200, align: 'right' });
    doc.font('Helvetica');

    // Row 1: Advance
    const r1 = tableY + 24;
    doc.rect(48, r1, 516, 26).fillColor(lightGray).fill();
    doc.fontSize(10).fillColor(darkColor).text('50% Advance (before work begins)', 60, r1 + 7);
    doc.text(formatCurrency(advance, currency), 350, r1 + 7, { width: 200, align: 'right' });

    // Row 2: Final
    const r2 = r1 + 26;
    doc.rect(48, r2, 516, 26).fillColor(white).fill();
    doc.rect(48, r2, 516, 26).strokeColor(borderColor).lineWidth(0.5).stroke();
    doc.fontSize(10).fillColor(darkColor).text('50% Final (on delivery)', 60, r2 + 7);
    doc.text(formatCurrency(final, currency), 350, r2 + 7, { width: 200, align: 'right' });

    doc.y = r2 + 34;
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor(grayColor)
      .text('Additional scope changes may require updated estimates and timeline adjustments.');

    // Terms
    addSection(doc, 'Terms & Conditions');
    const terms = [
      'Work commences after initial confirmation and advance payment clearance.',
      'Client is responsible for providing timely feedback and required assets.',
      'Delivery dates are estimates subject to scope changes.',
      'Support and revisions follow the selected package guidelines.',
      'Final handover and source code delivery upon completion of all agreed deliverables and final payment.',
    ];
    terms.forEach((text, i) => {
      doc
        .fontSize(10)
        .fillColor(darkColor)
        .font('Helvetica-Bold')
        .text(`${i + 1}. `, { continued: true })
        .font('Helvetica')
        .fillColor(grayColor)
        .text(text);
      doc.moveDown(0.25);
    });

    addFooter(doc, 'This agreement is between SkyWorld Ventures and the above-mentioned client.');
  });

/* ═══════════════════════════════════════════════════════════════════
   2. PAYMENT RECEIPT
   ═══════════════════════════════════════════════════════════════════ */
export const generatePaymentReceiptPDF = async ({ user, payment }) =>
  createPdfBuffer((doc) => {
    addHeader(doc, 'Payment Receipt', accentColor);

    // Status badge
    const isPaid = payment?.status === 'completed';
    const badgeColor = isPaid ? accentColor : warningColor;
    const badgeText = isPaid ? 'PAID' : (payment?.status || 'PENDING').toUpperCase();

    const badgeY = doc.y;
    doc.roundedRect(48, badgeY, 120, 28, 4).fillColor(badgeColor).fill();
    doc.fontSize(11).fillColor(white).font('Helvetica-Bold')
      .text(badgeText, 48, badgeY + 8, { width: 120, align: 'center' });
    doc.font('Helvetica');

    // Payment phase tag
    const phase = payment?.paymentPhase || 'advance';
    const phaseLabel = phase === 'final' ? 'Final Payment' : 'Advance Payment';
    doc.roundedRect(178, badgeY, 130, 28, 4).strokeColor(brandColor).lineWidth(1).stroke();
    doc.fontSize(10).fillColor(brandColor).font('Helvetica-Bold')
      .text(phaseLabel, 178, badgeY + 8, { width: 130, align: 'center' });
    doc.font('Helvetica');
    doc.y = badgeY + 40;

    // Recipient
    addSection(doc, 'Recipient');
    addField(doc, 'Name', user?.name || 'Client');
    addField(doc, 'Email', user?.email || 'N/A');

    // Amount
    addSection(doc, 'Payment Details');
    const amount = payment?.amount || 0;
    const currency = payment?.currency || 'INR';
    addValueBox(doc, 'Amount Paid', formatCurrency(amount, currency));

    // Transaction grid
    doc.moveDown(0.3);
    const details = [
      ['Payment Date', formatDate(payment?.paidAt || payment?.createdAt)],
      ['Payment Phase', phaseLabel],
      ['Transaction ID', payment?.razorpayPaymentId || payment?.transactionId || payment?._id || 'N/A'],
      ['Order ID', payment?.razorpayOrderId || 'N/A'],
      ['Project', payment?.projectId?.title || 'General payment'],
      ['Invoice No.', payment?.invoiceNumber || 'N/A'],
    ];

    const col1 = 48;
    const col2 = 310;
    details.forEach(([label, value], idx) => {
      const x = idx % 2 === 0 ? col1 : col2;
      if (idx % 2 === 0) doc.y = idx === 0 ? doc.y : doc.y;
      const yPos = doc.y;
      doc.fontSize(8).fillColor(grayColor).font('Helvetica-Bold').text(label.toUpperCase(), x, yPos);
      doc.fontSize(10).fillColor(darkColor).font('Helvetica').text(String(value), x);
      if (idx % 2 === 1) doc.moveDown(0.5);
    });

    // Total project context
    if (payment?.totalPlanPrice) {
      doc.moveDown(0.5);
      doc.moveTo(48, doc.y).lineTo(564, doc.y).strokeColor(borderColor).lineWidth(0.5).stroke();
      doc.moveDown(0.4);
      doc.fontSize(9).fillColor(grayColor).text('TOTAL PROJECT VALUE', 48);
      doc.fontSize(12).fillColor(darkColor).font('Helvetica-Bold')
        .text(formatCurrency(payment.totalPlanPrice, currency));
      doc.font('Helvetica');
      if (phase === 'advance') {
        doc.fontSize(9).fillColor(warningColor)
          .text(`Balance due on delivery: ${formatCurrency(payment.totalPlanPrice - amount, currency)}`);
      } else {
        doc.fontSize(9).fillColor(accentColor).text('Project fully paid — thank you!');
      }
    }

    addFooter(doc, 'This receipt confirms payment to SkyWorld Ventures.');
  });

/* ═══════════════════════════════════════════════════════════════════
   3. PROJECT STAGE REPORT
   ═══════════════════════════════════════════════════════════════════ */
export const generateProjectStagePDF = async ({ user, projects = [] }) =>
  createPdfBuffer((doc) => {
    addHeader(doc, 'Project Stage Report');

    addSection(doc, 'Client');
    addField(doc, 'Name', user?.name || 'Client');
    addField(doc, 'Email', user?.email || 'N/A');

    addSection(doc, 'Project Status');

    if (!projects.length) {
      doc.rect(48, doc.y, 516, 50).fillColor(lightGray).fill();
      doc.fontSize(11).fillColor(grayColor)
        .text('No active projects yet.', 60, doc.y + 10)
        .fontSize(10)
        .text('Projects will appear here once work is initiated.', 60);
      doc.moveDown(3);
    } else {
      projects.slice(0, 6).forEach((project, index) => {
        const cardY = doc.y;

        // Card border
        doc.rect(48, cardY, 516, 90).strokeColor(borderColor).lineWidth(0.5).stroke();
        // Left accent
        doc.rect(48, cardY, 4, 90).fillColor(brandColor).fill();

        // Title
        doc.fontSize(12).fillColor(darkColor).font('Helvetica-Bold')
          .text(`${index + 1}. ${project.title || 'Untitled Project'}`, 62, cardY + 10, { width: 490 });
        doc.font('Helvetica');

        // Progress bar
        const progress = Number(project.progress || 0);
        const barY = cardY + 30;
        doc.rect(62, barY, 200, 8).fillColor('#e2e8f0').fill();
        if (progress > 0) {
          doc.rect(62, barY, Math.max(4, progress * 2), 8).fillColor(brandColor).fill();
        }
        doc.fontSize(8).fillColor(grayColor).text(`${progress}%`, 270, barY - 1);

        // Details grid
        const dets = [
          ['Status', (project.status || 'planning').replace(/^\w/, c => c.toUpperCase())],
          ['Delivery', (project.deliveryStatus || 'pending').replace(/^\w/, c => c.toUpperCase())],
          ['Payment', getProjectStageLabel(project)],
        ];
        dets.forEach(([label, val], i) => {
          const x = 62 + i * 170;
          doc.fontSize(7).fillColor(grayColor).font('Helvetica-Bold').text(label.toUpperCase(), x, cardY + 48);
          doc.fontSize(10).fillColor(darkColor).font('Helvetica').text(val, x, cardY + 60, { width: 160 });
        });

        doc.y = cardY + 98;
      });
    }

    addFooter(doc, 'Automated project report from SkyWorld.');
  });

/* ═══════════════════════════════════════════════════════════════════
   Attachment + Email helpers
   ═══════════════════════════════════════════════════════════════════ */
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

  const listHtml = docs.map((d) => `<li style="margin:4px 0;color:#1e293b;">${escapeHtml(d)}</li>`).join('');
  const customBlock = customMessage
    ? `<p style="margin:14px 0;color:#334155;line-height:1.6;">${escapeHtml(customMessage)}</p>`
    : '';

  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;padding:32px 16px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">

        <!-- Header -->
        <div style="background:#37bbec;padding:24px 28px;">
          <h2 style="margin:0;font-size:20px;color:#ffffff;font-weight:700;">SkyWorld Ventures</h2>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.85);">Your project documents are attached below.</p>
        </div>

        <!-- Body -->
        <div style="padding:28px;">
          <p style="margin:0 0 12px;color:#0f172a;font-size:15px;">Hi ${safeName},</p>
          <p style="margin:0 0 14px;color:#334155;font-size:14px;line-height:1.6;">Please find the following documents attached to this email:</p>
          <ul style="margin:8px 0 16px 20px;padding:0;font-size:14px;">${listHtml}</ul>
          ${customBlock}
          <p style="margin:16px 0 0;color:#334155;font-size:14px;line-height:1.6;">For any questions, simply reply to this email or reach us at <a href="mailto:hello@skyworld.dev" style="color:#37bbec;text-decoration:none;">hello@skyworld.dev</a>.</p>
        </div>

        <!-- Footer -->
        <div style="border-top:1px solid #e2e8f0;padding:16px 28px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#94a3b8;">SkyWorld Ventures &bull; skyworld.dev &bull; hello@skyworld.dev</p>
        </div>

      </div>
    </div>
  `;

  const text = [
    `Hi ${safeName},`,
    '',
    'Please find the following SkyWorld documents attached:',
    ...docs.map((d) => `- ${d}`),
    customMessage ? `\nMessage: ${customMessage}` : '',
    '',
    'For any questions, contact hello@skyworld.dev',
    '',
    `${COMPANY_NAME} • ${COMPANY_URL}`,
  ]
    .filter(Boolean)
    .join('\n');

  return { html, text };
};
