import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

/**
 * Generate a branded PDF invoice from a payment record.
 *
 * @param {object} payment  — Payment document (populated with client & project)
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

            const brandColor = '#0ea5e9';
            const darkColor = '#0f172a';
            const grayColor = '#64748b';
            const lightGray = '#f1f5f9';

            // ── Header ──────────────────────────────────────────────────────
            // Try to embed the actual logo image
            const logoPath = path.resolve('..', 'client', 'public', 'wordmark_logo_black_fullname.png');
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 50, 35, { height: 50 });
            } else {
                // Fallback to text if logo file not found
                doc
                    .fontSize(24)
                    .fillColor(brandColor)
                    .text('SkyWorld', 50, 45, { continued: false })
                    .fontSize(9)
                    .fillColor(grayColor)
                    .text('V E N T U R E S', 50, 72);
            }

            // Invoice tag (right-aligned)
            doc
                .fontSize(28)
                .fillColor(darkColor)
                .text('INVOICE', 350, 45, { align: 'right' })
                .fontSize(10)
                .fillColor(grayColor)
                .text(`#${(payment.razorpayPaymentId || payment._id).toString().slice(-8).toUpperCase()}`, 350, 78, { align: 'right' });

            // Divider
            doc
                .moveTo(50, 100)
                .lineTo(545, 100)
                .strokeColor(brandColor)
                .lineWidth(2)
                .stroke();

            // ── Billing Details ─────────────────────────────────────────────
            const clientName = payment.clientId?.name || opts.clientName || 'Client';
            const clientEmail = payment.clientId?.email || opts.clientEmail || '';
            const projectTitle = payment.projectId?.title || opts.projectTitle || 'Service';

            // From
            doc
                .fontSize(9)
                .fillColor(grayColor)
                .text('FROM', 50, 120)
                .fontSize(11)
                .fillColor(darkColor)
                .text('SkyWorld Ventures', 50, 134)
                .fontSize(9)
                .fillColor(grayColor)
                .text('hello@skyworld.dev', 50, 148);

            // To
            doc
                .fontSize(9)
                .fillColor(grayColor)
                .text('BILL TO', 300, 120)
                .fontSize(11)
                .fillColor(darkColor)
                .text(clientName, 300, 134)
                .fontSize(9)
                .fillColor(grayColor)
                .text(clientEmail, 300, 148);

            // ── Invoice Meta ────────────────────────────────────────────────
            const issueDate = new Date(payment.createdAt || Date.now()).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'long', day: 'numeric',
            });
            const status = payment.status === 'completed' ? 'PAID' : payment.status.toUpperCase();

            doc
                .fontSize(9)
                .fillColor(grayColor)
                .text('DATE', 50, 185)
                .fillColor(darkColor)
                .text(issueDate, 50, 198)
                .fillColor(grayColor)
                .text('STATUS', 300, 185)
                .fillColor(status === 'PAID' ? '#059669' : '#dc2626')
                .text(status, 300, 198);

            // ── Line Items Table ────────────────────────────────────────────
            const tableTop = 240;

            // Header row
            doc
                .rect(50, tableTop, 495, 28)
                .fillColor(darkColor)
                .fill();

            doc
                .fontSize(9)
                .fillColor('#ffffff')
                .text('DESCRIPTION', 60, tableTop + 9)
                .text('QTY', 340, tableTop + 9, { width: 50, align: 'center' })
                .text('RATE', 400, tableTop + 9, { width: 60, align: 'right' })
                .text('AMOUNT', 470, tableTop + 9, { width: 70, align: 'right' });

            // Data row
            const rowY = tableTop + 32;
            const amount = payment.amount || 0;
            const currency = (payment.currency || 'INR').toUpperCase();
            const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;

            doc
                .rect(50, rowY, 495, 32)
                .fillColor(lightGray)
                .fill();

            doc
                .fontSize(10)
                .fillColor(darkColor)
                .text(projectTitle, 60, rowY + 10, { width: 270 })
                .text('1', 340, rowY + 10, { width: 50, align: 'center' })
                .text(`${symbol}${amount.toLocaleString('en-IN')}`, 400, rowY + 10, { width: 60, align: 'right' })
                .text(`${symbol}${amount.toLocaleString('en-IN')}`, 470, rowY + 10, { width: 70, align: 'right' });

            // ── Total ───────────────────────────────────────────────────────
            const totalY = rowY + 50;

            doc
                .moveTo(350, totalY)
                .lineTo(545, totalY)
                .strokeColor('#e2e8f0')
                .lineWidth(1)
                .stroke();

            doc
                .fontSize(10)
                .fillColor(grayColor)
                .text('Subtotal', 350, totalY + 10)
                .fillColor(darkColor)
                .text(`${symbol}${amount.toLocaleString('en-IN')}`, 470, totalY + 10, { width: 70, align: 'right' });

            doc
                .fontSize(13)
                .fillColor(darkColor)
                .text('Total', 350, totalY + 35)
                .fontSize(14)
                .fillColor(brandColor)
                .text(`${symbol}${amount.toLocaleString('en-IN')}`, 440, totalY + 35, { width: 100, align: 'right' });

            // ── Payment Info ────────────────────────────────────────────────
            if (payment.razorpayPaymentId) {
                doc
                    .fontSize(8)
                    .fillColor(grayColor)
                    .text(`Payment ID: ${payment.razorpayPaymentId}`, 50, totalY + 80)
                    .text(`Order ID: ${payment.razorpayOrderId || 'N/A'}`, 50, totalY + 94);
            }

            // ── Footer ──────────────────────────────────────────────────────
            doc
                .fontSize(8)
                .fillColor(grayColor)
                .text('Thank you for your business!', 50, 720, { align: 'center', width: 495 })
                .text('skyworld.dev • hello@skyworld.dev', 50, 733, { align: 'center', width: 495 });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}
