// services/paymentGateway.js
// Payment gateway abstraction layer — Comgate implementation.
// To switch providers, replace only this file.

const axios = require('axios');
const qs = require('querystring');

const COMGATE_CREATE = 'https://payments.comgate.cz/v1.0/create';
const COMGATE_STATUS = 'https://payments.comgate.cz/v1.0/status';
const COMGATE_REFUND = 'https://payments.comgate.cz/v1.0/refund';

const cfg = () => ({
  merchant: process.env.COMGATE_MERCHANT,
  secret: process.env.COMGATE_SECRET,
  test: process.env.COMGATE_TEST === 'true',
});

async function post(url, params) {
  const res = await axios.post(url, qs.stringify(params), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const data = qs.parse(res.data);
  return data;
}

/**
 * Create a Comgate payment.
 * @returns {{ transId: string, redirectUrl: string }}
 */
async function createPayment({ priceEur, refId, label, returnUrl, email }) {
  const { merchant, secret, test } = cfg();

  const data = await post(COMGATE_CREATE, {
    merchant,
    secret,
    test,
    price: Math.round(priceEur * 100),
    curr: 'EUR',
    label: String(label).substring(0, 16),
    refId: String(refId),
    method: 'ALL',
    country: 'SK',
    lang: 'sk',
    email: email || '',
    prepareOnly: true,
    returnUrl,
  });

  if (data.code !== '0') {
    throw new Error(`Comgate createPayment error: ${data.message} (code ${data.code})`);
  }

  return { transId: data.transId, redirectUrl: data.redirect };
}

/**
 * Get the status of a Comgate transaction.
 * @returns {'PAID'|'PENDING'|'CANCELLED'|'EXPIRED'|'AUTHORIZED'}
 */
async function getPaymentStatus(transId) {
  const { merchant, secret } = cfg();

  const data = await post(COMGATE_STATUS, { merchant, secret, transId });

  if (data.code !== '0') {
    throw new Error(`Comgate getPaymentStatus error: ${data.message} (code ${data.code})`);
  }

  return data.status;
}

/**
 * Refund a Comgate payment (full or partial).
 * @returns {{ ok: boolean, message?: string }}
 */
async function refundPayment(transId, priceEur, refId) {
  const { merchant, secret, test } = cfg();

  const data = await post(COMGATE_REFUND, {
    merchant,
    secret,
    test,
    transId,
    amount: Math.round(priceEur * 100),
    curr: 'EUR',
    refId: String(refId),
  });

  return data.code === '0'
    ? { ok: true }
    : { ok: false, message: data.message, code: data.code };
}

module.exports = { createPayment, getPaymentStatus, refundPayment };
