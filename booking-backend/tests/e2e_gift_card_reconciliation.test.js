// E2E - Gift card payment recovery
//
// Covers the scenario where a gift card is paid at Comgate but the browser never returns
// to /gift-card/success (e.g. the customer closed the window). The pending order must be
// recovered by the background reconciliation job instead of silently losing the paid card.

const request = require('supertest');
const { cleanupTestData, pool } = require('./setup');

let counter = 0;

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

const { app, pool: serverPool, reconcilePendingGiftCardOrders } = require('../server');
const paymentGateway = require('../services/paymentGateway');
const emailService = require('../services/emailService');

function nextId() {
  counter += 1;
  return `${Date.now()}-${counter}`;
}

async function seedPendingOrder({
  refId,
  transId,
  amount = 30,
  buyerEmail,
  recipientName = 'Test Recipient',
  recipientEmail = null,
  message = null,
}) {
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO pending_gift_card_orders
       ("refId", "transId", amount, "buyerEmail", "buyerName", "recipientName", "recipientEmail", message, "expiresAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT ("refId") DO UPDATE SET "transId" = $2`,
    [refId, transId, amount, buyerEmail, 'Test Buyer', recipientName, recipientEmail, message, expiresAt]
  );
}

async function getPendingOrder(refId) {
  const result = await pool.query(
    'SELECT * FROM pending_gift_card_orders WHERE "refId" = $1',
    [refId]
  );
  return result.rows[0] || null;
}

async function getGiftCardsByTransId(transId) {
  const result = await pool.query(
    'SELECT * FROM gift_card WHERE "paymentTransId" = $1',
    [transId]
  );
  return result.rows;
}

describe('E2E - Gift card payment reconciliation', () => {
  let giftCardTableExists = false;

  beforeAll(async () => {
    const tableCheck = await pool.query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'gift_card'
       ) AS exists`
    );
    giftCardTableExists = tableCheck.rows[0].exists;
    if (!giftCardTableExists) {
      console.warn('⚠️  gift_card table does not exist in test DB — skipping gift card reconciliation tests.');
    }
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
      transId: `mock-gc-${nextId()}`,
      redirectUrl: 'https://payments.comgate.cz/mock',
    });
    paymentGateway.getPaymentStatus.mockResolvedValue('PAID');
    paymentGateway.refundPayment.mockResolvedValue({ ok: true });

    // Isolate the sweep: only orders seeded by this test file should be inspected.
    if (giftCardTableExists) {
      await pool.query('DELETE FROM pending_gift_card_orders');
    }
  });

  test('reconciliation sweep is exported', () => {
    expect(typeof reconcilePendingGiftCardOrders).toBe('function');
  });

  test('recovers a paid gift card whose browser redirect never arrived', async () => {
    if (!giftCardTableExists) return;

    const refId = `gc-recon-paid-${nextId()}`;
    const transId = `mock-gc-recon-paid-${nextId()}`;
    const buyerEmail = 'test_gc_recon_paid@example.com';

    await seedPendingOrder({ refId, transId, amount: 30, buyerEmail });

    // Payment succeeded at Comgate, but the customer closed the window before the redirect.
    paymentGateway.getPaymentStatus.mockResolvedValue('PAID');

    await reconcilePendingGiftCardOrders();

    const cards = await getGiftCardsByTransId(transId);
    expect(cards).toHaveLength(1);
    expect(cards[0].status).toBe('active');
    expect(parseFloat(cards[0].amount)).toBe(30);
    expect(parseFloat(cards[0].balance)).toBe(30);
    expect(cards[0].code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{12}$/);

    // Pending order is consumed.
    expect(await getPendingOrder(refId)).toBeNull();

    // Buyer is notified.
    expect(emailService.sendGiftCardEmail).toHaveBeenCalledWith(
      buyerEmail,
      expect.objectContaining({ isBuyer: true, amount: 30 })
    );
    expect(emailService.sendAdminGiftCardPurchaseNotification).toHaveBeenCalledTimes(1);
  });

  test('does not create a gift card when the payment was not completed', async () => {
    if (!giftCardTableExists) return;

    const refId = `gc-recon-unpaid-${nextId()}`;
    const transId = `mock-gc-recon-unpaid-${nextId()}`;

    await seedPendingOrder({
      refId,
      transId,
      amount: 50,
      buyerEmail: 'test_gc_recon_unpaid@example.com',
    });

    // The customer closed the gateway without paying.
    paymentGateway.getPaymentStatus.mockResolvedValue('CANCELLED');

    await reconcilePendingGiftCardOrders();

    expect(await getGiftCardsByTransId(transId)).toHaveLength(0);
    // The pending order must survive so a later completed payment can still be recovered.
    expect(await getPendingOrder(refId)).not.toBeNull();
    expect(emailService.sendGiftCardEmail).not.toHaveBeenCalled();
  });

  test('reconciliation is idempotent and never creates two cards for one transaction', async () => {
    if (!giftCardTableExists) return;

    const refId = `gc-recon-idem-${nextId()}`;
    const transId = `mock-gc-recon-idem-${nextId()}`;
    const buyerEmail = 'test_gc_recon_idem@example.com';

    await seedPendingOrder({ refId, transId, amount: 15, buyerEmail });
    paymentGateway.getPaymentStatus.mockResolvedValue('PAID');

    await reconcilePendingGiftCardOrders();
    const firstCards = await getGiftCardsByTransId(transId);
    expect(firstCards).toHaveLength(1);

    // A duplicate late call (e.g. reconciliation reruns while a redirect also arrives)
    // must reuse the existing card and not send duplicate emails.
    await seedPendingOrder({ refId, transId, amount: 15, buyerEmail });
    await reconcilePendingGiftCardOrders();

    const cards = await getGiftCardsByTransId(transId);
    expect(cards).toHaveLength(1);
    expect(cards[0].code).toBe(firstCards[0].code);
    expect(emailService.sendGiftCardEmail).toHaveBeenCalledTimes(1);
  });

  test('finalizes only the paid order when several pending orders exist', async () => {
    if (!giftCardTableExists) return;

    const paidRefId = `gc-recon-multi-paid-${nextId()}`;
    const paidTransId = `mock-gc-recon-multi-paid-${nextId()}`;
    const unpaidRefId = `gc-recon-multi-unpaid-${nextId()}`;
    const unpaidTransId = `mock-gc-recon-multi-unpaid-${nextId()}`;

    await seedPendingOrder({
      refId: paidRefId,
      transId: paidTransId,
      amount: 30,
      buyerEmail: 'test_gc_recon_multi_paid@example.com',
    });
    await seedPendingOrder({
      refId: unpaidRefId,
      transId: unpaidTransId,
      amount: 30,
      buyerEmail: 'test_gc_recon_multi_unpaid@example.com',
    });

    paymentGateway.getPaymentStatus.mockImplementation((id) =>
      Promise.resolve(id === paidTransId ? 'PAID' : 'PENDING')
    );

    await reconcilePendingGiftCardOrders();

    expect(await getGiftCardsByTransId(paidTransId)).toHaveLength(1);
    expect(await getGiftCardsByTransId(unpaidTransId)).toHaveLength(0);
    expect(await getPendingOrder(paidRefId)).toBeNull();
    expect(await getPendingOrder(unpaidRefId)).not.toBeNull();
  });

  test('redirect endpoint still reports the Comgate status for an unpaid order', async () => {
    if (!giftCardTableExists) return;

    const refId = `gc-recon-endpoint-${nextId()}`;
    const transId = `mock-gc-recon-endpoint-${nextId()}`;

    await seedPendingOrder({
      refId,
      transId,
      amount: 30,
      buyerEmail: 'test_gc_recon_endpoint@example.com',
    });

    paymentGateway.getPaymentStatus.mockResolvedValue('CANCELLED');

    const res = await request(app).get(`/api/gift-card-success?refId=${refId}`);

    // Frontend relies on the status field to show a friendly "not completed" screen.
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('CANCELLED');
    expect(res.body.error).toBeDefined();
    expect(await getGiftCardsByTransId(transId)).toHaveLength(0);
  });
});
