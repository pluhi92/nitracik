/**
 * e2e_gift_card_cancellation_test.js
 *
 * Integračné testy: Darčekové poukazy (DP) — kompletný flow
 *
 * Pokryté oblasti:
 *  1. Nákup DP (Stripe → DB → email)
 *  2. Načítanie DP pre usera
 *  3. Booking plne hradený z DP (100% cover)
 *  4. Booking čiastočne hradený z DP + Stripe (mixed payment)
 *     - Uloženie gift_card_code + gift_card_amount do bookings (NOVÉ)
 *  5. Zrušenie 100% DP bookingu (user)
 *  6. Zrušenie mixed-payment bookingu (user) — refund + DP restore (NOVÉ)
 *  7. Zrušenie mixed-payment bookingu (user) — credit option (NOVÉ)
 *  8. Admin cancel session — rôzne typy bookingov
 *     - Gift card booking → balance restore (NOVÉ)
 *     - Mixed booking → email s mixed info (NOVÉ)
 *  9. GET /api/booking/refund — mixed payment refund (NOVÉ)
 * 10. Idempotencia refundu
 * 11. Negatívne prípady (10h rule, unauthorized, expired, used card...)
 * 12. Full lifecycle end-to-end
 */

const request = require('supertest');
const bcrypt = require('bcryptjs');
const { cleanupTestData, pool } = require('./setup');

let gcStripeCounter = 0;

// ─────────────────────────────────────────────
// STRIPE MOCK
// ─────────────────────────────────────────────
const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
  paymentIntents: {
    retrieve: jest.fn(),
  },
  refunds: {
    create: jest.fn(),
  },
};

jest.mock('stripe', () => jest.fn(() => mockStripe));

// ─────────────────────────────────────────────
// EMAIL SERVICE MOCK
// ─────────────────────────────────────────────
jest.mock('../services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendUserBookingEmail: jest.fn().mockResolvedValue(true),
  sendAdultBookingEmail: jest.fn().mockResolvedValue(true),
  sendAdminBookingEmail: jest.fn().mockResolvedValue(true),
  sendAdminNewBookingNotification: jest.fn().mockResolvedValue(true),
  sendSeasonTicketConfirmation: jest.fn().mockResolvedValue(true),
  sendAdminSeasonTicketPurchase: jest.fn().mockResolvedValue(true),
  sendAdminSeasonTicketUsage: jest.fn().mockResolvedValue(true),
  sendCancellationEmails: jest.fn().mockResolvedValue(true),
  sendMassCancellationEmail: jest.fn().mockResolvedValue(true),
  sendMassCancellationCredit: jest.fn().mockResolvedValue(true),
  sendMassCancellationSeasonTicket: jest.fn().mockResolvedValue(true),
  sendRefundConfirmationEmail: jest.fn().mockResolvedValue(true),
  sendAdminCreditUsage: jest.fn().mockResolvedValue(true),
  sendContactFormEmails: jest.fn().mockResolvedValue(true),
  sendAccountDeletedEmail: jest.fn().mockResolvedValue(true),
  sendAdminAccountDeleteNotification: jest.fn().mockResolvedValue(true),
  sendPaymentFailedEmail: jest.fn().mockResolvedValue(true),
  sendReviewRequestEmail: jest.fn().mockResolvedValue(true),
  sendBulkAdminEmail: jest.fn().mockResolvedValue(true),
  sendGiftCardEmail: jest.fn().mockResolvedValue(true),
}));

const { app } = require('../server');

// ─────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────

async function createVerifiedUser(email, role = 'user', password = 'TestPass123!') {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password, address, mobile, verified, role)
     VALUES ($1, $2, $3, $4, $5, $6, true, $7)
     ON CONFLICT (email) DO UPDATE SET password = $4, verified = true, role = $7
     RETURNING *`,
    ['Test', 'GC', email, hashedPassword, 'Test GC Address, 94901 Nitra', '+421900000000', role]
  );
  return result.rows[0];
}

async function loginAs(email, password = 'TestPass123!') {
  const agent = request.agent(app);
  const loginRes = await agent.post('/api/login').send({ email, password });
  if (loginRes.status !== 200) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(loginRes.body)}`);
  }
  return agent;
}

async function createGiftCardInDb({
  code,
  amount = 30,
  balance = 30,
  status = 'active',
  buyerEmail,
  recipientName = 'Test Recipient',
  recipientEmail = null,
  message = null,
  expiresAt = null,
  stripeSessionId = null,
}) {
  const expires = expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const sessionId = stripeSessionId || `test_gc_session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const result = await pool.query(
    `INSERT INTO gift_card
      (code, amount, balance, status, "buyerEmail", "recipientName", "recipientEmail",
       message, "expiresAt", "stripeSessionId", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
     ON CONFLICT (code) DO UPDATE SET balance = $3, status = $4
     RETURNING *`,
    [code, amount, balance, status, buyerEmail, recipientName, recipientEmail, message, expires, sessionId]
  );
  return result.rows[0];
}

async function getGiftCardByCode(code) {
  const result = await pool.query('SELECT * FROM gift_card WHERE code = $1', [code]);
  return result.rows[0] || null;
}

function testGcCode(suffix) {
  return `TESTGC${suffix.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)}`;
}

async function createTrainingWithPrice({ name, hoursFromNow = 24, maxParticipants = 10, price = 15 }) {
  const typeResult = await pool.query(
    `INSERT INTO training_types (name, description, duration_minutes, active, audience_type, color_hex)
     VALUES ($1, $2, 60, true, 'children', '#f59e0b')
     ON CONFLICT (name) DO UPDATE SET name = $1
     RETURNING *`,
    [name, 'Gift card cancellation test training']
  );
  const type = typeResult.rows[0];

  await pool.query(
    `INSERT INTO training_prices (training_type_id, child_count, price)
     VALUES ($1, 1, $2), ($1, 2, $2), ($1, 3, $2)
     ON CONFLICT (training_type_id, child_count) DO UPDATE SET price = $2`,
    [type.id, price]
  );

  const trainingResult = await pool.query(
    `INSERT INTO training_availability (training_type_id, training_type, training_date, max_participants)
     VALUES ($1, $2, NOW() + ($3 || ' hours')::interval, $4)
     RETURNING *`,
    [type.id, type.name, String(hoursFromNow), maxParticipants]
  );
  return { type, training: trainingResult.rows[0] };
}

/** Booking 100% hradený z DP */
async function createGiftCardBooking({ userId, trainingId, gcCode, amount = 0 }) {
  const result = await pool.query(
    `INSERT INTO bookings
      (user_id, training_id, number_of_children, amount_paid, payment_time,
       booked_at, active, booking_type, session_id, age_group, children_ages)
     VALUES ($1, $2, 1, $3, NOW(), NOW(), true, 'gift_card', $4, 'child', '5')
     RETURNING *`,
    [userId, trainingId, amount, `GIFT_CARD_${gcCode}`]
  );
  return result.rows[0];
}

/**
 * Booking čiastočne hradený DP + Stripe — obsahuje NOVÉ stĺpce gift_card_code a gift_card_amount.
 * @param {object} opts
 * @param {number} opts.amountPaid      - suma zaplatená kartou (Stripe), napr. 35
 * @param {number} opts.giftCardAmount  - suma hradená z DP, napr. 5
 * @param {string} opts.gcCode          - kód DP
 * @param {string} [opts.paymentIntentId]
 */
async function createMixedPaymentBooking({ userId, trainingId, gcCode, amountPaid, giftCardAmount, paymentIntentId }) {
  const result = await pool.query(
    `INSERT INTO bookings
      (user_id, training_id, number_of_children, amount_paid, payment_time,
       booked_at, active, booking_type, session_id, payment_intent_id,
       gift_card_code, gift_card_amount, age_group, children_ages)
     VALUES ($1, $2, 1, $3, NOW(), NOW(), true, 'paid', $4, $5, $6, $7, 'child', '5')
     RETURNING *`,
    [
      userId,
      trainingId,
      amountPaid,
      `test_gcc_mixed_session_${Date.now()}`,
      paymentIntentId || `test_gcc_mixed_pi_${Date.now()}`,
      gcCode.toUpperCase(),
      giftCardAmount,
    ]
  );
  return result.rows[0];
}

/** @deprecated Použi createMixedPaymentBooking. Zachované pre spätú kompatibilitu existujúcich testov. */
async function createPartialGiftCardBooking({ userId, trainingId, gcCode, amountPaid, paymentIntentId }) {
  return createMixedPaymentBooking({ userId, trainingId, gcCode, amountPaid, giftCardAmount: 0, paymentIntentId });
}

async function getBookingById(bookingId) {
  const result = await pool.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
  return result.rows[0] || null;
}

async function getActiveBookingById(bookingId) {
  const result = await pool.query('SELECT * FROM bookings WHERE id = $1 AND active = true', [bookingId]);
  return result.rows[0] || null;
}

async function getRefundByBookingId(bookingId) {
  const result = await pool.query('SELECT * FROM refunds WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1', [bookingId]);
  return result.rows[0] || null;
}

function resetStripeMocks() {
  gcStripeCounter += 1;
  const sessionId = `test_gc_session_${Date.now()}_${gcStripeCounter}`;

  mockStripe.checkout.sessions.create.mockResolvedValue({
    id: sessionId,
    payment_status: 'paid',
    metadata: {},
  });

  mockStripe.checkout.sessions.retrieve.mockResolvedValue({
    id: sessionId,
    payment_status: 'paid',
    metadata: {
      type: 'gift_card',
      amount: '30',
      buyerEmail: 'test_gcc_buyer@example.com',
      recipientName: 'Test Recipient',
      recipientEmail: '',
      message: '',
    },
  });

  mockStripe.webhooks.constructEvent.mockImplementation((payload) => {
    const decodePayload = (value) => {
      if (Buffer.isBuffer(value)) return decodePayload(value.toString('utf8'));
      if (typeof value === 'string') return decodePayload(JSON.parse(value));
      if (value && value.type === 'Buffer' && Array.isArray(value.data)) {
        return decodePayload(Buffer.from(value.data).toString('utf8'));
      }
      return value;
    };
    return decodePayload(payload);
  });

  mockStripe.paymentIntents.retrieve.mockResolvedValue({
    id: `test_pi_${Date.now()}`,
    amount: 3000,
    created: Math.floor(Date.now() / 1000),
  });

  mockStripe.refunds.create.mockResolvedValue({
    id: `test_refund_${Date.now()}_${gcStripeCounter}`,
    status: 'succeeded',
  });
}

// ─────────────────────────────────────────────
// GLOBAL CLEANUP
// ─────────────────────────────────────────────
async function fullCleanup() {
  await cleanupTestData();
  await pool.query(`DELETE FROM refunds WHERE booking_id IN (SELECT id FROM bookings WHERE session_id LIKE 'test_gcc%' OR session_id LIKE 'GIFT_CARD_TESTGC%')`);
  await pool.query(`DELETE FROM bookings WHERE session_id LIKE 'GIFT_CARD_TESTGC%' OR session_id LIKE 'test_gcc%'`);
  await pool.query(`DELETE FROM gift_card WHERE "buyerEmail" LIKE 'test_gcc_%' OR code LIKE 'TESTGC%'`);
  await pool.query(`DELETE FROM training_availability WHERE training_type LIKE 'TEST_GCC_%'`);
  await pool.query(`DELETE FROM training_types WHERE name LIKE 'TEST_GCC_%'`);
  await pool.query(`DELETE FROM users WHERE email LIKE 'test_gcc_%'`);
}

// ═══════════════════════════════════════════════════════════════════
// DESCRIBE 1: Nákup darčekového poukazu
// ═══════════════════════════════════════════════════════════════════
describe('Gift Card — Full purchase flow (Stripe → DB → email)', () => {
  beforeAll(fullCleanup);
  afterAll(fullCleanup);
  beforeEach(() => { resetStripeMocks(); jest.clearAllMocks(); });

  test('POSITIVE: purchase gift card via Stripe → code generated → email sent to buyer', async () => {
    const sessionId = `test_gcc_purchase_001_${Date.now()}`;
    mockStripe.checkout.sessions.create.mockResolvedValue({ id: sessionId, payment_status: 'unpaid', metadata: {} });

    const createRes = await request(app).post('/api/create-gift-card-session').send({
      amount: 30, buyerEmail: 'test_gcc_purchase_001@example.com',
      recipientName: 'Janko', honeypot: '',
    });
    expect(createRes.status).toBe(200);
    expect(createRes.body.sessionId).toBe(sessionId);

    mockStripe.checkout.sessions.retrieve.mockResolvedValue({
      id: sessionId, payment_status: 'paid',
      metadata: {
        type: 'gift_card', amount: '30',
        buyerEmail: 'test_gcc_purchase_001@example.com',
        recipientName: 'Janko', recipientEmail: '', message: 'Všetko najlepšie!',
      },
    });

    const successRes = await request(app).get(`/api/gift-card-success?session_id=${sessionId}`);
    expect(successRes.status).toBe(200);
    expect(successRes.body.code).toHaveLength(12);
    expect(successRes.body.amount).toBe(30);
    expect(successRes.body.balance).toBe(30);

    const gc = await getGiftCardByCode(successRes.body.code);
    expect(gc).not.toBeNull();
    expect(gc.status).toBe('active');
    expect(parseFloat(gc.balance)).toBe(30);
    expect(gc.stripeSessionId).toBe(sessionId);

    const emailService = require('../services/emailService');
    expect(emailService.sendGiftCardEmail).toHaveBeenCalledWith(
      'test_gcc_purchase_001@example.com',
      expect.objectContaining({ isBuyer: true, amount: 30 })
    );
  });

  test('POSITIVE: purchase gift card with recipient email → email sent to recipient too', async () => {
    const sessionId = `test_gcc_purchase_002_${Date.now()}`;
    mockStripe.checkout.sessions.retrieve.mockResolvedValue({
      id: sessionId, payment_status: 'paid',
      metadata: {
        type: 'gift_card', amount: '50',
        buyerEmail: 'test_gcc_purchase_002b@example.com',
        recipientName: 'Ferko',
        recipientEmail: 'test_gcc_purchase_002r@example.com',
        message: 'Pre teba!',
      },
    });
    const successRes = await request(app).get(`/api/gift-card-success?session_id=${sessionId}`);
    expect(successRes.status).toBe(200);

    const emailService = require('../services/emailService');
    await new Promise(r => setTimeout(r, 100));
    const calls = emailService.sendGiftCardEmail.mock.calls;
    const buyerCall = calls.find(c => c[0] === 'test_gcc_purchase_002b@example.com');
    const recipientCall = calls.find(c => c[0] === 'test_gcc_purchase_002r@example.com');
    expect(buyerCall).toBeDefined();
    expect(recipientCall).toBeDefined();
    expect(buyerCall[1].isBuyer).toBe(true);
    expect(recipientCall[1].isBuyer).toBe(false);
  });

  test('POSITIVE: idempotency — calling gift-card-success twice → same code returned, no duplicate', async () => {
    const sessionId = `test_gcc_purchase_idem_${Date.now()}`;
    mockStripe.checkout.sessions.retrieve.mockResolvedValue({
      id: sessionId, payment_status: 'paid',
      metadata: {
        type: 'gift_card', amount: '15',
        buyerEmail: 'test_gcc_purchase_idem@example.com',
        recipientName: 'Idem', recipientEmail: '', message: '',
      },
    });

    const res1 = await request(app).get(`/api/gift-card-success?session_id=${sessionId}`);
    const res2 = await request(app).get(`/api/gift-card-success?session_id=${sessionId}`);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res1.body.code).toBe(res2.body.code);

    const rows = await pool.query('SELECT * FROM gift_card WHERE "stripeSessionId" = $1', [sessionId]);
    expect(rows.rows.length).toBe(1);
  });

  test('NEGATIVE: gift-card-success with unpaid session → 400', async () => {
    const sessionId = `test_gcc_unpaid_${Date.now()}`;
    mockStripe.checkout.sessions.retrieve.mockResolvedValue({
      id: sessionId, payment_status: 'unpaid', metadata: {},
    });
    const res = await request(app).get(`/api/gift-card-success?session_id=${sessionId}`);
    expect(res.status).toBe(400);
  });

  test('POSITIVE: validate active gift card → returns balance and metadata', async () => {
    const code = testGcCode('VAL01');
    await createGiftCardInDb({ code, amount: 50, balance: 50, buyerEmail: 'test_gcc_val_001@example.com' });
    const res = await request(app).post('/api/validate-gift-card').send({ code });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(parseFloat(res.body.balance)).toBe(50);
    expect(parseFloat(res.body.amount)).toBe(50);
    expect(res.body.expiresAt).toBeDefined();
  });

  test('NEGATIVE: validate non-existent gift card code → 404', async () => {
    const res = await request(app).post('/api/validate-gift-card').send({ code: 'NONEXISTENT123' });
    expect(res.status).toBe(404);
  });

  test('NEGATIVE: validate expired gift card → 400', async () => {
    const code = testGcCode('EXP01');
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await createGiftCardInDb({
      code, amount: 30, balance: 30, status: 'expired',
      buyerEmail: 'test_gcc_exp_001@example.com', expiresAt: pastDate,
    });
    const res = await request(app).post('/api/validate-gift-card').send({ code });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/expiroval/i);
  });

  test('NEGATIVE: validate used (zero balance) gift card → 400', async () => {
    const code = testGcCode('USD01');
    await createGiftCardInDb({ code, amount: 30, balance: 0, status: 'used', buyerEmail: 'test_gcc_usd_001@example.com' });
    const res = await request(app).post('/api/validate-gift-card').send({ code });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/využit/i);
  });

  test('NEGATIVE: validate with missing code → 400', async () => {
    const res = await request(app).post('/api/validate-gift-card').send({ code: '' });
    expect(res.status).toBe(400);
  });

  test('POSITIVE: user fetches their own gift cards', async () => {
    const user = await createVerifiedUser('test_gcc_fetch_001@example.com');
    const agent = await loginAs(user.email);
    const code = testGcCode('FTCH1');
    await createGiftCardInDb({ code, amount: 50, balance: 50, buyerEmail: user.email });

    const res = await agent.get(`/api/gift-cards/user/${user.id}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find(gc => gc.code === code);
    expect(found).toBeDefined();
    expect(parseFloat(found.balance)).toBe(50);
  });

  test('NEGATIVE: unauthenticated request to /api/gift-cards/user/:userId → 401', async () => {
    const res = await request(app).get('/api/gift-cards/user/9999');
    expect(res.status).toBe(401);
  });

  test('NEGATIVE: user cannot fetch gift cards of another user → 403 or empty', async () => {
    const user1 = await createVerifiedUser('test_gcc_fetch_002a@example.com');
    const user2 = await createVerifiedUser('test_gcc_fetch_002b@example.com');
    const agent2 = await loginAs(user2.email);

    const res = await agent2.get(`/api/gift-cards/user/${user1.id}`);
    // Must either return 403 or empty array (not user1's cards)
    if (res.status === 200) {
      const code = testGcCode('FT2A');
      await createGiftCardInDb({ code, amount: 30, balance: 30, buyerEmail: user1.email });
      const res2 = await agent2.get(`/api/gift-cards/user/${user1.id}`);
      const found = res2.body?.find(gc => gc.code === code);
      expect(found).toBeUndefined();
    } else {
      expect(res.status).toBe(403);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// DESCRIBE 2: Booking 100% hradený z DP
// ═══════════════════════════════════════════════════════════════════
describe('Gift Card — Booking fully paid by gift card (100% cover)', () => {
  beforeAll(fullCleanup);
  afterAll(fullCleanup);
  beforeEach(() => { resetStripeMocks(); jest.clearAllMocks(); });

  test('POSITIVE: full gift card covers booking → free:true, active booking, balance decremented', async () => {
    const user = await createVerifiedUser('test_gcc_full_001@example.com');
    const agent = await loginAs(user.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_FULL_001', price: 15 });
    const code = testGcCode('FULL1');
    await createGiftCardInDb({ code, amount: 30, balance: 30, buyerEmail: user.email });

    const res = await agent.post('/api/create-payment-session').send({
      userId: user.id, trainingId: training.id, trainingType: type.name,
      selectedDate: '2025-09-01', selectedTime: '10:00',
      childrenCount: 1, childrenAge: '5', totalPrice: 15,
      photoConsent: null, mobile: '', note: '',
      accompanyingPerson: false, allowDuplicate: false,
      giftCardCode: code, giftCardDiscount: 15,
    });

    expect(res.status).toBe(200);
    expect(res.body.free).toBe(true);
    expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();

    const bookings = await pool.query(
      `SELECT * FROM bookings WHERE user_id = $1 AND training_id = $2 AND active = true`,
      [user.id, training.id]
    );
    expect(bookings.rows.length).toBe(1);
    expect(bookings.rows[0].booking_type).toBe('gift_card');
    expect(bookings.rows[0].session_id).toBe(`GIFT_CARD_${code}`);

    const gc = await getGiftCardByCode(code);
    expect(parseFloat(gc.balance)).toBe(15); // 30 - 15 = 15
    expect(gc.status).toBe('active');
  });

  test('POSITIVE: gift card exactly covers price → status used, balance = 0, redeemedAt set', async () => {
    const user = await createVerifiedUser('test_gcc_full_002@example.com');
    const agent = await loginAs(user.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_FULL_002', price: 30 });
    const code = testGcCode('FULL2');
    await createGiftCardInDb({ code, amount: 30, balance: 30, buyerEmail: user.email });

    await agent.post('/api/create-payment-session').send({
      userId: user.id, trainingId: training.id, trainingType: type.name,
      selectedDate: '2025-09-01', selectedTime: '10:00',
      childrenCount: 1, childrenAge: '5', totalPrice: 30,
      photoConsent: null, mobile: '', note: '',
      accompanyingPerson: false, allowDuplicate: false,
      giftCardCode: code, giftCardDiscount: 30,
    });

    const gc = await getGiftCardByCode(code);
    expect(parseFloat(gc.balance)).toBe(0);
    expect(gc.status).toBe('used');
    expect(gc.redeemedAt).not.toBeNull();
  });

  test('POSITIVE: free booking sends confirmation email with paymentType=gift_card', async () => {
    const emailService = require('../services/emailService');
    const user = await createVerifiedUser('test_gcc_full_003@example.com');
    const agent = await loginAs(user.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_FULL_003', price: 15 });
    const code = testGcCode('FULL3');
    await createGiftCardInDb({ code, amount: 50, balance: 50, buyerEmail: user.email });

    await agent.post('/api/create-payment-session').send({
      userId: user.id, trainingId: training.id, trainingType: type.name,
      selectedDate: '2025-09-01', selectedTime: '10:00',
      childrenCount: 1, childrenAge: '5', totalPrice: 15,
      photoConsent: null, mobile: '', note: '',
      accompanyingPerson: false, allowDuplicate: false,
      giftCardCode: code, giftCardDiscount: 15,
    });

    await new Promise(r => setTimeout(r, 300));
    expect(emailService.sendUserBookingEmail).toHaveBeenCalledWith(
      user.email,
      expect.objectContaining({ paymentType: 'gift_card' })
    );
  });

  test('NEGATIVE: used gift card (balance 0) cannot pay booking → Stripe charged full price', async () => {
    const user = await createVerifiedUser('test_gcc_full_004@example.com');
    const agent = await loginAs(user.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_FULL_004', price: 15 });
    const code = testGcCode('FULL4');
    await createGiftCardInDb({ code, amount: 30, balance: 0, status: 'used', buyerEmail: user.email });

    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: `test_gcc_full_004_session_${Date.now()}`, payment_status: 'unpaid', metadata: {},
    });

    const res = await agent.post('/api/create-payment-session').send({
      userId: user.id, trainingId: training.id, trainingType: type.name,
      selectedDate: '2025-09-01', selectedTime: '10:00',
      childrenCount: 1, childrenAge: '5', totalPrice: 15,
      photoConsent: null, mobile: '', note: '',
      accompanyingPerson: false, allowDuplicate: false,
      giftCardCode: code, giftCardDiscount: 15,
    });

    expect(res.status).toBe(200);
    const stripeCall = mockStripe.checkout.sessions.create.mock.calls[0][0];
    expect(stripeCall.line_items[0].price_data.unit_amount).toBe(1500); // full price, gift card ignored
  });
});

// ═══════════════════════════════════════════════════════════════════
// DESCRIBE 3: Booking čiastočne hradený DP + Stripe (mixed payment)
// ═══════════════════════════════════════════════════════════════════
describe('Gift Card — Mixed payment booking (gift card + Stripe)', () => {
  beforeAll(fullCleanup);
  afterAll(fullCleanup);
  beforeEach(() => { resetStripeMocks(); jest.clearAllMocks(); });

  test('POSITIVE: partial gift card reduces Stripe charge correctly (42€ - 30€DP = 12€ Stripe)', async () => {
    const user = await createVerifiedUser('test_gcc_partial_001@example.com');
    const agent = await loginAs(user.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_PARTIAL_001', price: 42 });
    const code = testGcCode('PART1');
    await createGiftCardInDb({ code, amount: 30, balance: 30, buyerEmail: user.email });

    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: `test_gcc_partial_001_session_${Date.now()}`, payment_status: 'unpaid', metadata: {},
    });

    const res = await agent.post('/api/create-payment-session').send({
      userId: user.id, trainingId: training.id, trainingType: type.name,
      selectedDate: '2025-09-01', selectedTime: '10:00',
      childrenCount: 1, childrenAge: '5', totalPrice: 42,
      photoConsent: null, mobile: '', note: '',
      accompanyingPerson: false, allowDuplicate: false,
      giftCardCode: code, giftCardDiscount: 30,
    });

    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBeDefined();
    expect(res.body.free).toBeUndefined();

    const stripeCall = mockStripe.checkout.sessions.create.mock.calls[0][0];
    expect(stripeCall.line_items[0].price_data.unit_amount).toBe(1200); // 12€ = 1200 cents
    expect(stripeCall.metadata.giftCardCode).toBe(code);
    expect(stripeCall.metadata.giftCardDiscount).toBe('30');
  });

  test('POSITIVE: booking-success saves gift_card_code and gift_card_amount to bookings table', async () => {
    const user = await createVerifiedUser('test_gcc_bsuccess_001@example.com');
    const agent = await loginAs(user.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_BSUCCESS_001', price: 40, hoursFromNow: 48 });
    const code = testGcCode('BSC01');
    await createGiftCardInDb({ code, amount: 15, balance: 15, buyerEmail: user.email });

    const sessionId = `test_gcc_bsuccess_001_session_${Date.now()}`;
    const paymentIntentId = `test_gcc_bsuccess_001_pi_${Date.now()}`;

    // Insert pending booking
    const bookingInsert = await pool.query(
      `INSERT INTO bookings (user_id, training_id, number_of_children, booked_at, active, booking_type, session_id, children_ages)
       VALUES ($1, $2, 1, NOW(), false, 'paid', $3, '5') RETURNING id`,
      [user.id, training.id, sessionId]
    );
    const bookingId = bookingInsert.rows[0].id;

    mockStripe.checkout.sessions.retrieve.mockResolvedValue({
      id: sessionId,
      payment_status: 'paid',
      payment_intent: paymentIntentId,
      metadata: {
        type: 'training_session', userId: String(user.id),
        trainingId: String(training.id), trainingType: type.name,
        selectedDate: '2025-09-01', selectedTime: '10:00',
        childrenCount: '1', childrenAge: '5', totalPrice: '40',
        photoConsent: 'null', mobile: '', note: '', accompanyingPerson: 'false',
        giftCardCode: code,
        giftCardDiscount: '15',
      },
    });
    mockStripe.paymentIntents.retrieve.mockResolvedValue({
      id: paymentIntentId,
      amount: 2500, // 25€ v centoch
      created: Math.floor(Date.now() / 1000),
    });

    await agent.get(`/api/booking-success?session_id=${sessionId}&booking_id=${bookingId}`);

    const booking = await getBookingById(bookingId);
    expect(booking).not.toBeNull();
    expect(booking.active).toBe(true);
    expect(booking.gift_card_code).toBe(code);
    expect(parseFloat(booking.gift_card_amount)).toBe(15);
    expect(parseFloat(booking.amount_paid)).toBe(25); // 2500 cents / 100
    expect(booking.payment_intent_id).toBe(paymentIntentId);
  });

  test('POSITIVE: webhook gift card redemption after mixed Stripe payment → gift card balance decremented', async () => {
    const user = await createVerifiedUser('test_gcc_partial_002@example.com');
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_PARTIAL_002', price: 42 });
    const code = testGcCode('PART2');
    await createGiftCardInDb({ code, amount: 30, balance: 30, buyerEmail: user.email });

    const sessionId = `test_gcc_partial_002_session_${Date.now()}`;
    await pool.query(
      `INSERT INTO bookings (user_id, training_id, number_of_children, booked_at, active, booking_type, session_id, children_ages)
       VALUES ($1, $2, 1, NOW(), false, 'paid', $3, '5')`,
      [user.id, training.id, sessionId]
    );

    const webhookPayload = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId, payment_status: 'paid',
          payment_intent: `test_gcc_partial_002_pi_${Date.now()}`,
          created: Math.floor(Date.now() / 1000),
          metadata: {
            type: 'training_session', userId: String(user.id),
            trainingId: String(training.id), trainingType: type.name,
            selectedDate: '2025-09-01', selectedTime: '10:00',
            childrenCount: '1', childrenAge: '5', totalPrice: '12',
            photoConsent: 'null', mobile: '', note: '',
            accompanyingPerson: 'false',
            giftCardCode: code, giftCardDiscount: '30',
          },
        },
      },
    };

    const res = await request(app)
      .post('/stripe-webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'test_sig')
      .send(Buffer.from(JSON.stringify(webhookPayload)));

    expect(res.status).toBe(200);
    await new Promise(r => setTimeout(r, 300));

    const gc = await getGiftCardByCode(code);
    expect(parseFloat(gc.balance)).toBe(0); // 30 - 30 = 0
    expect(gc.status).toBe('used');
  });

  test('POSITIVE: mixed booking with partial DP (5€ DP, 35€ Stripe) — booking active, correct amounts', async () => {
    const user = await createVerifiedUser('test_gcc_partial_003@example.com');
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_PARTIAL_003', price: 40, hoursFromNow: 48 });
    const code = testGcCode('PART3');
    await createGiftCardInDb({ code, amount: 30, balance: 5, buyerEmail: user.email });

    const booking = await createMixedPaymentBooking({
      userId: user.id, trainingId: training.id, gcCode: code,
      amountPaid: 35, giftCardAmount: 5,
    });

    // Verify stored correctly
    const b = await getBookingById(booking.id);
    expect(b.booking_type).toBe('paid');
    expect(parseFloat(b.amount_paid)).toBe(35);
    expect(b.gift_card_code).toBe(code);
    expect(parseFloat(b.gift_card_amount)).toBe(5);
    expect(b.active).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// DESCRIBE 4: Zrušenie 100% DP bookingu (user)
// ═══════════════════════════════════════════════════════════════════
describe('Gift Card — Cancellation of fully-paid gift card booking (user)', () => {
  beforeAll(fullCleanup);
  afterAll(fullCleanup);
  beforeEach(() => { resetStripeMocks(); jest.clearAllMocks(); });

  test('POSITIVE: cancel gift_card booking → balance restored, booking deleted', async () => {
    const user = await createVerifiedUser('test_gcc_cancel_001@example.com');
    const agent = await loginAs(user.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_CANCEL_001', price: 15, hoursFromNow: 48 });
    const code = testGcCode('CAN01');
    await createGiftCardInDb({ code, amount: 30, balance: 15, buyerEmail: user.email });
    const booking = await createGiftCardBooking({ userId: user.id, trainingId: training.id, gcCode: code, amount: 0 });

    const res = await agent.delete(`/api/bookings/${booking.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.giftCardBalanceRestored).toBe(true);

    const deletedBooking = await getActiveBookingById(booking.id);
    expect(deletedBooking).toBeNull();

    // 15 (zostatok) + 15 (cena tréningu) = 30 (originál)
    const gc = await getGiftCardByCode(code);
    expect(parseFloat(gc.balance)).toBe(30);
    expect(gc.status).toBe('active');
  });

  test('POSITIVE: balance never exceeds original card amount on restore', async () => {
    const user = await createVerifiedUser('test_gcc_cancel_002@example.com');
    const agent = await loginAs(user.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_CANCEL_002', price: 15, hoursFromNow: 48 });
    const code = testGcCode('CAN02');
    await createGiftCardInDb({ code, amount: 30, balance: 30, buyerEmail: user.email });
    const booking = await createGiftCardBooking({ userId: user.id, trainingId: training.id, gcCode: code, amount: 0 });

    await agent.delete(`/api/bookings/${booking.id}`);

    const gc = await getGiftCardByCode(code);
    expect(parseFloat(gc.balance)).toBeLessThanOrEqual(30);
  });

  test('POSITIVE: cancellation email sent after gift_card booking cancellation', async () => {
    const emailService = require('../services/emailService');
    const user = await createVerifiedUser('test_gcc_cancel_003@example.com');
    const agent = await loginAs(user.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_CANCEL_003', price: 15, hoursFromNow: 48 });
    const code = testGcCode('CAN03');
    await createGiftCardInDb({ code, amount: 30, balance: 15, buyerEmail: user.email });
    const booking = await createGiftCardBooking({ userId: user.id, trainingId: training.id, gcCode: code });

    await agent.delete(`/api/bookings/${booking.id}`);

    expect(emailService.sendCancellationEmails).toHaveBeenCalled();
  });

  test('NEGATIVE: cancel gift_card booking within 10 hours → 500, booking stays, balance unchanged', async () => {
    const user = await createVerifiedUser('test_gcc_cancel_004@example.com');
    const agent = await loginAs(user.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_CANCEL_004', price: 15, hoursFromNow: 5 });
    const code = testGcCode('CAN04');
    await createGiftCardInDb({ code, amount: 30, balance: 15, buyerEmail: user.email });
    const booking = await createGiftCardBooking({ userId: user.id, trainingId: training.id, gcCode: code });

    const res = await agent.delete(`/api/bookings/${booking.id}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/10 hours/i);

    const stillActive = await getBookingById(booking.id);
    expect(stillActive).not.toBeNull();
    expect(stillActive.active).toBe(true);

    const gc = await getGiftCardByCode(code);
    expect(parseFloat(gc.balance)).toBe(15);
  });

  test('NEGATIVE: double cancel → second attempt fails, balance not double-restored', async () => {
    const user = await createVerifiedUser('test_gcc_cancel_005@example.com');
    const agent = await loginAs(user.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_CANCEL_005', price: 15, hoursFromNow: 48 });
    const code = testGcCode('CAN05');
    await createGiftCardInDb({ code, amount: 30, balance: 15, buyerEmail: user.email });
    const booking = await createGiftCardBooking({ userId: user.id, trainingId: training.id, gcCode: code });

    const res1 = await agent.delete(`/api/bookings/${booking.id}`);
    expect(res1.status).toBe(200);

    const res2 = await agent.delete(`/api/bookings/${booking.id}`);
    expect(res2.status).toBe(500);

    const gc = await getGiftCardByCode(code);
    expect(parseFloat(gc.balance)).toBeLessThanOrEqual(30);
  });

  test('NEGATIVE: cancel booking belonging to another user → 500', async () => {
    const user1 = await createVerifiedUser('test_gcc_cancel_006a@example.com');
    const user2 = await createVerifiedUser('test_gcc_cancel_006b@example.com');
    const agent2 = await loginAs(user2.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_CANCEL_006', price: 15, hoursFromNow: 48 });
    const code = testGcCode('CAN06');
    await createGiftCardInDb({ code, amount: 30, balance: 15, buyerEmail: user1.email });
    const booking = await createGiftCardBooking({ userId: user1.id, trainingId: training.id, gcCode: code });

    const res = await agent2.delete(`/api/bookings/${booking.id}`);
    expect(res.status).toBe(500);

    const gc = await getGiftCardByCode(code);
    expect(parseFloat(gc.balance)).toBe(15); // unchanged
  });
});

// ═══════════════════════════════════════════════════════════════════
// DESCRIBE 5: Zrušenie mixed-payment bookingu (user) — NOVÉ
// ═══════════════════════════════════════════════════════════════════
describe('Gift Card — Cancellation of mixed-payment booking (gift card + Stripe) by user', () => {
  beforeAll(fullCleanup);
  afterAll(fullCleanup);
  beforeEach(() => { resetStripeMocks(); jest.clearAllMocks(); });

  test('POSITIVE: cancel mixed booking → Stripe partial refund called + DP balance restored', async () => {
    const user = await createVerifiedUser('test_gcc_mixed_cancel_001@example.com');
    const agent = await loginAs(user.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_MCAN_001', price: 40, hoursFromNow: 48 });

    const code = testGcCode('MC001');
    await createGiftCardInDb({ code, amount: 30, balance: 0, status: 'used', buyerEmail: user.email });

    const paymentIntentId = `test_gcc_mcan_pi_001_${Date.now()}`;
    const booking = await createMixedPaymentBooking({
      userId: user.id, trainingId: training.id, gcCode: code,
      amountPaid: 35, giftCardAmount: 5, paymentIntentId,
    });

    mockStripe.refunds.create.mockResolvedValue({
      id: `test_gcc_mcan_refund_001_${Date.now()}`,
      status: 'succeeded',
      amount: 3500,
    });

    const res = await agent.delete(`/api/bookings/${booking.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Stripe refund bol zavolaný s čiastkou 35€ (nie 40€!)
    expect(mockStripe.refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent: paymentIntentId,
        amount: 3500, // 35€ v centoch
      }),
      expect.anything()
    );

    // DP balance bol obnovený: 0 + 5 = 5
    const gc = await getGiftCardByCode(code);
    expect(parseFloat(gc.balance)).toBe(5);
    expect(gc.status).toBe('active');

    // Booking bol zmazaný (soft-delete → not visible via active helper)
    const deletedBooking = await getActiveBookingById(booking.id);
    expect(deletedBooking).toBeNull();
  });

  test('POSITIVE: cancel mixed booking → refund record in DB má správnu sumu (len Stripe časť)', async () => {
    const user = await createVerifiedUser('test_gcc_mixed_cancel_002@example.com');
    const agent = await loginAs(user.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_MCAN_002', price: 40, hoursFromNow: 48 });

    const code = testGcCode('MC002');
    await createGiftCardInDb({ code, amount: 30, balance: 0, status: 'used', buyerEmail: user.email });

    const paymentIntentId = `test_gcc_mcan_pi_002_${Date.now()}`;
    const booking = await createMixedPaymentBooking({
      userId: user.id, trainingId: training.id, gcCode: code,
      amountPaid: 35, giftCardAmount: 5, paymentIntentId,
    });

    const refundId = `test_gcc_mcan_refund_002_${Date.now()}`;
    mockStripe.refunds.create.mockResolvedValue({ id: refundId, status: 'succeeded', amount: 3500 });

    await agent.delete(`/api/bookings/${booking.id}`);

    const refundRecord = await getRefundByBookingId(booking.id);
    expect(refundRecord).not.toBeNull();
    expect(parseFloat(refundRecord.amount)).toBe(35); // len Stripe časť
    expect(refundRecord.refund_id).toBe(refundId);
    expect(refundRecord.reason).toMatch(/mixed/i);
  });

  test('POSITIVE: cancel mixed booking with credit option → credit issued, gift card NOT restored', async () => {
    const user = await createVerifiedUser('test_gcc_mixed_cancel_003@example.com');
    const agent = await loginAs(user.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_MCAN_003', price: 40, hoursFromNow: 48 });

    const code = testGcCode('MC003');
    await createGiftCardInDb({ code, amount: 30, balance: 0, status: 'used', buyerEmail: user.email });

    const booking = await createMixedPaymentBooking({
      userId: user.id, trainingId: training.id, gcCode: code,
      amountPaid: 35, giftCardAmount: 5,
    });

    const res = await agent.delete(`/api/bookings/${booking.id}`).send({ requestCredit: true });
    expect(res.status).toBe(200);
    expect(res.body.creditIssued).toBe(true);

    // Stripe refund sa nevolá pri kredite
    expect(mockStripe.refunds.create).not.toHaveBeenCalled();

    // DP balance ostáva 0 — kredit pokrýva celú hodnotu
    const gc = await getGiftCardByCode(code);
    expect(parseFloat(gc.balance)).toBe(0);
  });

  test('POSITIVE: cancel mixed booking → cancellation email sent with mixed payment info', async () => {
    const emailService = require('../services/emailService');
    const user = await createVerifiedUser('test_gcc_mixed_cancel_004@example.com');
    const agent = await loginAs(user.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_MCAN_004', price: 40, hoursFromNow: 48 });

    const code = testGcCode('MC004');
    await createGiftCardInDb({ code, amount: 30, balance: 0, status: 'used', buyerEmail: user.email });

    const paymentIntentId = `test_gcc_mcan_pi_004_${Date.now()}`;
    const booking = await createMixedPaymentBooking({
      userId: user.id, trainingId: training.id, gcCode: code,
      amountPaid: 35, giftCardAmount: 5, paymentIntentId,
    });

    mockStripe.refunds.create.mockResolvedValue({ id: `ref_004_${Date.now()}`, status: 'succeeded' });

    await agent.delete(`/api/bookings/${booking.id}`);

    expect(emailService.sendCancellationEmails).toHaveBeenCalled();
    const callArgs = emailService.sendCancellationEmails.mock.calls[0];
    // 3. argument je booking objekt — musí mať gift_card_code a gift_card_amount
    const bookingArg = callArgs[2];
    expect(bookingArg.gift_card_code).toBe(code);
    expect(parseFloat(bookingArg.gift_card_amount)).toBe(5);
  });

  test('NEGATIVE: cancel mixed booking within 10 hours → 500, DP balance unchanged', async () => {
    const user = await createVerifiedUser('test_gcc_mixed_cancel_005@example.com');
    const agent = await loginAs(user.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_MCAN_005', price: 40, hoursFromNow: 5 });

    const code = testGcCode('MC005');
    await createGiftCardInDb({ code, amount: 30, balance: 0, status: 'used', buyerEmail: user.email });

    const booking = await createMixedPaymentBooking({
      userId: user.id, trainingId: training.id, gcCode: code,
      amountPaid: 35, giftCardAmount: 5,
    });

    const res = await agent.delete(`/api/bookings/${booking.id}`);
    expect(res.status).toBe(500);

    // DP balance ostáva 0
    const gc = await getGiftCardByCode(code);
    expect(parseFloat(gc.balance)).toBe(0);

    // Stripe refund sa nevolal
    expect(mockStripe.refunds.create).not.toHaveBeenCalled();
  });

  test('POSITIVE: cancel mixed booking where DP=0 (pure Stripe) → standard refund, no DP logic', async () => {
    const user = await createVerifiedUser('test_gcc_mixed_cancel_006@example.com');
    const agent = await loginAs(user.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_MCAN_006', price: 40, hoursFromNow: 48 });

    const code = testGcCode('MC006');
    await createGiftCardInDb({ code, amount: 30, balance: 30, buyerEmail: user.email });

    const paymentIntentId = `test_gcc_mcan_pi_006_${Date.now()}`;
    // giftCardAmount = 0 → čistá Stripe platba bez DP komponenty
    const booking = await createMixedPaymentBooking({
      userId: user.id, trainingId: training.id, gcCode: code,
      amountPaid: 40, giftCardAmount: 0, paymentIntentId,
    });

    mockStripe.refunds.create.mockResolvedValue({ id: `ref_006_${Date.now()}`, status: 'succeeded', amount: 4000 });

    const res = await agent.delete(`/api/bookings/${booking.id}`);
    expect(res.status).toBe(200);

    // Refund volaný za plnú cenu
    const refundCall = mockStripe.refunds.create.mock.calls[0][0];
    expect(refundCall.amount).toBe(4000);

    // DP balance sa nezmenil
    const gc = await getGiftCardByCode(code);
    expect(parseFloat(gc.balance)).toBe(30);
  });
});

// ═══════════════════════════════════════════════════════════════════
// DESCRIBE 6: GET /api/booking/refund — admin-initiated refund (NOVÉ)
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/booking/refund — mixed payment refund endpoint', () => {
  beforeAll(fullCleanup);
  afterAll(fullCleanup);
  beforeEach(() => { resetStripeMocks(); jest.clearAllMocks(); });

  test('POSITIVE: refund mixed booking → Stripe partial refund + DP balance restored', async () => {
    const user = await createVerifiedUser('test_gcc_refund_001@example.com');
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_REF_001', price: 40, hoursFromNow: 48 });

    const code = testGcCode('REF01');
    await createGiftCardInDb({ code, amount: 30, balance: 0, status: 'used', buyerEmail: user.email });

    const paymentIntentId = `test_gcc_ref_pi_001_${Date.now()}`;
    const booking = await createMixedPaymentBooking({
      userId: user.id, trainingId: training.id, gcCode: code,
      amountPaid: 35, giftCardAmount: 5, paymentIntentId,
    });

    const refundId = `test_gcc_ref_refund_001_${Date.now()}`;
    mockStripe.refunds.create.mockResolvedValue({ id: refundId, status: 'succeeded', amount: 3500 });

    const res = await request(app).get(`/api/booking/refund?bookingId=${booking.id}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('processed');
    expect(res.body.refundId).toBe(refundId);
    expect(res.body.giftCardRestored).toBe(true);
    expect(res.body.giftCardAmount).toBe(5);

    // Stripe volaný s 35€ (nie 40€)
    const stripeRefundCall = mockStripe.refunds.create.mock.calls[0][0];
    expect(stripeRefundCall.amount).toBe(3500);
    expect(stripeRefundCall.payment_intent).toBe(paymentIntentId);

    // DP balance obnovený: 0 + 5 = 5
    const gc = await getGiftCardByCode(code);
    expect(parseFloat(gc.balance)).toBe(5);
    expect(gc.status).toBe('active');

    // Booking deaktivovaný
    const b = await getBookingById(booking.id);
    expect(b.active).toBe(false);
  });

  test('POSITIVE: refund mixed booking → refund confirmation email sent with DP info', async () => {
    const emailService = require('../services/emailService');
    const user = await createVerifiedUser('test_gcc_refund_002@example.com');
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_REF_002', price: 40, hoursFromNow: 48 });

    const code = testGcCode('REF02');
    await createGiftCardInDb({ code, amount: 30, balance: 0, status: 'used', buyerEmail: user.email });

    const paymentIntentId = `test_gcc_ref_pi_002_${Date.now()}`;
    const booking = await createMixedPaymentBooking({
      userId: user.id, trainingId: training.id, gcCode: code,
      amountPaid: 35, giftCardAmount: 5, paymentIntentId,
    });

    mockStripe.refunds.create.mockResolvedValue({ id: `ref_002_${Date.now()}`, status: 'succeeded' });

    await request(app).get(`/api/booking/refund?bookingId=${booking.id}`);
    await new Promise(r => setTimeout(r, 200));

    expect(emailService.sendRefundConfirmationEmail).toHaveBeenCalledWith(
      user.email,
      expect.objectContaining({
        amount: 35,
        giftCardAmount: 5,
        giftCardCode: code,
      })
    );
  });

  test('POSITIVE: refund pure Stripe booking (no DP) → standard refund, DP logic skipped', async () => {
    const user = await createVerifiedUser('test_gcc_refund_003@example.com');
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_REF_003', price: 40, hoursFromNow: 48 });

    const paymentIntentId = `test_gcc_ref_pi_003_${Date.now()}`;
    // Booking bez DP (gift_card_code = null)
    const bookingInsert = await pool.query(
      `INSERT INTO bookings (user_id, training_id, number_of_children, amount_paid, payment_time,
        booked_at, active, booking_type, payment_intent_id, age_group, children_ages)
       VALUES ($1, $2, 1, 40, NOW(), NOW(), true, 'paid', $3, 'child', '5') RETURNING *`,
      [user.id, training.id, paymentIntentId]
    );
    const booking = bookingInsert.rows[0];

    const refundId = `ref_003_${Date.now()}`;
    mockStripe.refunds.create.mockResolvedValue({ id: refundId, status: 'succeeded', amount: 4000 });

    const res = await request(app).get(`/api/booking/refund?bookingId=${booking.id}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('processed');
    expect(res.body.giftCardRestored).toBe(false);

    // Stripe volaný za plnú sumu
    expect(mockStripe.refunds.create.mock.calls[0][0].amount).toBe(4000);
  });

  test('POSITIVE: idempotency — second refund call returns already-processed', async () => {
    const user = await createVerifiedUser('test_gcc_refund_004@example.com');
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_REF_004', price: 40, hoursFromNow: 48 });

    const paymentIntentId = `test_gcc_ref_pi_004_${Date.now()}`;
    const booking = await createMixedPaymentBooking({
      userId: user.id, trainingId: training.id, gcCode: testGcCode('RF04'),
      amountPaid: 35, giftCardAmount: 5, paymentIntentId,
    });
    const code = testGcCode('RF04');
    await createGiftCardInDb({ code, amount: 30, balance: 0, status: 'used', buyerEmail: user.email });
    // Update booking to use this code
    await pool.query(`UPDATE bookings SET gift_card_code = $1, gift_card_amount = 5 WHERE id = $2`, [code, booking.id]);

    const refundId = `ref_004_${Date.now()}`;
    mockStripe.refunds.create.mockResolvedValue({ id: refundId, status: 'succeeded' });

    const res1 = await request(app).get(`/api/booking/refund?bookingId=${booking.id}`);
    expect(res1.status).toBe(200);
    expect(res1.body.status).toBe('processed');

    const res2 = await request(app).get(`/api/booking/refund?bookingId=${booking.id}`);
    expect(res2.status).toBe(200);
    expect(res2.body.status).toBe('already');

    // Stripe refund volaný len raz
    expect(mockStripe.refunds.create).toHaveBeenCalledTimes(1);
  });

  test('NEGATIVE: refund with missing bookingId → 400', async () => {
    const res = await request(app).get('/api/booking/refund');
    expect(res.status).toBe(400);
  });

  test('NEGATIVE: refund for non-existent booking → 404', async () => {
    const res = await request(app).get('/api/booking/refund?bookingId=999999');
    expect(res.status).toBe(404);
  });

  test('NEGATIVE: Stripe error during refund → 500, DP still attempted to restore', async () => {
    const user = await createVerifiedUser('test_gcc_refund_005@example.com');
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_REF_005', price: 40, hoursFromNow: 48 });

    const code = testGcCode('REF05');
    await createGiftCardInDb({ code, amount: 30, balance: 0, status: 'used', buyerEmail: user.email });

    const paymentIntentId = `test_gcc_ref_pi_005_${Date.now()}`;
    const booking = await createMixedPaymentBooking({
      userId: user.id, trainingId: training.id, gcCode: code,
      amountPaid: 35, giftCardAmount: 5, paymentIntentId,
    });

    mockStripe.refunds.create.mockRejectedValue(Object.assign(new Error('Stripe error'), { code: 'api_error' }));

    const res = await request(app).get(`/api/booking/refund?bookingId=${booking.id}`);
    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
  });
});

// ═══════════════════════════════════════════════════════════════════
// DESCRIBE 7: Admin cancel session — rôzne typy bookingov
// ═══════════════════════════════════════════════════════════════════
describe('Admin cancellation — gift card and mixed booking expectations', () => {
  beforeAll(fullCleanup);
  afterAll(fullCleanup);
  beforeEach(() => { resetStripeMocks(); jest.clearAllMocks(); });

  test('POSITIVE: admin cancels session with pure gift_card booking → balance restored, email sent', async () => {
    const admin = await createVerifiedUser('test_gcc_admin_001@example.com', 'admin');
    const user = await createVerifiedUser('test_gcc_admin_user_001@example.com');
    const adminAgent = await loginAs(admin.email);
    const emailService = require('../services/emailService');

    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_ADMIN_001', price: 15, hoursFromNow: 48 });
    const code = testGcCode('ADM01');
    await createGiftCardInDb({ code, amount: 30, balance: 15, buyerEmail: user.email });
    await createGiftCardBooking({ userId: user.id, trainingId: training.id, gcCode: code });

    const res = await adminAgent.post('/api/admin/cancel-session').send({
      trainingId: training.id, reason: 'Test admin cancel gift card booking', forceCancel: false,
    });

    expect(res.status).toBe(200);
    await new Promise(r => setTimeout(r, 300));

    const cancelEmailCalled =
      emailService.sendMassCancellationEmail.mock.calls.length > 0 ||
      emailService.sendMassCancellationCredit.mock.calls.length > 0 ||
      emailService.sendMassCancellationSeasonTicket.mock.calls.length > 0;
    expect(cancelEmailCalled).toBe(true);
  });

  test('POSITIVE: admin cancels session → pure gift_card booking removed from DB', async () => {
    const admin = await createVerifiedUser('test_gcc_admin_002@example.com', 'admin');
    const user = await createVerifiedUser('test_gcc_admin_user_002@example.com');
    const adminAgent = await loginAs(admin.email);

    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_ADMIN_002', price: 15, hoursFromNow: 48 });
    const code = testGcCode('ADM02');
    await createGiftCardInDb({ code, amount: 30, balance: 15, buyerEmail: user.email });
    const booking = await createGiftCardBooking({ userId: user.id, trainingId: training.id, gcCode: code });

    await adminAgent.post('/api/admin/cancel-session').send({
      trainingId: training.id, reason: 'Test admin cancel 002', forceCancel: false,
    });
    await new Promise(r => setTimeout(r, 200));

    const b = await getActiveBookingById(booking.id);
    expect(b).toBeNull();
  });

  test('POSITIVE: admin cancels session with mixed booking → email sent with mixed payment info', async () => {
    const emailService = require('../services/emailService');
    const admin = await createVerifiedUser('test_gcc_admin_003@example.com', 'admin');
    const user = await createVerifiedUser('test_gcc_admin_user_003@example.com');
    const adminAgent = await loginAs(admin.email);

    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_ADMIN_003', price: 40, hoursFromNow: 48 });
    const code = testGcCode('ADM03');
    await createGiftCardInDb({ code, amount: 30, balance: 0, status: 'used', buyerEmail: user.email });
    const paymentIntentId = `test_gcc_admin_003_pi_${Date.now()}`;
    await createMixedPaymentBooking({
      userId: user.id, trainingId: training.id, gcCode: code,
      amountPaid: 35, giftCardAmount: 5, paymentIntentId,
    });

    await adminAgent.post('/api/admin/cancel-session').send({
      trainingId: training.id, reason: 'Lektor chorý', forceCancel: false,
    });
    await new Promise(r => setTimeout(r, 300));

    expect(emailService.sendMassCancellationEmail).toHaveBeenCalled();
    const callArgs = emailService.sendMassCancellationEmail.mock.calls[0];
    // 5. argument je mixedPaymentInfo objekt
    const mixedInfo = callArgs[4];
    expect(mixedInfo).toBeDefined();
    expect(mixedInfo.giftCardCode).toBe(code);
    expect(mixedInfo.giftCardAmount).toBe(5);
    expect(mixedInfo.stripeAmount).toBe(35);
  });

  test('POSITIVE: admin cancels session with mixed booking → booking stays active (pending user choice)', async () => {
    const admin = await createVerifiedUser('test_gcc_admin_004@example.com', 'admin');
    const user = await createVerifiedUser('test_gcc_admin_user_004@example.com');
    const adminAgent = await loginAs(admin.email);

    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_ADMIN_004', price: 40, hoursFromNow: 48 });
    const code = testGcCode('ADM04');
    await createGiftCardInDb({ code, amount: 30, balance: 0, status: 'used', buyerEmail: user.email });
    const paymentIntentId = `test_gcc_admin_004_pi_${Date.now()}`;
    const booking = await createMixedPaymentBooking({
      userId: user.id, trainingId: training.id, gcCode: code,
      amountPaid: 35, giftCardAmount: 5, paymentIntentId,
    });

    await adminAgent.post('/api/admin/cancel-session').send({
      trainingId: training.id, reason: 'Test 004', forceCancel: false,
    });
    await new Promise(r => setTimeout(r, 200));

    // Mixed payment booking (type='paid') ostáva aktívny, čaká na user voľbu (refund/kredit)
    const b = await getBookingById(booking.id);
    expect(b).not.toBeNull();
    expect(b.active).toBe(true);
  });

  test('NEGATIVE: admin cancel session within 10 hours without forceCancel → 400', async () => {
    const admin = await createVerifiedUser('test_gcc_admin_005@example.com', 'admin');
    const adminAgent = await loginAs(admin.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_ADMIN_005', price: 15, hoursFromNow: 5 });

    const res = await adminAgent.post('/api/admin/cancel-session').send({
      trainingId: training.id, reason: 'Test', forceCancel: false,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/10 hours|forceCancel/i);
  });

  test('POSITIVE: admin cancel session within 10 hours WITH forceCancel:true → succeeds', async () => {
    const admin = await createVerifiedUser('test_gcc_admin_006@example.com', 'admin');
    const adminAgent = await loginAs(admin.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_ADMIN_006', price: 15, hoursFromNow: 5 });

    const res = await adminAgent.post('/api/admin/cancel-session').send({
      trainingId: training.id, reason: 'Urgent cancel', forceCancel: true,
    });
    expect(res.status).toBe(200);
  });

  test('NEGATIVE: non-admin user cannot cancel session → 403', async () => {
    const user = await createVerifiedUser('test_gcc_admin_007@example.com');
    const agent = await loginAs(user.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_ADMIN_007', price: 15, hoursFromNow: 48 });

    const res = await agent.post('/api/admin/cancel-session').send({
      trainingId: training.id, reason: 'Test', forceCancel: false,
    });
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════
// DESCRIBE 8: Booking type detection endpoint
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/bookings/:bookingId/type — gift_card detection', () => {
  beforeAll(fullCleanup);
  afterAll(fullCleanup);
  beforeEach(() => { resetStripeMocks(); jest.clearAllMocks(); });

  test('POSITIVE: booking_type=gift_card returns bookingType=gift_card', async () => {
    const user = await createVerifiedUser('test_gcc_type_001@example.com');
    const agent = await loginAs(user.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_TYPE_001', price: 15, hoursFromNow: 48 });
    const code = testGcCode('TYP01');
    await createGiftCardInDb({ code, amount: 30, balance: 15, buyerEmail: user.email });
    const booking = await createGiftCardBooking({ userId: user.id, trainingId: training.id, gcCode: code });

    const res = await agent.get(`/api/bookings/${booking.id}/type`);
    expect(res.status).toBe(200);
    expect(res.body.bookingType).toBe('gift_card');
  });

  test('POSITIVE: booking with session_id starting GIFT_CARD_ also returns gift_card type', async () => {
    const user = await createVerifiedUser('test_gcc_type_002@example.com');
    const agent = await loginAs(user.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_TYPE_002', price: 15, hoursFromNow: 48 });
    const code = testGcCode('TYP02');
    await createGiftCardInDb({ code, amount: 30, balance: 15, buyerEmail: user.email });
    const result = await pool.query(
      `INSERT INTO bookings (user_id, training_id, number_of_children, booked_at, active,
        booking_type, session_id, age_group, children_ages)
       VALUES ($1, $2, 1, NOW(), true, 'paid', $3, 'child', '5') RETURNING *`,
      [user.id, training.id, `GIFT_CARD_${code}`]
    );

    const res = await agent.get(`/api/bookings/${result.rows[0].id}/type`);
    expect(res.status).toBe(200);
    expect(res.body.bookingType).toBe('gift_card');
  });

  test('POSITIVE: mixed booking (type=paid, has gift_card_code) returns bookingType=paid', async () => {
    const user = await createVerifiedUser('test_gcc_type_003@example.com');
    const agent = await loginAs(user.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_TYPE_003', price: 40, hoursFromNow: 48 });
    const code = testGcCode('TYP03');
    await createGiftCardInDb({ code, amount: 30, balance: 0, status: 'used', buyerEmail: user.email });
    const booking = await createMixedPaymentBooking({
      userId: user.id, trainingId: training.id, gcCode: code,
      amountPaid: 35, giftCardAmount: 5,
    });

    const res = await agent.get(`/api/bookings/${booking.id}/type`);
    expect(res.status).toBe(200);
    // Mixed je stále 'paid' booking_type
    expect(res.body.bookingType).toBe('paid');
  });

  test('NEGATIVE: booking belonging to another user → 404', async () => {
    const user1 = await createVerifiedUser('test_gcc_type_004a@example.com');
    const user2 = await createVerifiedUser('test_gcc_type_004b@example.com');
    const agent2 = await loginAs(user2.email);
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_TYPE_004', price: 15, hoursFromNow: 48 });
    const code = testGcCode('TYP04');
    await createGiftCardInDb({ code, amount: 30, balance: 15, buyerEmail: user1.email });
    const booking = await createGiftCardBooking({ userId: user1.id, trainingId: training.id, gcCode: code });

    const res = await agent2.get(`/api/bookings/${booking.id}/type`);
    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════
// DESCRIBE 9: Full lifecycle end-to-end
// ═══════════════════════════════════════════════════════════════════
describe('Gift Card — Full lifecycle end-to-end', () => {
  beforeAll(fullCleanup);
  afterAll(fullCleanup);
  beforeEach(() => { resetStripeMocks(); jest.clearAllMocks(); });

  test('LIFECYCLE: purchase → partial use → cancel → balance restored → full use → used', async () => {
    const user = await createVerifiedUser('test_gcc_lifecycle_001@example.com');
    const agent = await loginAs(user.email);

    // STEP 1: Purchase 50€ gift card
    const sessionId = `test_gcc_lifecycle_session_${Date.now()}`;
    mockStripe.checkout.sessions.retrieve.mockResolvedValue({
      id: sessionId, payment_status: 'paid',
      metadata: {
        type: 'gift_card', amount: '50',
        buyerEmail: user.email, recipientName: 'Maťko',
        recipientEmail: '', message: '',
      },
    });

    const successRes = await request(app).get(`/api/gift-card-success?session_id=${sessionId}`);
    expect(successRes.status).toBe(200);
    const code = successRes.body.code;
    expect(code).toHaveLength(12);

    // STEP 2: Validate — full 50€
    const v1 = await request(app).post('/api/validate-gift-card').send({ code });
    expect(v1.status).toBe(200);
    expect(parseFloat(v1.body.balance)).toBe(50);

    // STEP 3: Use 15€ on a booking (fully covered by DP)
    const { type: t1, training: tr1 } = await createTrainingWithPrice({ name: 'TEST_GCC_LIFE_001A', price: 15, hoursFromNow: 48 });
    const bookingRes = await agent.post('/api/create-payment-session').send({
      userId: user.id, trainingId: tr1.id, trainingType: t1.name,
      selectedDate: '2025-09-01', selectedTime: '10:00',
      childrenCount: 1, childrenAge: '5', totalPrice: 15,
      photoConsent: null, mobile: '', note: '',
      accompanyingPerson: false, allowDuplicate: false,
      giftCardCode: code, giftCardDiscount: 15,
    });
    expect(bookingRes.status).toBe(200);
    expect(bookingRes.body.free).toBe(true);

    // Balance now 35€
    const gc2 = await getGiftCardByCode(code);
    expect(parseFloat(gc2.balance)).toBe(35);

    // STEP 4: Cancel booking → balance restored to 50€
    const booking = await pool.query(
      `SELECT id FROM bookings WHERE user_id = $1 AND training_id = $2 AND active = true`,
      [user.id, tr1.id]
    );
    const bookingId = booking.rows[0].id;

    const cancelRes = await agent.delete(`/api/bookings/${bookingId}`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.giftCardBalanceRestored).toBe(true);

    const gc3 = await getGiftCardByCode(code);
    expect(parseFloat(gc3.balance)).toBe(50);
    expect(gc3.status).toBe('active');

    // STEP 5: Use all 50€ on next booking
    const { type: t2, training: tr2 } = await createTrainingWithPrice({ name: 'TEST_GCC_LIFE_001B', price: 50, hoursFromNow: 48 });
    const bookingRes2 = await agent.post('/api/create-payment-session').send({
      userId: user.id, trainingId: tr2.id, trainingType: t2.name,
      selectedDate: '2025-09-02', selectedTime: '11:00',
      childrenCount: 1, childrenAge: '5', totalPrice: 50,
      photoConsent: null, mobile: '', note: '',
      accompanyingPerson: false, allowDuplicate: false,
      giftCardCode: code, giftCardDiscount: 50,
    });
    expect(bookingRes2.status).toBe(200);
    expect(bookingRes2.body.free).toBe(true);

    // STEP 6: Gift card fully used
    const gcFinal = await getGiftCardByCode(code);
    expect(parseFloat(gcFinal.balance)).toBe(0);
    expect(gcFinal.status).toBe('used');
    expect(gcFinal.redeemedAt).not.toBeNull();

    // STEP 7: Validate — rejected
    const v3 = await request(app).post('/api/validate-gift-card').send({ code });
    expect(v3.status).toBe(400);
    expect(v3.body.error).toMatch(/využit/i);
  });

  test('LIFECYCLE (mixed): purchase → mixed booking → cancel → Stripe refund + DP restore', async () => {
    const user = await createVerifiedUser('test_gcc_lifecycle_002@example.com');
    const agent = await loginAs(user.email);

    // STEP 1: Purchase 30€ gift card
    const sessionId = `test_gcc_lifecycle_002_session_${Date.now()}`;
    mockStripe.checkout.sessions.retrieve.mockResolvedValue({
      id: sessionId, payment_status: 'paid',
      metadata: {
        type: 'gift_card', amount: '30',
        buyerEmail: user.email, recipientName: 'Test', recipientEmail: '', message: '',
      },
    });
    const gcRes = await request(app).get(`/api/gift-card-success?session_id=${sessionId}`);
    expect(gcRes.status).toBe(200);
    const code = gcRes.body.code;

    // STEP 2: Create 40€ training, use 30€ DP + 10€ Stripe
    const { type, training } = await createTrainingWithPrice({ name: 'TEST_GCC_LIFE_002A', price: 40, hoursFromNow: 48 });
    const paymentIntentId = `test_gcc_life_002_pi_${Date.now()}`;

    // Simulujeme mixed booking priamo v DB (ako keby booking-success prebehol)
    const bookingInsert = await pool.query(
      `INSERT INTO bookings (user_id, training_id, number_of_children, amount_paid, payment_time,
        booked_at, active, booking_type, payment_intent_id, gift_card_code, gift_card_amount, age_group, children_ages)
       VALUES ($1, $2, 1, 10, NOW(), NOW(), true, 'paid', $3, $4, 30, 'child', '5') RETURNING *`,
      [user.id, training.id, paymentIntentId, code]
    );
    const booking = bookingInsert.rows[0];

    // Decrement gift card balance (ako keby webhook prebehol)
    await pool.query(`UPDATE gift_card SET balance = 0, status = 'used', "redeemedAt" = NOW() WHERE code = $1`, [code]);

    // STEP 3: Validate — DP used
    const gc1 = await getGiftCardByCode(code);
    expect(parseFloat(gc1.balance)).toBe(0);
    expect(gc1.status).toBe('used');

    // STEP 4: Cancel booking → Stripe refund (10€) + DP restore (30€)
    const refundId = `ref_life_002_${Date.now()}`;
    mockStripe.refunds.create.mockResolvedValue({ id: refundId, status: 'succeeded', amount: 1000 });

    const cancelRes = await agent.delete(`/api/bookings/${booking.id}`);
    expect(cancelRes.status).toBe(200);

    // Stripe volaný za 10€
    expect(mockStripe.refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1000 }),
      expect.anything()
    );

    // DP obnovený: 0 + 30 = 30
    const gcAfter = await getGiftCardByCode(code);
    expect(parseFloat(gcAfter.balance)).toBe(30);
    expect(gcAfter.status).toBe('active');

    // Booking zmazaný (soft-delete → not visible via active helper)
    const deletedBooking = await getActiveBookingById(booking.id);
    expect(deletedBooking).toBeNull();

    // STEP 5: DP je znova použiteľný
    const v = await request(app).post('/api/validate-gift-card').send({ code });
    expect(v.status).toBe(200);
    expect(parseFloat(v.body.balance)).toBe(30);
  });
});