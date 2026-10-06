// E2E - Pending payment order expiry grace period
//
// Guards the fix for a timezone bug: pending gift card / season ticket orders used to be
// inserted with a JS `Date` (+2h) into a `timestamp without time zone` column, so the
// stored expiry ended up equal to createdAt (the UTC serialization cancelled the local
// timezone offset). The 2h grace period must be real.

const request = require('supertest');
const bcrypt = require('bcryptjs');
const { cleanupTestData, pool } = require('./setup');

jest.mock('../services/paymentGateway');

jest.mock('../services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendUserBookingEmail: jest.fn().mockResolvedValue(true),
  sendAdultBookingEmail: jest.fn().mockResolvedValue(true),
  sendAdminBookingEmail: jest.fn().mockResolvedValue(true),
  sendAdminNewBookingNotification: jest.fn().mockResolvedValue(true),
  sendSeasonTicketConfirmation: jest.fn().mockResolvedValue(true),
  sendAdminSeasonTicketPurchase: jest.fn().mockResolvedValue(true),
  sendPaymentFailedEmail: jest.fn().mockResolvedValue(true),
  sendGiftCardEmail: jest.fn().mockResolvedValue(true),
  sendAdminGiftCardPurchaseNotification: jest.fn().mockResolvedValue(true),
}));

jest.mock('../utils/pdfGenerator', () => ({
  generateGiftCardPDF: jest.fn().mockResolvedValue(
    Uint8Array.from(Buffer.from('%PDF-1.4\nmock gift card pdf', 'ascii'))
  ),
}));

const { app, pool: serverPool } = require('../server');
const paymentGateway = require('../services/paymentGateway');

const EXPECTED_SECONDS = 2 * 60 * 60; // 7200

async function createVerifiedUser(email) {
  const hashedPassword = await bcrypt.hash('TestPass123', 10);
  const result = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password, address, verified, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (email) DO UPDATE SET password = $4, verified = $6
     RETURNING *`,
    ['Expiry', 'Tester', email, hashedPassword, 'Test address 123', true, 'user']
  );
  return result.rows[0];
}

async function loginAsUser(email) {
  const agent = request.agent(app);
  const response = await agent.post('/api/login').send({ email, password: 'TestPass123' });
  if (response.status !== 200) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(response.body)}`);
  }
  return agent;
}

async function getGiftCardExpirySeconds(buyerEmail) {
  const result = await pool.query(
    `SELECT EXTRACT(EPOCH FROM ("expiresAt" - "createdAt"))::int AS seconds
     FROM pending_gift_card_orders
     WHERE "buyerEmail" = $1
     ORDER BY id DESC LIMIT 1`,
    [buyerEmail]
  );
  return result.rows[0] ? result.rows[0].seconds : null;
}

async function getSeasonTicketExpirySeconds(productId) {
  const result = await pool.query(
    `SELECT EXTRACT(EPOCH FROM ("expiresAt" - "createdAt"))::int AS seconds
     FROM pending_season_ticket_orders
     WHERE "productId" = $1
     ORDER BY id DESC LIMIT 1`,
    [productId]
  );
  return result.rows[0] ? result.rows[0].seconds : null;
}

describe('E2E - Pending payment order expiry grace period', () => {
  beforeAll(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await pool.end();
    await serverPool.end();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    paymentGateway.createPayment.mockResolvedValue({
      transId: `mock-exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      redirectUrl: 'https://payments.comgate.cz/mock',
    });
    paymentGateway.getPaymentStatus.mockResolvedValue('PAID');
    paymentGateway.refundPayment.mockResolvedValue({ ok: true });

    await pool.query('DELETE FROM pending_gift_card_orders');
    await pool.query('DELETE FROM pending_season_ticket_orders');
  });

  test('gift card pending order gets a real 2h grace period', async () => {
    const buyerEmail = `test_gc_expiry_${Date.now()}@example.com`;

    const res = await request(app).post('/api/create-gift-card-session').send({
      amount: 30,
      buyerEmail,
      buyerName: 'Expiry Tester',
      recipientName: 'Recipient',
    });

    expect(res.status).toBe(200);

    const seconds = await getGiftCardExpirySeconds(buyerEmail);
    expect(seconds).not.toBeNull();
    expect(seconds).toBeGreaterThanOrEqual(EXPECTED_SECONDS - 1);
    expect(seconds).toBeLessThanOrEqual(EXPECTED_SECONDS + 1);
  });

  test('season ticket pending order gets a real 2h grace period', async () => {
    const email = `test_st_expiry_${Date.now()}@example.com`;
    const user = await createVerifiedUser(email);
    const agent = await loginAsUser(email);

    const productResult = await pool.query(
      `INSERT INTO season_ticket_products (code, name, description, active)
       VALUES ($1, $2, $3, true)
       RETURNING *`,
      [`test_st_expiry_${Date.now()}`, 'TEST ST Expiry', 'Expiry test product']
    );
    const product = productResult.rows[0];

    await pool.query(
      `INSERT INTO season_ticket_offers (season_ticket_product_id, entries, price, active)
       VALUES ($1, $2, $3, true)`,
      [product.id, 5, 40.0]
    );

    const res = await agent.post('/api/create-season-ticket-payment').send({
      userId: user.id,
      entries: 5,
      totalPrice: 40,
      productId: product.id,
    });

    expect(res.status).toBe(200);

    const seconds = await getSeasonTicketExpirySeconds(product.id);
    expect(seconds).not.toBeNull();
    expect(seconds).toBeGreaterThanOrEqual(EXPECTED_SECONDS - 1);
    expect(seconds).toBeLessThanOrEqual(EXPECTED_SECONDS + 1);
  });
});
