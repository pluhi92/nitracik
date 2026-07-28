const PDFDocument = require('pdfkit');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

// ── Constants ────────────────────────────────────────────────────────────────
const PAGE_WIDTH = 841.89; // A4 landscape
const PAGE_HEIGHT = 595.28; // A4 landscape
const MARGIN = 40;

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format a 12‑character code as XXXX-XXXX-XXXX.
 */
function formatCode(code) {
  if (!code || code.length !== 12) return code || '';
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
}

// ── Main export ──────────────────────────────────────────────────────────────

/**
 * Generate a gift‑card PDF and return it as a Buffer.
 *
 * @param {Object}   params
 * @param {string}   params.code          - 12‑char gift code
 * @param {number}   params.amount        - EUR amount
 * @param {string}   params.recipientName - gift recipient
 * @param {string}   params.buyerEmail    - purchaser email
 * @param {string}   [params.message]     - optional personal message
 * @param {string}   params.expiresAt     - ISO‑8601 expiry date
 * @returns {Promise<Buffer>}
 */
async function generateGiftCardPDF({
  code,
  amount,
  recipientName,
  buyerEmail,
  message,
  expiresAt,
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [PAGE_WIDTH, PAGE_HEIGHT],
        margins: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        bufferPages: false,
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── 1. HEADER ROW ────────────────────────────────────────────────────
      const headerY = 50;

      // Logo placeholder – rounded rect 80×80pt
      doc.roundedRect(50, headerY, 80, 80, 8);
      doc.stroke('#D1D5DB');

      // Centered "N" inside the logo box
      doc.font('Helvetica-Bold').fontSize(36).fillColor('#3D3D4E');
      doc.text('N', 50, headerY + 8, {
        width: 80,
        align: 'center',
      });

      // Brand name
      doc.font('Helvetica-Bold').fontSize(28).fillColor('#3D3D4E');
      doc.text('Nitráčik', 150, headerY + 10);

      // Sub‑title with letter‑spacing effect
      doc.font('Helvetica').fontSize(10).fillColor('#7A7A8C');
      doc.text('M E S S Y   S E N S O R Y   P L A Y', 150, headerY + 50);

      // ── 2. TITLE ────────────────────────────────────────────────────────
      doc.font('Helvetica-Bold').fontSize(42).fillColor('#3D3D4E');
      doc.text('DARČEKOVÝ POUKAZ', 0, 160, {
        align: 'center',
        width: PAGE_WIDTH,
      });

      // ── 3. PINK DECORATIVE LINE ──────────────────────────────────────────
      doc.strokeColor('#F4A5A5').lineWidth(3);
      doc.moveTo(MARGIN, 220).lineTo(PAGE_WIDTH - MARGIN, 220).stroke();

      // ── 4. FIELDS SECTION ───────────────────────────────────────────────
      let yPos = 250;
      const leftX = 50;

      /**
       * Draw a single labelled field with a bottom border.
       */
      function drawField(y, label, value) {
        // Label – uppercase, small, muted
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#7A7A8C');
        doc.text(label.toUpperCase(), leftX, y);

        // Value
        doc.font('Helvetica').fontSize(14).fillColor('#3D3D4E');
        const displayValue =
          value === null || value === undefined || value === '' ? '—' : value;
        doc.text(displayValue, leftX, y + 13);

        // Thin bottom border (full usable width)
        doc.strokeColor('#E5E7EB').lineWidth(0.5);
        doc.moveTo(MARGIN, y + 35).lineTo(PAGE_WIDTH - MARGIN, y + 35).stroke();
      }

      // Field a) OD: buyerEmail
      drawField(yPos, 'OD:', buyerEmail);
      yPos += 55;

      // Field b) PRE: recipientName
      drawField(yPos, 'PRE:', recipientName);
      yPos += 55;

      // Field c) VENOVANIE: message – skip entire row when empty
      if (message && message.trim().length > 0) {
        drawField(yPos, 'VENOVANIE:', message);
        yPos += 55;
      }

      // ── 5. BOTTOM ROW (dynamic Y after fields) ──────────────────────────
      const bottomRowY = yPos + 15;

      // Left – code prefix
      doc.font('Helvetica').fontSize(10).fillColor('#9CA3AF');
      doc.text(`No. ${code.substring(0, 8)}`, leftX, bottomRowY);

      // Right – expiry date
      const expDate = dayjs(expiresAt)
        .tz('Europe/Bratislava')
        .format('DD.MM.YYYY');
      const rightText = `Platnosť poukazu je do: ${expDate}`;
      const rightTextWidth = doc.widthOfString(rightText);
      doc.text(rightText, PAGE_WIDTH - MARGIN - rightTextWidth, bottomRowY);

      // ── 6. AMOUNT ───────────────────────────────────────────────────────
      const amountY = bottomRowY + 50;
      doc.font('Helvetica-Bold').fontSize(64).fillColor('#3D3D4E');
      doc.text(`${amount}€`, 0, amountY, {
        align: 'center',
        width: PAGE_WIDTH,
      });

      // ── 7. CODE BOX ─────────────────────────────────────────────────────
      const codeBoxY = amountY + 70;
      const codeBoxWidth = 300;
      const codeBoxHeight = 40;
      const codeBoxX = (PAGE_WIDTH - codeBoxWidth) / 2;

      // Filled background with border
      doc.roundedRect(codeBoxX, codeBoxY, codeBoxWidth, codeBoxHeight, 6);
      doc.fill('#FFFBEB');
      // Redraw path for stroke (fill consumes the path)
      doc.roundedRect(codeBoxX, codeBoxY, codeBoxWidth, codeBoxHeight, 6);
      doc.strokeColor('#F59E0B').lineWidth(1.5).stroke();

      // Code text centered inside the box
      const formattedCode = formatCode(code);
      doc.font('Helvetica-Bold').fontSize(20).fillColor('#92400E');
      doc.text(formattedCode, codeBoxX, codeBoxY + 10, {
        width: codeBoxWidth,
        align: 'center',
      });

      // ── 8. FOOTER ───────────────────────────────────────────────────────
      doc.font('Helvetica').fontSize(9).fillColor('#9CA3AF');
      doc.text('© Nitráčik – Messy Sensory Play | nitracik.sk', 0, 580, {
        align: 'center',
        width: PAGE_WIDTH,
      });

      // Finalise the PDF stream
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateGiftCardPDF };