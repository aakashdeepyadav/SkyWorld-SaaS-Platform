import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

/* ═══════════════════════════════════════════════════════════════════
   Brand Tokens
   ═══════════════════════════════════════════════════════════════════ */
const brandColor = '#37bbec';
const brandDeep = '#249fce';
const darkColor = '#0f172a';
const grayColor = '#64748b';
const lightGray = '#f8fafc';
const lightBrand = '#ebf8ff';
const borderColor = '#e2e8f0';
const paidGreen = '#059669';
const white = '#ffffff';

const COMPANY_NAME = 'SkyWorld Ventures';
const COMPANY_EMAIL = 'hello@skyworld.dev';
const COMPANY_URL = 'skyworld.dev';

/* ═══════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════ */
const getLogoPath = () => {
    const names = ['wordmark_logo_white_.png', 'wordmark_logo_all_white_fullname.png'];
    for (const name of names) {
        const p = path.resolve('..', 'client', 'public', name);
        if (fs.existsSync(p)) return p;
    }
    return null;
};

const fmt = (amount) => {
    const n = Number(amount || 0);
    return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtDate = (value) =>
    new Date(value || Date.now()).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

/**
 * Generate a professionally branded PDF invoice.
 *
 * Supports the 2-step payment model (50% advance + 50% final).
 * When payment is an advance, shows "Balance Due".
 * When payment is the final, shows the full project breakdown.
 *
 * @param {object} payment  — Payment document (populated with clientId & projectId)
 * @param {object} [opts]   — Optional overrides
 * @returns {Promise<Buffer>} — PDF as a Buffer
 */
export async function generateInvoicePDF(payment, opts = {}) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const buffers = [];

            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const clientName = payment.clientId?.name || opts.clientName || 'Client';
            const clientEmail = payment.clientId?.email || opts.clientEmail || '';
            const projectTitle = payment.projectId?.title || opts.projectTitle || 'Service';
            const amount = payment.amount || 0;
            const totalProject = payment.totalPlanPrice || amount;
            const phase = payment.paymentPhase || 'advance';
            const isAdvance = phase !== 'final';
            const isPaid = payment.status === 'completed';
            const invoiceId = payment.invoiceNumber
                || `INV-${(payment.razorpayPaymentId || payment._id || '').toString().slice(-8).toUpperCase()}`;

            /* ── Header Banner ─────────────────────────────────────────── */
            doc.rect(0, 0, 612, 82).fillColor(brandColor).fill();
            doc.rect(0, 82, 612, 3).fillColor(brandDeep).fill();

            // Logo (left)
            const logoPath = getLogoPath();
            if (logoPath) {
                doc.image(logoPath, 50, 16, { height: 48 });
            } else {
                doc.fontSize(22).fillColor(white).font('Helvetica-Bold').text('SkyWorld', 50, 22);
                doc.fontSize(7).fillColor('rgba(255,255,255,0.8)').font('Helvetica').text('VENTURES', 50, 48);
            }

            // INVOICE title (right)
            doc.fontSize(22).fillColor(white).font('Helvetica-Bold')
                .text('INVOICE', 350, 20, { align: 'right', width: 212 });
            doc.fontSize(10).fillColor('rgba(255,255,255,0.8)').font('Helvetica')
                .text(invoiceId, 350, 48, { align: 'right', width: 212 });

            /* ── From / To ─────────────────────────────────────────────── */
            doc.y = 105;

            // From box
            doc.fontSize(8).fillColor(grayColor).font('Helvetica-Bold').text('FROM', 50, 105);
            doc.fontSize(11).fillColor(darkColor).font('Helvetica').text(COMPANY_NAME, 50, 118);
            doc.fontSize(9).fillColor(grayColor).text(COMPANY_EMAIL, 50, 132);
            doc.text(COMPANY_URL, 50, 144);

            // To box
            doc.fontSize(8).fillColor(grayColor).font('Helvetica-Bold').text('BILL TO', 350, 105);
            doc.fontSize(11).fillColor(darkColor).font('Helvetica').text(clientName, 350, 118);
            doc.fontSize(9).fillColor(grayColor).text(clientEmail, 350, 132);

            /* ── Invoice Meta ──────────────────────────────────────────── */
            const metaY = 170;
            doc.moveTo(50, metaY).lineTo(562, metaY).strokeColor(borderColor).lineWidth(0.5).stroke();

            // Date
            doc.fontSize(8).fillColor(grayColor).font('Helvetica-Bold').text('DATE', 50, metaY + 10);
            doc.fontSize(10).fillColor(darkColor).font('Helvetica').text(fmtDate(payment.paidAt || payment.createdAt), 50, metaY + 22);

            // Payment Phase
            doc.fontSize(8).fillColor(grayColor).font('Helvetica-Bold').text('PAYMENT PHASE', 200, metaY + 10);
            doc.fontSize(10).fillColor(darkColor).font('Helvetica')
                .text(isAdvance ? 'Advance (50%)' : 'Final (50%)', 200, metaY + 22);

            // Status
            doc.fontSize(8).fillColor(grayColor).font('Helvetica-Bold').text('STATUS', 400, metaY + 10);
            const statusLabel = isPaid ? 'PAID' : (payment.status || 'PENDING').toUpperCase();
            doc.fontSize(10).fillColor(isPaid ? paidGreen : '#dc2626').font('Helvetica-Bold')
                .text(statusLabel, 400, metaY + 22);
            doc.font('Helvetica');

            /* ── Line Items Table ──────────────────────────────────────── */
            const tableTop = metaY + 55;

            // Table header
            doc.rect(50, tableTop, 512, 30).fillColor(darkColor).fill();
            doc.fontSize(9).fillColor(white).font('Helvetica-Bold');
            doc.text('DESCRIPTION', 62, tableTop + 10);
            doc.text('AMOUNT', 462, tableTop + 10, { width: 90, align: 'right' });
            doc.font('Helvetica');

            // Row: This payment
            const r1 = tableTop + 30;
            doc.rect(50, r1, 512, 32).fillColor(lightGray).fill();
            const phaseDesc = isAdvance
                ? `${projectTitle} — Advance Payment (50%)`
                : `${projectTitle} — Final Payment (50%)`;
            doc.fontSize(10).fillColor(darkColor).text(phaseDesc, 62, r1 + 10, { width: 380 });
            doc.fontSize(10).fillColor(darkColor).text(fmt(amount), 462, r1 + 10, { width: 90, align: 'right' });

            /* ── Summary ───────────────────────────────────────────────── */
            const sumY = r1 + 52;
            doc.moveTo(350, sumY).lineTo(562, sumY).strokeColor(borderColor).lineWidth(0.5).stroke();

            // This payment
            doc.fontSize(10).fillColor(grayColor).text('This Invoice', 350, sumY + 12);
            doc.fontSize(10).fillColor(darkColor).text(fmt(amount), 462, sumY + 12, { width: 90, align: 'right' });

            // Total project value
            doc.fontSize(10).fillColor(grayColor).text('Total Project Value', 350, sumY + 32);
            doc.fontSize(10).fillColor(darkColor).text(fmt(totalProject), 462, sumY + 32, { width: 90, align: 'right' });

            // Divider
            doc.moveTo(350, sumY + 52).lineTo(562, sumY + 52).strokeColor(borderColor).lineWidth(0.5).stroke();

            // Balance or Fully Paid
            if (isAdvance) {
                const balance = totalProject - amount;
                doc.fontSize(11).fillColor(grayColor).font('Helvetica-Bold').text('Balance Due', 350, sumY + 62);
                doc.fontSize(13).fillColor('#dc2626').text(fmt(balance), 440, sumY + 60, { width: 112, align: 'right' });
            } else {
                doc.fontSize(11).fillColor(grayColor).font('Helvetica-Bold').text('Balance Due', 350, sumY + 62);
                doc.fontSize(13).fillColor(paidGreen).text(fmt(0), 440, sumY + 60, { width: 112, align: 'right' });
                // Fully paid badge
                doc.roundedRect(350, sumY + 85, 202, 24, 4).fillColor('#ecfdf5').fill();
                doc.fontSize(10).fillColor(paidGreen).font('Helvetica-Bold')
                    .text('✓  Project Fully Paid', 350, sumY + 91, { width: 202, align: 'center' });
            }
            doc.font('Helvetica');

            /* ── Payment Info ──────────────────────────────────────────── */
            if (payment.razorpayPaymentId || payment.transactionId) {
                const infoY = sumY + 125;
                doc.moveTo(50, infoY).lineTo(562, infoY).strokeColor(borderColor).lineWidth(0.5).stroke();
                doc.fontSize(8).fillColor(grayColor).font('Helvetica-Bold').text('PAYMENT DETAILS', 50, infoY + 10);
                doc.font('Helvetica');

                const payInfo = [
                    ['Payment ID', payment.razorpayPaymentId || payment.transactionId || 'N/A'],
                    ['Order ID', payment.razorpayOrderId || 'N/A'],
                    ['Method', (payment.paymentMethod || 'Online').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())],
                ];
                payInfo.forEach(([label, val], i) => {
                    const x = 50 + i * 175;
                    doc.fontSize(8).fillColor(grayColor).text(label, x, infoY + 26);
                    doc.fontSize(9).fillColor(darkColor).text(val, x, infoY + 38);
                });
            }

            /* ── Footer ────────────────────────────────────────────────── */
            doc.moveTo(50, 720).lineTo(562, 720).strokeColor(borderColor).lineWidth(0.5).stroke();
            doc.fontSize(9).fillColor(darkColor)
                .text('Thank you for your business!', 50, 730, { align: 'center', width: 512 });
            doc.fontSize(8).fillColor(grayColor)
                .text(`${COMPANY_NAME}  •  ${COMPANY_URL}  •  ${COMPANY_EMAIL}`, 50, 744, { align: 'center', width: 512 });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}
