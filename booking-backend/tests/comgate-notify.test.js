// tests/comgate-notify.test.js
// Integračné testy pre webhook /api/comgate-notify.
//
// Comgate posiela notifikáciu ako application/x-www-form-urlencoded a route je
// zaregistrovaná pred express.json(), preto sa všetky requesty posielajú s .type('form').
//
// Poznámka k schéme: notifikácia neobsahuje interné ID objednávky, len transId, takže sa
// všetky tri prípady hľadajú podľa transId:
//   - bookings.session_id                    (pending rezervácia)
//   - pending_season_ticket_orders."transId" (pending permanentka -> finalizeSeasonTicketOrder)
//   - pending_gift_card_orders."transId"     (pending darčekový poukaz -> finalizeGiftCardOrder)
// Tabuľka gift_card_orders v schéme neexistuje — pending poukazy sú v pending_gift_card_orders,
// čo je tabuľka, ktorú používa aj /api/gift-card-success a reconciliation job.

const request = require('supertest');
const {
  createTestUser,
  createTestSeasonTicketProduct,
  pool,
} = require('./setup');

jest.mock('../services/paymentGateway');

jest.mock('../services/emailService', () => ({
  sendSeasonTicketConfirmation: jest.fn().mockResolvedValue(true),
  sendAdminSeasonTicketPurchase: jest.fn().mockResolvedValue(true),
  sendUserBookingEmail: jest.fn().mockResolvedValue(true),
  sendAdminNewBookingNotification: jest.fn().mockResolvedValue(true),
  sendPaymentFailedEmail: jest.fn().mockResolvedValue(true),
  sendGiftCardEmail: jest.fn().mockResolvedValue(true),
  sendAdminGiftCardPurchaseNotification: jest.fn().mockResolvedValue(true),
}));

jest.mock('../utils/pdfGenerator', () => ({
  generateGiftCardPDF: jest.fn().mockResolvedValue(Buffer.from('test-pdf')),
}));

const { app, pool: serverPool } = require('../server');
const paymentGateway = require('../services/paymentGateway');

const TEST_USER_EMAIL = 'test_comgate_notify@example.com';
const BOOKING_TRANS_ID = 'test-trans-1';
const SEASON_TRANS_ID = 'test-trans-2';
const GIFT_CARD_TRANS_ID = 'test-trans-3';

function notify(payload) {
  return request(app).post('/api/comgate-notify').type('form').send(payload);
}

async function cleanupSeededRows() {
  await pool.query(
    `DELETE FROM pending_season_ticket_orders WHERE "transId" LIKE 'test-%' OR "refId" LIKE 'test-%'`
  );
  await pool.query(
    `DELETE FROM pending_gift_card_orders WHERE "transId" LIKE 'test-%' OR "refId" LIKE 'test-%'`
  );
  await pool.query(`DELETE FROM season_tickets WHERE stripe_payment_id LIKE 'test-%'`);
  await pool.query(
    `DELETE FROM season_ticket_offers WHERE season_ticket_product_id IN (
       SELECT id FROM season_ticket_products WHERE code LIKE 'test_%'
     )`
  );
  await pool.query(`DELETE FROM season_ticket_products WHERE code LIKE 'test_%'`);
  await pool.query(
    `DELETE FROM gift_card WHERE "paymentTransId" LIKE 'test-%' OR "buyerEmail" LIKE 'test_comgate_notify%'`
  );
  await pool.query(
    `DELETE FROM bookings WHERE session_id LIKE 'test-%' OR payment_intent_id LIKE 'test-%'`
  );
  await pool.query(`DELETE FROM users WHERE email LIKE 'test_comgate_notify%'`);
}

async function seedPendingBooking(transId, amountExpected = 10.0) {
  const user = await createTestUser(TEST_USER_EMAIL);
  const result = await pool.query(
    `INSERT INTO bookings
       (user_id, number_of_children, amount_expected, session_id, active, booking_type)
     VALUES ($1, 1, $2, $3, true, 'paid')
     RETURNING *`,
    [user.id, amountExpected, transId]
  );
  return result.rows[0];
}

async function seedPendingSeasonTicketOrder(transId, amount = 10.0) {
  const user = await createTestUser(TEST_USER_EMAIL);
  const product = await createTestSeasonTicketProduct();
  const entries = 5;

  const offerResult = await pool.query(
    `INSERT INTO season_ticket_offers (season_ticket_product_id, entries, price, active)
     VALUES ($1, $2, $3, true)
     RETURNING *`,
    [product.id, entries, amount]
  );

  const refId = `test-ref-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await pool.query(
    `INSERT INTO pending_season_ticket_orders
       ("refId", "userId", "productId", "offerId", entries, amount, "transId", "createdAt", "expiresAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW() + INTERVAL '2 hours')`,
    [refId, user.id, product.id, offerResult.rows[0].id, entries, amount, transId]
  );

  return { user, product, offer: offerResult.rows[0], refId, entries };
}

async function seedPendingGiftCardOrder(transId, amount = 30.0) {
  const refId = `test-ref-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await pool.query(
    `INSERT INTO pending_gift_card_orders
       ("refId", amount, "buyerEmail", "buyerName", "recipientName", "transId", "createdAt", "expiresAt")
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() + INTERVAL '2 hours')`,
    [refId, amount, 'test_comgate_notify_buyer@example.com', 'Test Buyer', 'Test Recipient', transId]
  );

  return { refId };
}

// Po potvrdení je session_id NULL, preto sa rezervácia dohľadáva aj podľa payment_intent_id.
async function getBookingByTransId(transId) {
  const result = await pool.query(
    `SELECT * FROM bookings
     WHERE session_id = $1 OR payment_intent_id = $1
     ORDER BY id DESC LIMIT 1`,
    [transId]
  );
  return result.rows[0];
}

// Webhook odpovedá 200 OK ešte pred DB prácou, takže prijatá odpoveď neznamená dokončené
// spracovanie — na očakávaný stav sa čaká krátkym pollingom.
async function waitFor(predicate, { timeoutMs = 5000, intervalMs = 25 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let value = await predicate();
  while (!value && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    value = await predicate();
  }
  return value;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('POST /api/comgate-notify', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    paymentGateway.getPaymentStatus.mockResolvedValue('PAID');
    paymentGateway.refundPayment.mockResolvedValue({ ok: true });
    await cleanupSeededRows();
  });

  afterEach(async () => {
    await cleanupSeededRows();
  });

  afterAll(async () => {
    await cleanupSeededRows();
    await pool.end();
    await serverPool.end();
  });

  test('returns 200 OK immediately for any notification body', async () => {
    const response = await notify({ transId: 'test-unknown', status: 'PAID' });

    expect(response.status).toBe(200);
    expect(response.text).toBe('OK');
  });

  test('confirms a pending booking and clears its session_id', async () => {
    const booking = await seedPendingBooking(BOOKING_TRANS_ID, 10.0);

    const response = await notify({ transId: BOOKING_TRANS_ID, status: 'PAID' });
    expect(response.status).toBe(200);

    const confirmed = await waitFor(async () => {
      const row = await getBookingByTransId(BOOKING_TRANS_ID);
      return row && row.amount_paid !== null ? row : null;
    });

    expect(confirmed).toBeDefined();
    expect(confirmed.id).toBe(booking.id);
    expect(parseFloat(confirmed.amount_paid)).toBe(10.0);
    expect(confirmed.session_id).toBeNull();
    expect(confirmed.payment_intent_id).toBe(BOOKING_TRANS_ID);
    expect(confirmed.payment_time).not.toBeNull();
    expect(confirmed.active).toBe(true);
  });

  test('does not confirm a booking when the notification status is not PAID', async () => {
    const booking = await seedPendingBooking(BOOKING_TRANS_ID, 10.0);

    const response = await notify({ transId: BOOKING_TRANS_ID, status: 'CANCELLED' });
    expect(response.status).toBe(200);

    await delay(200);

    const unchanged = await getBookingByTransId(BOOKING_TRANS_ID);
    expect(unchanged.id).toBe(booking.id);
    expect(unchanged.amount_paid).toBeNull();
    expect(unchanged.session_id).toBe(BOOKING_TRANS_ID);
    expect(unchanged.payment_intent_id).toBeNull();
  });

  // Permanentka nemá vlastný "pending" riadok v season_tickets — čakajúca objednávka žije v
  // pending_season_ticket_orders. Po potvrdení sa vytvorí season_tickets a pending riadok zmizne.
  test('confirms a pending season ticket order', async () => {
    const { product, entries } = await seedPendingSeasonTicketOrder(SEASON_TRANS_ID, 10.0);

    const response = await notify({ transId: SEASON_TRANS_ID, status: 'PAID' });
    expect(response.status).toBe(200);

    const ticket = await waitFor(async () => {
      const result = await pool.query(
        'SELECT * FROM season_tickets WHERE stripe_payment_id = $1',
        [SEASON_TRANS_ID]
      );
      return result.rows[0] || null;
    });

    expect(ticket).toBeDefined();
    expect(parseFloat(ticket.amount_paid)).toBe(10.0);
    expect(ticket.payment_time).not.toBeNull();
    expect(ticket.entries_total).toBe(entries);
    expect(ticket.entries_remaining).toBe(entries);
    expect(ticket.season_ticket_product_id).toBe(product.id);

    // Pending objednávka je spotrebovaná, takže sa nedá finalizovať dvakrát
    const pending = await pool.query(
      `SELECT 1 FROM pending_season_ticket_orders WHERE "transId" = $1`,
      [SEASON_TRANS_ID]
    );
    expect(pending.rows).toHaveLength(0);
  });

  test('confirms a pending gift card order', async () => {
    await seedPendingGiftCardOrder(GIFT_CARD_TRANS_ID, 30.0);

    const response = await notify({ transId: GIFT_CARD_TRANS_ID, status: 'PAID' });
    expect(response.status).toBe(200);

    const giftCard = await waitFor(async () => {
      const result = await pool.query(
        'SELECT * FROM gift_card WHERE "paymentTransId" = $1',
        [GIFT_CARD_TRANS_ID]
      );
      return result.rows[0] || null;
    });

    expect(giftCard).toBeDefined();
    expect(giftCard.amount).toBe(30.0);
    expect(giftCard.balance).toBe(30.0);
    expect(giftCard.status).toBe('active');
    expect(giftCard.code).toHaveLength(12);

    const pending = await pool.query(
      `SELECT 1 FROM pending_gift_card_orders WHERE "transId" = $1`,
      [GIFT_CARD_TRANS_ID]
    );
    expect(pending.rows).toHaveLength(0);
  });

  test('does nothing when the transId is not found', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const response = await notify({ transId: 'nonexistent-999', status: 'PAID' });
      expect(response.status).toBe(200);
      expect(response.text).toBe('OK');

      await delay(300);

      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }

    const bookings = await pool.query(
      `SELECT 1 FROM bookings WHERE session_id = $1 OR payment_intent_id = $1`,
      ['nonexistent-999']
    );
    const tickets = await pool.query(
      'SELECT 1 FROM season_tickets WHERE stripe_payment_id = $1',
      ['nonexistent-999']
    );

    expect(bookings.rows).toHaveLength(0);
    expect(tickets.rows).toHaveLength(0);
  });
});
