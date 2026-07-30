'use strict';

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

const fs = require('fs');
const path = require('path');
const NITRACIK_LOGO_BASE64 = (() => {
  try {
    return fs.readFileSync(path.resolve(__dirname, './logo_base64.txt'), 'utf8').trim();
  } catch {
    console.warn('[pdfGenerator] logo_base64.txt not found, using text fallback');
    return '';
  }
})();

const APP_TIMEZONE = 'Europe/Bratislava';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return dayjs(dateStr).tz(APP_TIMEZONE).format('DD.MM.YYYY');
}

function formatCode(code) {
  if (!code) return 'XXXX-XXXX-XXXX';
  const cleaned = code.replace(/-/g, '');
  const parts = cleaned.match(/.{1,4}/g) || [cleaned];
  return parts.join('-');
}

function buildHTML({ code, amount, recipientName, buyerEmail, buyerName, message, expiresAt }) {
  const displayFrom = buyerName || buyerEmail || '—';
  const displayTo   = recipientName || '—';
  const displayAmt  = amount ? `${amount}€` : '—€';
  const displayCode = formatCode(code);
  const displayDate = formatDate(expiresAt);
  const displayNo   = code ? code.replace(/-/g, '').substring(0, 8) : 'XXXXXXXX';

  const messageRow = message
    ? `<div class="field-row">
         <span class="field-label">VENOVANIE:</span>
         <span class="field-value italic">${escapeHtml(message)}</span>
       </div>`
    : '';

  // Blob SVG path — same as GiftCertificate.jsx
  const blobPath = `M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.5,
    90,-16.3,88.5,-0.9C87,14.6,81.5,29.2,73.2,42.1C64.9,55,53.8,66.3,40.4,73.5
    C27,80.7,11.2,83.8,-3.8,82.5C-18.8,81.2,-32.9,75.5,-46.1,67.3C-59.3,59.2,
    -71.5,48.5,-77.3,35.1C-83.1,21.7,-82.5,5.7,-79.4,-9.4C-76.3,-24.6,-70.7,
    -38.9,-61.4,-50.7C-52.1,-62.5,-39.1,-71.8,-25.3,-78.4C-11.5,-85,3,-89,
    17.3,-87.7C31.5,-86.3,30.6,-83.5,44.7,-76.4Z`;

  return `<!DOCTYPE html>
<html lang="sk">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: 842px 595px;
      margin: 0;
    }

    html, body {
      width: 842px;
      height: 595px;
      font-family: 'Nunito', Arial, sans-serif;
      background: white;
      overflow: hidden;
    }

    .card {
      position: relative;
      width: 842px;
      height: 595px;
      background: white;
      border-radius: 28px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 52px 16px 52px;
      gap: 0px;
    }

    /* ── Blob decorations ── */
    .blob { position: absolute; pointer-events: none; }
    .blob-top-left  { top: -50px; left: -50px; width: 220px; opacity: 0.5; }
    .blob-top-right { top: -50px; right: -50px; width: 220px; opacity: 0.5; transform: scaleX(-1); }
    .blob-bottom-right { bottom: -70px; right: -70px; width: 280px; }

    /* ── Logo ── */
    .header {
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1;
      width: 100%;
      height: 160px;
      margin-bottom: 4px;
      flex-shrink: 0;
    }
    .logo-img {
      height: 160px;
      width: auto;
      max-width: 340px;
      object-fit: contain;
      display: block;
      mix-blend-mode: multiply;
    }

    /* ── Title ── */
    .title {
      text-align: center;
      font-size: 52px;
      font-weight: 900;
      color: #3D3D4E;
      letter-spacing: 0.04em;
      z-index: 1;
      line-height: 1;
      margin-bottom: 8px;
    }

    /* ── Divider ── */
    .divider { width: 100%; height: 2px; background: #F4A5A5; border: none; z-index: 1; margin-bottom: 0; }

    /* ── Fields ── */
    .fields {
      width: 100%;
      display: flex;
      flex-direction: column;
      z-index: 1;
      margin-top: 12px; margin-bottom: 0;
    }
    .field-row {
      display: flex;
      align-items: baseline;
      gap: 12px;
      padding: 6px 0;
      border-bottom: 1px solid #F3F4F6;
    }
    .field-label {
      font-size: 10px;
      font-weight: 900;
      color: #7A7A8C;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      width: 110px;
      flex-shrink: 0;
    }
    .field-value {
      font-size: 14px;
      font-weight: 700;
      color: #3D3D4E;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .italic { font-style: italic; color: #7A7A8C; }

    /* ── Meta row ── */
    .meta-row {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 1;
      margin-top: 8px; margin-bottom: 4px;
    }
    .meta-text { font-size: 10px; font-weight: 700; color: #9CA3AF; }

    /* ── Amount ── */
    .amount {
      text-align: center;
      font-size: 52px;
      font-weight: 900;
      color: #3D3D4E;
      z-index: 1;
      line-height: 1;
      margin-top: 8px; margin-bottom: 8px;
    }

    /* ── Code box ── */
    .code-box { display: flex; justify-content: center; z-index: 1; margin-bottom: 8px; }
    .code-inner {
      background: #FFFBEB;
      border: 2.5px dashed #F59E0B;
      border-radius: 14px;
      padding: 8px 28px;
      text-align: center;
    }
    .code-text {
      font-family: 'Courier New', monospace;
      font-size: 26px;
      font-weight: 900;
      color: #92400E;
      letter-spacing: 0.08em;
    }
    .code-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: #B45309;
      margin-top: 2px;
    }

    /* ── Validity note ── */
    .validity-note {
      width: 100%;
      text-align: center;
      font-size: 10px;
      color: #9CA3AF;
      font-weight: 600;
      z-index: 1;
      font-style: italic;
      padding: 0 20px;
    }

    /* ── Footer ── */
    .footer {
      text-align: center;
      font-size: 9px;
      color: #C4C4CC;
      z-index: 1;
      margin-top: auto;
    }
  </style>
</head>
<body>
  <div class="card">

    <!-- Blob decorations -->
    <svg class="blob blob-top-left" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <path fill="#F4A5A5" d="${blobPath}" transform="translate(100 100)"/>
    </svg>
    <svg class="blob blob-top-right" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <path fill="#F4A5A5" d="${blobPath}" transform="translate(100 100)"/>
    </svg>
    <svg class="blob blob-bottom-right" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EFE4C8" d="${blobPath}" transform="translate(100 100)"/>
    </svg>

    <!-- Logo -->
    <div class="header">
      ${NITRACIK_LOGO_BASE64
        ? `<img class="logo-img" src="${NITRACIK_LOGO_BASE64}" alt="Nitráčik" />`
        : `<span style="font-size:28px;font-weight:900;color:#3D3D4E;">Nitráčik</span>`
      }
    </div>

    <!-- Title -->
    <div class="title">DARČEKOVÝ POUKAZ</div>

    <!-- Divider -->
    <hr class="divider" />

    <!-- Fields -->
    <div class="fields">
      <div class="field-row">
        <span class="field-label">OD:</span>
        <span class="field-value">${escapeHtml(displayFrom)}</span>
      </div>
      <div class="field-row">
        <span class="field-label">PRE:</span>
        <span class="field-value">${escapeHtml(displayTo)}</span>
      </div>
      ${messageRow}
    </div>

    <!-- Meta row -->
    <div class="meta-row">
      <span class="meta-text">No. ${escapeHtml(displayNo)}</span>
      <span class="meta-text">Platnosť do: ${escapeHtml(displayDate)}</span>
    </div>

    <!-- Divider -->
    <hr class="divider" />

    <!-- Amount -->
    <div class="amount">${displayAmt}</div>

    <!-- Code box -->
    <div class="code-box">
      <div class="code-inner">
        <div class="code-text">${escapeHtml(code ? code.replace(/-/g, '') : 'XXXXXXXXXXXX')}</div>
        <div class="code-label">Váš unikátny kód · zadajte pri rezervácii</div>
      </div>
    </div>

    <!-- Validity note -->
    <div class="validity-note">
      * Poukaz je platný na všetky aktivity dostupné na nitracik.sk a nie je možné ho vymeniť za hotovosť.
    </div>

    <!-- Footer -->
    <div class="footer">© Nitráčik – Messy Sensory Play | nitracik.sk</div>

  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#39;');
}

async function generateGiftCardPDF({ code, amount, recipientName, buyerEmail, buyerName, message, expiresAt }) {
  // Lazy-load puppeteer so Jest can import server modules without parsing ESM-only internals.
  const puppeteer = require('puppeteer');
  const html = buildHTML({ code, amount, recipientName, buyerEmail, buyerName, message, expiresAt });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();

    // Set viewport to A4 landscape dimensions (842×595 px at 96dpi)
    await page.setViewport({ width: 842, height: 595, deviceScaleFactor: 2 });

    await page.setContent(html, {
      waitUntil: 'networkidle0', // wait for Google Fonts to load
      timeout: 15000,
    });

    const pdfBytes = await page.pdf({
      width: '842px',
      height: '595px',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true,
    });

    const pdfBuffer = Buffer.isBuffer(pdfBytes) ? pdfBytes : Buffer.from(pdfBytes);

    // Diagnostic safeguard: a correctly generated single-page certificate
    // should be well under 1MB. If it's larger, the print engine likely
    // added extra pages due to content overflow — log it so we notice
    // this again if it recurs, especially once deployed to the VPS.
    if (pdfBuffer.length > 1_000_000) {
      console.warn(
        `[pdfGenerator] Unexpectedly large PDF: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB ` +
        `for code=${code}. Likely multi-page overflow — check for unusually long message text.`
      );
    }

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = { generateGiftCardPDF };