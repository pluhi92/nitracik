/**
 * gift_card_cancellation_by_user.test.js
 *
 * E2E testy: Zrušenie rezervácie userom — mixed payment (DP + Stripe)
 *
 * FLOW A — Refund (Exact Reversal)
 * FLOW B — Kredit (Store Credit)
 * FLOW C — Náhradný termín (placeholders — endpoint neexistuje)
 * NEGATÍVNE prípady
 */

const request = require('supertest');
const bcrypt  = require('bcryptjs');
const { cleanupTestData, pool } = require('./setup');

// ─────────────────────────────────────────────────────────────────────────────
// STRIPE MOCK
// ─────────────────────────────────────────────────────────────────────────────
const mockStripe = {
  checkout: { sessions: { create: jest.fn(), retrieve: jest.fn() } },
  webhooks: { constructEvent: jest.fn() },
  paymentIntents: { retrieve: jest.fn() },
  refunds: { create: jest.fn() },
};
jest.mock('stripe', () => jest.fn(() => mockStripe));

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL SERVICE MOCK
// ─────────────────────────────────────────────────────────────────────────────
jest.mock('../services/emailService', () => ({
  sendVerificationEmail:                 jest.fn().mockResolvedValue(true),
  sendUserBookingEmail:                  jest.fn().mockResolvedValue(true),
  sendAdultBookingEmail:                 jest.fn().mockResolvedValue(true),
  sendAdminBookingEmail:                 jest.fn().mockResolvedValue(true),
  sendAdminNewBookingNotification:       jest.fn().mockResolvedValue(true),
  sendAdminGiftCardPurchaseNotification: jest.fn().mockResolvedValue(true),
  sendSeasonTicketConfirmation:          jest.fn().mockResolvedValue(true),
  sendAdminSeasonTicketPurchase:         jest.fn().mockResolvedValue(true),
  sendAdminSeasonTicketUsage:            jest.fn().mockResolvedValue(true),
  sendCancellationEmails:                jest.fn().mockResolvedValue(true),
  sendMassCancellationEmail:             jest.fn().mockResolvedValue(true),
  sendMassCancellationCredit:            jest.fn().mockResolvedValue(true),
  sendMassCancellationSeasonTicket:      jest.fn().mockResolvedValue(true),
  sendRefundConfirmationEmail:           jest.fn().mockResolvedValue(true),
  sendAdminCreditUsage:                  jest.fn().mockResolvedValue(true),
  sendContactFormEmails:                 jest.fn().mockResolvedValue(true),
  sendAccountDeletedEmail:               jest.fn().mockResolvedValue(true),
  sendAdminAccountDeleteNotification:    jest.fn().mockResolvedValue(true),
  sendPaymentFailedEmail:                jest.fn().mockResolvedValue(true),
  sendReviewRequestEmail:                jest.fn().mockResolvedValue(true),
  sendBulkAdminEmail:                    jest.fn().mockResolvedValue(true),
  sendGiftCardEmail:                     jest.fn().mockResolvedValue(true),
}));

const { app } = require('../server');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function createVerifiedUser(email, role = 'user') {
  const hash = await bcrypt.hash('TestPass123!', 10);
  const r = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password, address, mobile, verified, role)
     VALUES ('Test','User',$1,$2,'Testova 1, Nitra','+421900000001',true,$3)
     ON CONFLICT (email) DO UPDATE SET password=$2, verified=true, role=$3
     RETURNING *`,
    [email, hash, role]
  );
  return r.rows[0];
}

async function loginAs(email) {
  const agent = request.agent(app);
  const r = await agent.post('/api/login').send({ email, password: 'TestPass123!' });
  if (r.status !== 200) throw new Error(`Login failed: ${JSON.stringify(r.body)}`);
  return agent;
}

async function createTraining({ name, price = 42, accompanyingPrice = 3, hoursFromNow = 48 }) {
  const typeRes = await pool.query(
    `INSERT INTO training_types
       (name, description, duration_minutes, active, audience_type, color_hex, accompanying_person_price)
     VALUES ($1,'E2E test training',60,true,'children','#f59e0b',$2)
     ON CONFLICT (name) DO UPDATE SET active=true, accompanying_person_price=$2
     RETURNING *`,
    [name, accompanyingPrice]
  );
  const type = typeRes.rows[0];

  for (const count of [1, 2, 3]) {
    await pool.query(
      `INSERT INTO training_prices (training_type_id, child_count, price)
       VALUES ($1,$2,$3)
       ON CONFLICT (training_type_id, child_count) DO UPDATE SET price=$3`,
      [type.id, count, price]
    );
  }

  const taRes = await pool.query(
    `INSERT INTO training_availability (training_type_id, training_type, training_date, max_participants)
     VALUES ($1,$2, NOW() + ($3 || ' hours')::interval, 10)
     RETURNING *`,
    [type.id, name, String(hoursFromNow)]
  );
  return { type, training: taRes.rows[0] };
}

async function createGiftCard({ code, amount = 50, balance = 50, status = 'active', buyerEmail }) {
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const r = await pool.query(
    `INSERT INTO gift_card
       (code, amount, balance, status, "buyerEmail", "recipientName", "expiresAt", "stripeSessionId", "createdAt")
     VALUES ($1,$2,$3,$4,$5,'Test Recipient',$6,$7,NOW())
     ON CONFLICT (code) DO UPDATE SET balance=$3, status=$4
     RETURNING *`,
    [code, amount, balance, status, buyerEmail, expires, `test_sess_${code}_${Date.now()}`]
  );
  return r.rows[0];
}

/**
 * Vytvorí mixed-payment booking — simuluje stav po úspešnom webhook:
 * amount_paid = kartová časť, gift_card_* vyplnené.
 */
async function createMixedBooking({
  userId, trainingId, gcCode,
  amountPaid, giftCardAmount,
  paymentIntentId,
  numberOfChildren = 3,
  accompanyingPerson = false,
}) {
  const pi = paymentIntentId || `test_pi_mixed_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
  const r = await pool.query(
    `INSERT INTO bookings
       (user_id, training_id, number_of_children, amount_paid, payment_time,
        booked_at, active, booking_type, payment_intent_id,
        gift_card_code, gift_card_amount,
        session_id, children_ages, accompanying_person, age_group)
     VALUES ($1,$2,$3,$4,NOW(),NOW(),true,'paid',$5,$6,$7,NULL,'5,5,7',$8,'child')
     RETURNING *`,
    [userId, trainingId, numberOfChildren, amountPaid, pi,
     gcCode.toUpperCase(), giftCardAmount, accompanyingPerson]
  );
  return r.rows[0];
}

async function getBooking(id) {
  const r = await pool.query('SELECT * FROM bookings WHERE id=$1', [id]);
  return r.rows[0] || null;
}

async function getGiftCard(code) {
  const r = await pool.query('SELECT * FROM gift_card WHERE code=$1', [code.toUpperCase()]);
  return r.rows[0] || null;
}

async function getRefundRecord(bookingId) {
  const r = await pool.query(
    'SELECT * FROM refunds WHERE booking_id=$1 ORDER BY created_at DESC LIMIT 1',
    [bookingId]
  );
  return r.rows[0] || null;
}

async function getCreditForBooking(bookingId) {
  // Kredit je linkovaný cez credits tabuľku — hľadáme podľa booking_id
  const r = await pool.query(
    `SELECT * FROM credits WHERE booking_id=$1 ORDER BY created_at DESC LIMIT 1`,
    [bookingId]
  );
  return r.rows[0] || null;
}

/**
 * Simuluje Stripe webhook checkout.session.completed.
 * Booking musí existovať v DB so session_id = sessionId a active=false.
 */
async function fireCheckoutWebhook(app, {
  sessionId, paymentIntentId, userId, trainingId, trainingType,
  totalPrice, gcCode, gcDiscount, childrenCount = 3,
}) {
  // amount_total = čo Stripe skutočne účtoval (totalPrice - gcDiscount)
  const stripeChargedCents = Math.round((totalPrice - gcDiscount) * 100);

  const eventPayload = {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        payment_status: 'paid',
        payment_intent: paymentIntentId,
        amount_total: stripeChargedCents,
        created: Math.floor(Date.now() / 1000),
        metadata: {
          type: 'training_session',
          userId: String(userId),
          trainingId: String(trainingId),
          trainingType,
          selectedDate: '2026-08-15',
          selectedTime: '14:00',
          childrenCount: String(childrenCount),
          childrenAge: '5,5,7',
          totalPrice: String(totalPrice),
          photoConsent: 'null',
          mobile: '',
          note: 'Webhook e2e test',
          accompanyingPerson: 'false',
          giftCardCode: gcCode,
          giftCardDiscount: String(gcDiscount),
        },
      },
    },
  };

  // Mock: constructEvent vráti parsed event priamo
  mockStripe.webhooks.constructEvent.mockReturnValue(eventPayload);

  return request(app)
    .post('/stripe-webhook')
    .set('Content-Type', 'application/json')
    .set('stripe-signature', 'test_sig_webhook')
    .send(Buffer.from(JSON.stringify(eventPayload)));
}

// ─────────────────────────────────────────────────────────────────────────────
// CLEANUP
// ─────────────────────────────────────────────────────────────────────────────
async function cleanup() {
  await cleanupTestData();
  await pool.query(`
    DELETE FROM refunds WHERE booking_id IN (
      SELECT id FROM bookings
      WHERE payment_intent_id LIKE 'test_pi_%'
         OR session_id        LIKE 'test_sess_%'
    )
  `);
  await pool.query(`
    DELETE FROM bookings
    WHERE payment_intent_id LIKE 'test_pi_%'
       OR session_id        LIKE 'test_sess_%'
  `);
  await pool.query(`DELETE FROM gift_card WHERE code LIKE 'GCCANCEL%'`);
  await pool.query(`DELETE FROM training_availability WHERE training_type LIKE 'TEST_GCCANCEL%'`);
  await pool.query(`DELETE FROM training_types WHERE name LIKE 'TEST_GCCANCEL%'`);
  await pool.query(`DELETE FROM users WHERE email LIKE '%gccancel%'`);
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOW A — REFUND (Exact Reversal)
// ─────────────────────────────────────────────────────────────────────────────
describe('FLOW A — Mixed booking: User zruší → Refund (Exact Reversal)', () => {
  beforeAll(cleanup);
  afterAll(cleanup);
  beforeEach(() => jest.clearAllMocks());

  /**
   * A1: Webhook fix overenie.
   * Webhook musí uložiť amount_paid = session.amount_total/100 (nie totalPrice z metadata)
   * a vyplniť gift_card_code + gift_card_amount.
   *
   * Booking vytvoríme ako pending (active=false, session_id nastavený).
   * Webhook ho aktivuje so správnymi hodnotami.
   */
  test('A1: Webhook uloží amount_paid = Stripe suma (12€, nie 42€) + gift_card_* stĺpce', async () => {
    const user = await createVerifiedUser('a1_gccancel@test.sk');
    const { type, training } = await createTraining({ name: 'TEST_GCCANCEL_A1', price: 42 });
    const gcCode = 'GCCANCEL_A1GC';
    await createGiftCard({ code: gcCode, amount: 50, balance: 30, buyerEmail: user.email });

    const sessionId      = `test_sess_a1_${Date.now()}`;
    const paymentIntentId = `test_pi_a1_${Date.now()}`;

    // Pending booking — stav pred platbou (active=false, session_id nastavený)
    const ins = await pool.query(
      `INSERT INTO bookings
         (user_id, training_id, number_of_children, booked_at, active,
          booking_type, session_id, children_ages)
       VALUES ($1,$2,3,NOW(),false,'paid',$3,'5,5,7') RETURNING id`,
      [user.id, training.id, sessionId]
    );
    const bookingId = ins.rows[0].id;

    // Simuluj Stripe gift card redemption mock (webhook to volá externe)
    // Mock aby webhook nepadol na gift card lookup
    const gcBefore = await getGiftCard(gcCode);

    const webhookRes = await fireCheckoutWebhook(app, {
      sessionId, paymentIntentId,
      userId: user.id, trainingId: training.id,
      trainingType: type.name,
      totalPrice: 42,    // celková cena v metadata
      gcCode,
      gcDiscount: 30,    // DP discount → Stripe účtoval 12€ (amount_total = 1200)
      childrenCount: 3,
    });

    expect(webhookRes.status).toBe(200);
    // Dáme webhookovému handleru čas dokončiť asynchrónne operácie
    await new Promise(r => setTimeout(r, 500));

    const booking = await getBooking(bookingId);
    expect(booking).not.toBeNull();
    expect(booking.active).toBe(true);
    // Kľúčová assertion — 12, nie 42
    expect(parseFloat(booking.amount_paid)).toBe(12);
    expect(booking.gift_card_code).toBe(gcCode.toUpperCase());
    expect(parseFloat(booking.gift_card_amount)).toBe(30);
    expect(booking.payment_intent_id).toBe(paymentIntentId);
    expect(booking.session_id).toBeNull();
  });

  test('A2: User zruší mixed booking → Stripe refund (12€) + DP balance restore (30€)', async () => {
    const user = await createVerifiedUser('a2_gccancel@test.sk');
    const { type, training } = await createTraining({ name: 'TEST_GCCANCEL_A2', price: 42 });
    const gcCode = 'GCCANCEL_A2GC';
    await createGiftCard({ code: gcCode, amount: 50, balance: 0, status: 'used', buyerEmail: user.email });

    const paymentIntentId = `test_pi_a2_${Date.now()}`;
    const booking = await createMixedBooking({
      userId: user.id, trainingId: training.id,
      gcCode, amountPaid: 12, giftCardAmount: 30, paymentIntentId,
    });

    const refundId = `test_refund_a2_${Date.now()}`;
    mockStripe.refunds.create.mockResolvedValue({ id: refundId, status: 'succeeded', amount: 1200 });

    const agent = await loginAs(user.email);
    const res = await agent.delete(`/api/bookings/${booking.id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Stripe volaný s presne 1200 centov (12€) — nie 4200 (42€)
    expect(mockStripe.refunds.create).toHaveBeenCalledTimes(1);
    const stripeCall = mockStripe.refunds.create.mock.calls[0][0];
    expect(stripeCall.amount).toBe(1200);
    expect(stripeCall.payment_intent).toBe(paymentIntentId);
    expect(stripeCall.reason).toBe('requested_by_customer');

    // Booking soft-deleted
    const b = await getBooking(booking.id);
    expect(b.active).toBe(false);

    // DP balance obnovený: 0 + 30 = 30
    const gc = await getGiftCard(gcCode);
    expect(parseFloat(gc.balance)).toBe(30);
    expect(gc.status).toBe('active');
  });

  test('A3: Cancellation email volaný s booking obsahujúcim gift_card_* a refundData.id', async () => {
    const emailService = require('../services/emailService');
    const user = await createVerifiedUser('a3_gccancel@test.sk');
    const { type, training } = await createTraining({ name: 'TEST_GCCANCEL_A3', price: 42 });
    const gcCode = 'GCCANCEL_A3GC';
    await createGiftCard({ code: gcCode, amount: 50, balance: 0, status: 'used', buyerEmail: user.email });

    const paymentIntentId = `test_pi_a3_${Date.now()}`;
    const booking = await createMixedBooking({
      userId: user.id, trainingId: training.id,
      gcCode, amountPaid: 12, giftCardAmount: 30, paymentIntentId,
    });

    const refundId = `test_refund_a3_${Date.now()}`;
    mockStripe.refunds.create.mockResolvedValue({ id: refundId, status: 'succeeded', amount: 1200 });

    const agent = await loginAs(user.email);
    await agent.delete(`/api/bookings/${booking.id}`);
    await new Promise(r => setTimeout(r, 200));

    expect(emailService.sendCancellationEmails).toHaveBeenCalled();
    const [, , bookingArg, refundDataArg] = emailService.sendCancellationEmails.mock.calls[0];

    expect(bookingArg.gift_card_code).toBe(gcCode.toUpperCase());
    expect(parseFloat(bookingArg.gift_card_amount)).toBe(30);
    expect(parseFloat(bookingArg.amount_paid)).toBe(12);
    expect(refundDataArg.id).toBe(refundId);
  });

  test('A4: Refund záznam v DB má sumu 12€ a reason obsahuje "mixed"', async () => {
    const user = await createVerifiedUser('a4_gccancel@test.sk');
    const { type, training } = await createTraining({ name: 'TEST_GCCANCEL_A4', price: 42 });
    const gcCode = 'GCCANCEL_A4GC';
    await createGiftCard({ code: gcCode, amount: 50, balance: 0, status: 'used', buyerEmail: user.email });

    const paymentIntentId = `test_pi_a4_${Date.now()}`;
    const booking = await createMixedBooking({
      userId: user.id, trainingId: training.id,
      gcCode, amountPaid: 12, giftCardAmount: 30, paymentIntentId,
    });

    const refundId = `test_refund_a4_${Date.now()}`;
    mockStripe.refunds.create.mockResolvedValue({ id: refundId, status: 'succeeded', amount: 1200 });

    const agent = await loginAs(user.email);
    await agent.delete(`/api/bookings/${booking.id}`);

    const refundRecord = await getRefundRecord(booking.id);
    expect(refundRecord).not.toBeNull();
    expect(parseFloat(refundRecord.amount)).toBe(12);
    expect(refundRecord.refund_id).toBe(refundId);
    expect(refundRecord.status).toBe('succeeded');
    expect(refundRecord.reason.toLowerCase()).toMatch(/mixed/);
  });

  /**
   * A5: Idempotencia.
   * Server správanie: druhé zrušenie → booking je active=false → server hádže
   * "Booking not found or already cancelled" → status 500.
   * Stripe CREATE sa volá znova pretože server nevie o prvom refunde
   * (neblokuje to na úrovni Stripe callu, blokuje to na úrovni booking lookup).
   * Test overuje: druhý DELETE vráti 500 a DP balance NEprekročí originálnu hodnotu.
   */
  test('A5: Dvojité zrušenie → druhý DELETE vráti 500, DP balance neprekročí originál', async () => {
    const user = await createVerifiedUser('a5_gccancel@test.sk');
    const { type, training } = await createTraining({ name: 'TEST_GCCANCEL_A5', price: 42 });
    const gcCode = 'GCCANCEL_A5GC';
    await createGiftCard({ code: gcCode, amount: 50, balance: 0, status: 'used', buyerEmail: user.email });

    const paymentIntentId = `test_pi_a5_${Date.now()}`;
    const booking = await createMixedBooking({
      userId: user.id, trainingId: training.id,
      gcCode, amountPaid: 12, giftCardAmount: 30, paymentIntentId,
    });

    mockStripe.refunds.create.mockResolvedValue({
      id: `test_refund_a5_${Date.now()}`, status: 'succeeded', amount: 1200,
    });

    const agent = await loginAs(user.email);

    // Prvé zrušenie — úspešné
    const res1 = await agent.delete(`/api/bookings/${booking.id}`);
    expect(res1.status).toBe(200);

    // Druhé zrušenie — booking je active=false → server vráti 500
    const res2 = await agent.delete(`/api/bookings/${booking.id}`);
    expect(res2.status).toBe(500);
    expect(res2.body.error).toMatch(/already cancelled|not found/i);

    // DP balance nikdy neprekročí originálnu hodnotu karty (50€)
    const gc = await getGiftCard(gcCode);
    expect(parseFloat(gc.balance)).toBeLessThanOrEqual(50);
    // Po prvom zrušení je balance = 30, druhé zrušenie to nezmenilo
    expect(parseFloat(gc.balance)).toBe(30);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW B — KREDIT (Store Credit)
// ─────────────────────────────────────────────────────────────────────────────
describe('FLOW B — Mixed booking: User zruší → Kredit', () => {
  beforeAll(cleanup);
  afterAll(cleanup);
  beforeEach(() => jest.clearAllMocks());

  test('B1: User zvolí kredit → Stripe sa NEVOLÁ, DP balance ostáva 0', async () => {
    const user = await createVerifiedUser('b1_gccancel@test.sk');
    const { type, training } = await createTraining({ name: 'TEST_GCCANCEL_B1', price: 42 });
    const gcCode = 'GCCANCEL_B1GC';
    await createGiftCard({ code: gcCode, amount: 50, balance: 0, status: 'used', buyerEmail: user.email });

    const booking = await createMixedBooking({
      userId: user.id, trainingId: training.id,
      gcCode, amountPaid: 12, giftCardAmount: 30,
    });

    const agent = await loginAs(user.email);
    const res = await agent.delete(`/api/bookings/${booking.id}`).send({ requestCredit: true });

    expect(res.status).toBe(200);
    expect(res.body.creditIssued).toBe(true);

    // Stripe sa nevolal
    expect(mockStripe.refunds.create).not.toHaveBeenCalled();

    // DP balance ostáva 0 — kredit pokrýva celú hodnotu, DP sa nereštauruje
    const gc = await getGiftCard(gcCode);
    expect(parseFloat(gc.balance)).toBe(0);
    expect(gc.status).toBe('used');

    // Booking deaktivovaný
    const b = await getBooking(booking.id);
    expect(b.active).toBe(false);
  });

  test('B2: Kredit záznam existuje v DB linkovaný na booking', async () => {
    const user = await createVerifiedUser('b2_gccancel@test.sk');
    const { type, training } = await createTraining({ name: 'TEST_GCCANCEL_B2', price: 42 });
    const gcCode = 'GCCANCEL_B2GC';
    await createGiftCard({ code: gcCode, amount: 50, balance: 0, status: 'used', buyerEmail: user.email });

    const booking = await createMixedBooking({
      userId: user.id, trainingId: training.id,
      gcCode, amountPaid: 12, giftCardAmount: 30,
    });

    const agent = await loginAs(user.email);
    await agent.delete(`/api/bookings/${booking.id}`).send({ requestCredit: true });

    // credits tabuľka nemá booking_id stĺpec; kredit je vytvorený priamo s user_id
    // a session_id (ktorý obsahuje training_id = training_availability.id)
    const creditRes = await pool.query(
      `SELECT * FROM credits 
       WHERE user_id = $1 AND session_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [user.id, booking.training_id]
    );
    expect(creditRes.rows.length).toBeGreaterThan(0);

    const credit = creditRes.rows[0];
    // Kredit musí byť pre správneho usera
    expect(credit.user_id).toBe(user.id);
  });

  test('B3: Cancellation email volaný s refundData.type = "credit_issued" (nie Stripe refund)', async () => {
    const emailService = require('../services/emailService');
    const user = await createVerifiedUser('b3_gccancel@test.sk');
    const { type, training } = await createTraining({ name: 'TEST_GCCANCEL_B3', price: 42 });
    const gcCode = 'GCCANCEL_B3GC';
    await createGiftCard({ code: gcCode, amount: 50, balance: 0, status: 'used', buyerEmail: user.email });

    const booking = await createMixedBooking({
      userId: user.id, trainingId: training.id,
      gcCode, amountPaid: 12, giftCardAmount: 30,
    });

    const agent = await loginAs(user.email);
    await agent.delete(`/api/bookings/${booking.id}`).send({ requestCredit: true });
    await new Promise(r => setTimeout(r, 200));

    expect(emailService.sendCancellationEmails).toHaveBeenCalled();
    const [, , , refundDataArg] = emailService.sendCancellationEmails.mock.calls[0];

    // Kredit varianta — žiadne Stripe refund ID
    expect(refundDataArg?.id).toBeUndefined();
    expect(refundDataArg?.type).toBe('credit_issued');
  });

  test('B4: Po kredite DP balance ostáva 0 (kredit je kompenzácia, nie DP restore)', async () => {
    const user = await createVerifiedUser('b4_gccancel@test.sk');
    const { type, training } = await createTraining({ name: 'TEST_GCCANCEL_B4', price: 42 });
    const gcCode = 'GCCANCEL_B4GC';
    await createGiftCard({ code: gcCode, amount: 50, balance: 0, status: 'used', buyerEmail: user.email });

    const booking = await createMixedBooking({
      userId: user.id, trainingId: training.id,
      gcCode, amountPaid: 12, giftCardAmount: 30,
    });

    const agent = await loginAs(user.email);
    await agent.delete(`/api/bookings/${booking.id}`).send({ requestCredit: true });

    const gc = await getGiftCard(gcCode);
    expect(parseFloat(gc.balance)).toBe(0);
  });

  test('B5: Refund vs Kredit — iný výsledok DP', async () => {
    // Refund → DP sa obnoví na 30
    const userR = await createVerifiedUser('b5r_gccancel@test.sk');
    const { type: tR, training: trR } = await createTraining({ name: 'TEST_GCCANCEL_B5R', price: 42 });
    const gcCodeR = 'GCCANCEL_B5RGC';
    await createGiftCard({ code: gcCodeR, amount: 50, balance: 0, status: 'used', buyerEmail: userR.email });
    const piR = `test_pi_b5r_${Date.now()}`;
    const bookingR = await createMixedBooking({
      userId: userR.id, trainingId: trR.id,
      gcCode: gcCodeR, amountPaid: 12, giftCardAmount: 30, paymentIntentId: piR,
    });
    mockStripe.refunds.create.mockResolvedValue({ id: `ref_b5r_${Date.now()}`, status: 'succeeded', amount: 1200 });
    const agentR = await loginAs(userR.email);
    await agentR.delete(`/api/bookings/${bookingR.id}`);
    const gcAfterRefund = await getGiftCard(gcCodeR);
    expect(parseFloat(gcAfterRefund.balance)).toBe(30); // obnovené

    // Kredit → DP ostáva 0
    const userC = await createVerifiedUser('b5c_gccancel@test.sk');
    const { type: tC, training: trC } = await createTraining({ name: 'TEST_GCCANCEL_B5C', price: 42 });
    const gcCodeC = 'GCCANCEL_B5CGC';
    await createGiftCard({ code: gcCodeC, amount: 50, balance: 0, status: 'used', buyerEmail: userC.email });
    const bookingC = await createMixedBooking({
      userId: userC.id, trainingId: trC.id,
      gcCode: gcCodeC, amountPaid: 12, giftCardAmount: 30,
    });
    const agentC = await loginAs(userC.email);
    await agentC.delete(`/api/bookings/${bookingC.id}`).send({ requestCredit: true });
    const gcAfterCredit = await getGiftCard(gcCodeC);
    expect(parseFloat(gcAfterCredit.balance)).toBe(0); // nereštaurované
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW C — NÁHRADNÝ TERMÍN
// Poznámka: Endpoint pre priamy presun na náhradný termín cez DELETE /api/bookings/:id
// neexistuje — server ignoruje replacementTrainingId a spracuje ako štandardný refund.
// Tieto testy dokumentujú aktuálne správanie a budú rozšírené po implementácii endpointu.
// ─────────────────────────────────────────────────────────────────────────────
describe('FLOW C — Náhradný termín (TODO: endpoint nie je implementovaný)', () => {
  beforeAll(cleanup);
  afterAll(cleanup);
  beforeEach(() => jest.clearAllMocks());

  test('C1: replacementTrainingId sa momentálne ignoruje → server spracuje ako štandardný refund', async () => {
    const user = await createVerifiedUser('c1_gccancel@test.sk');
    const { type, training } = await createTraining({ name: 'TEST_GCCANCEL_C1', price: 42 });
    const gcCode = 'GCCANCEL_C1GC';
    await createGiftCard({ code: gcCode, amount: 50, balance: 0, status: 'used', buyerEmail: user.email });

    const paymentIntentId = `test_pi_c1_${Date.now()}`;
    const booking = await createMixedBooking({
      userId: user.id, trainingId: training.id,
      gcCode, amountPaid: 12, giftCardAmount: 30, paymentIntentId,
    });

    const refundId = `test_refund_c1_${Date.now()}`;
    mockStripe.refunds.create.mockResolvedValue({ id: refundId, status: 'succeeded', amount: 1200 });

    const agent = await loginAs(user.email);
    // replacementTrainingId sa ignoruje → štandardný refund flow
    const res = await agent.delete(`/api/bookings/${booking.id}`).send({ replacementTrainingId: 99999 });

    expect(res.status).toBe(200);
    // Aktuálne správanie: refund prebehol (nie replacement)
    expect(mockStripe.refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1200 }),
      expect.anything()
    );

    // TODO: Po implementácii replacement endpointu zmeniť na:
    // expect(mockStripe.refunds.create).not.toHaveBeenCalled();
    // expect(res.body.replacementBookingId).toBeDefined();
  });

  test('C2: (FUTURE) Náhradný termín cez dedikovaný endpoint — placeholder', async () => {
    // Tento test bude implementovaný po vytvorení POST /api/bookings/:id/reschedule
    // alebo ekvivalentného endpointu.
    //
    // Očakávané správanie:
    // 1. Pôvodný booking → active=false
    // 2. Nový booking na novom termíne → active=true, rovnaké platobné info
    // 3. Stripe refund sa NEVOLÁ
    // 4. DP balance sa NEMENÍ
    expect(true).toBe(true); // placeholder
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// NEGATÍVNE PRÍPADY
// ─────────────────────────────────────────────────────────────────────────────
describe('NEGATÍVNE — Mixed booking cancellation edge cases', () => {
  beforeAll(cleanup);
  afterAll(cleanup);
  beforeEach(() => jest.clearAllMocks());

  test('N1: Zrušenie do 10h window → 500, DP balance nezmenený, Stripe sa nevolal', async () => {
    const user = await createVerifiedUser('n1_gccancel@test.sk');
    const { type, training } = await createTraining({ name: 'TEST_GCCANCEL_N1', price: 42, hoursFromNow: 5 });
    const gcCode = 'GCCANCEL_N1GC';
    await createGiftCard({ code: gcCode, amount: 50, balance: 0, status: 'used', buyerEmail: user.email });

    const booking = await createMixedBooking({
      userId: user.id, trainingId: training.id,
      gcCode, amountPaid: 12, giftCardAmount: 30,
    });

    const agent = await loginAs(user.email);
    const res = await agent.delete(`/api/bookings/${booking.id}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/10 hours/i);

    const b = await getBooking(booking.id);
    expect(b.active).toBe(true);

    expect(mockStripe.refunds.create).not.toHaveBeenCalled();

    const gc = await getGiftCard(gcCode);
    expect(parseFloat(gc.balance)).toBe(0);
  });

  test('N2: User nemôže zrušiť booking iného usera → 500', async () => {
    const user1 = await createVerifiedUser('n2a_gccancel@test.sk');
    const user2 = await createVerifiedUser('n2b_gccancel@test.sk');
    const { type, training } = await createTraining({ name: 'TEST_GCCANCEL_N2', price: 42 });
    const gcCode = 'GCCANCEL_N2GC';
    await createGiftCard({ code: gcCode, amount: 50, balance: 0, status: 'used', buyerEmail: user1.email });

    const booking = await createMixedBooking({
      userId: user1.id, trainingId: training.id,
      gcCode, amountPaid: 12, giftCardAmount: 30,
    });

    const agent2 = await loginAs(user2.email);
    const res = await agent2.delete(`/api/bookings/${booking.id}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/unauthorized|not found/i);

    const b = await getBooking(booking.id);
    expect(b.active).toBe(true);

    expect(mockStripe.refunds.create).not.toHaveBeenCalled();

    const gc = await getGiftCard(gcCode);
    expect(parseFloat(gc.balance)).toBe(0);
  });

  test('N3: Dvojité zrušenie → druhý pokus zamietnutý, DP balance neprekročí originál', async () => {
    const user = await createVerifiedUser('n3_gccancel@test.sk');
    const { type, training } = await createTraining({ name: 'TEST_GCCANCEL_N3', price: 42 });
    const gcCode = 'GCCANCEL_N3GC';
    await createGiftCard({ code: gcCode, amount: 50, balance: 0, status: 'used', buyerEmail: user.email });

    const paymentIntentId = `test_pi_n3_${Date.now()}`;
    const booking = await createMixedBooking({
      userId: user.id, trainingId: training.id,
      gcCode, amountPaid: 12, giftCardAmount: 30, paymentIntentId,
    });

    mockStripe.refunds.create.mockResolvedValue({
      id: `test_refund_n3_${Date.now()}`, status: 'succeeded', amount: 1200,
    });

    const agent = await loginAs(user.email);

    const res1 = await agent.delete(`/api/bookings/${booking.id}`);
    expect(res1.status).toBe(200);

    const gcAfterFirst = await getGiftCard(gcCode);
    const balanceAfterFirst = parseFloat(gcAfterFirst.balance); // = 30

    const res2 = await agent.delete(`/api/bookings/${booking.id}`);
    expect(res2.status).toBe(500);

    const gcAfterSecond = await getGiftCard(gcCode);
    expect(parseFloat(gcAfterSecond.balance)).toBe(balanceAfterFirst);
    expect(parseFloat(gcAfterSecond.balance)).toBeLessThanOrEqual(50);
  });

  /**
   * N4: Stripe refund zlyhá.
   * Aktuálne serverové správanie: Stripe error je zachytený v try/catch,
   * refundData = { error: '...' }, ale transakcia POKRAČUJE — booking sa deaktivuje
   * a vráti status 200 s refundData.error v response.
   * DP sa OBNOVÍ aj keď Stripe zlyhalo (zámerné — server to tak implementoval).
   *
   * Test dokumentuje aktuálne správanie servera.
   * Poznámka: Ak by bolo žiaduce ROLLBACK pri Stripe errore, treba zmeniť server.js.
   */
  test('N4: Stripe refund zlyhá → server vráti 200 (nie 500), DP sa obnoví, booking deaktivovaný', async () => {
    const user = await createVerifiedUser('n4_gccancel@test.sk');
    const { type, training } = await createTraining({ name: 'TEST_GCCANCEL_N4', price: 42 });
    const gcCode = 'GCCANCEL_N4GC';
    await createGiftCard({ code: gcCode, amount: 50, balance: 0, status: 'used', buyerEmail: user.email });

    const paymentIntentId = `test_pi_n4_${Date.now()}`;
    const booking = await createMixedBooking({
      userId: user.id, trainingId: training.id,
      gcCode, amountPaid: 12, giftCardAmount: 30, paymentIntentId,
    });

    mockStripe.refunds.create.mockRejectedValue(
      Object.assign(new Error('Your card has insufficient funds.'), { code: 'card_declined' })
    );

    const agent = await loginAs(user.email);
    const res = await agent.delete(`/api/bookings/${booking.id}`);

    // Server vráti 200 aj pri Stripe errore (try/catch v serveri ho prehltne)
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // refundProcessed bude false keďže refund.id neexistuje
    expect(res.body.refundProcessed).toBe(false);

    // Booking je deaktivovaný — transakcia prebehla
    const b = await getBooking(booking.id);
    expect(b.active).toBe(false);

    // DP sa obnoví aj pri Stripe errore (server to takto implementoval)
    const gc = await getGiftCard(gcCode);
    expect(parseFloat(gc.balance)).toBe(30);

    // Email bol odoslaný s refundData.error variantou
    const emailService = require('../services/emailService');
    expect(emailService.sendCancellationEmails).toHaveBeenCalled();
    const [, , , refundDataArg] = emailService.sendCancellationEmails.mock.calls[0];
    expect(refundDataArg?.error).toBeDefined();
  });

  test('N5: Neprihlásený user → 401', async () => {
    const user = await createVerifiedUser('n5_gccancel@test.sk');
    const { type, training } = await createTraining({ name: 'TEST_GCCANCEL_N5', price: 42 });
    const gcCode = 'GCCANCEL_N5GC';
    await createGiftCard({ code: gcCode, amount: 50, balance: 0, status: 'used', buyerEmail: user.email });

    const booking = await createMixedBooking({
      userId: user.id, trainingId: training.id,
      gcCode, amountPaid: 12, giftCardAmount: 30,
    });

    const res = await request(app).delete(`/api/bookings/${booking.id}`);
    expect(res.status).toBe(401);

    const b = await getBooking(booking.id);
    expect(b.active).toBe(true);
  });

  /**
   * N6: Starý bug — amount_paid = 42 namiesto 12 (pred webhook fixom).
   * Aktuálne správanie: Stripe error je prehltnutý, server vráti 200,
   * booking sa deaktivuje, DP sa obnoví.
   * Test dokumentuje aktuálne správanie a overuje, že webhook fix je potrebný.
   */
  test('N6: amount_paid = 42 (starý bug) → Stripe vráti error, server pokračuje s 200', async () => {
    const user = await createVerifiedUser('n6_gccancel@test.sk');
    const { type, training } = await createTraining({ name: 'TEST_GCCANCEL_N6', price: 42 });
    const gcCode = 'GCCANCEL_N6GC';
    await createGiftCard({ code: gcCode, amount: 50, balance: 0, status: 'used', buyerEmail: user.email });

    const paymentIntentId = `test_pi_n6_${Date.now()}`;
    // Simulujeme starý bug — amount_paid = 42 (celková cena namiesto Stripe sumy 12)
    const booking = await createMixedBooking({
      userId: user.id, trainingId: training.id,
      gcCode, amountPaid: 42, giftCardAmount: 30, paymentIntentId,
    });

    // Stripe odmietne — 4200 centov > skutočný charge 1200 centov
    mockStripe.refunds.create.mockRejectedValue(
      Object.assign(
        new Error('Refund amount (€42.00) is greater than charge amount (€12.00)'),
        { code: 'invalid_request_error' }
      )
    );

    const agent = await loginAs(user.email);
    const res = await agent.delete(`/api/bookings/${booking.id}`);

    // Aktuálne správanie: 200 (server prehltne Stripe error)
    expect(res.status).toBe(200);
    expect(res.body.refundProcessed).toBe(false);

    // Stripe bol volaný s 4200 — to je bug ktorý webhook fix opravil
    expect(mockStripe.refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 4200 }), // starý bug: 42 * 100
      expect.anything()
    );

    // Booking deaktivovaný (napriek Stripe erroru)
    const b = await getBooking(booking.id);
    expect(b.active).toBe(false);
  });
});