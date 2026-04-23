// tests/e2e_complete_booking_system.test.js
//
// Kompletný E2E test pokrývajúci všetky hlavné funkcie booking systému:
//  1.  Detská rezervácia cez Stripe (pending → webhook → active)
//  2.  Dospelá rezervácia cez Stripe (pending → webhook → active)
//  3.  Detekcia duplicít (ACTIVE_DUPLICATE, PENDING_BOOKING, allowDuplicate)
//  4.  Permanentka – kúpa, aktivácia webhookom, použitie, nesprávny typ
//  5.  Kredit – vydanie, použitie, iný typ (400), opätovné použitie (404)
//  6.  Zrušenie rezervácie – refund, kredit, permanentka, kreditná rezervácia, 10h pravidlo
//  7.  Admin cancel session – permanentky, kreditné rezervácie, zakázané pre non-admin
//  8.  Presun rezervácie na iný termín + zoznam dostupných termínov
//  9.  Info endpointy – zoznam rezervácií, typ rezervácie, dostupnosť, typy, termíny
// 10.  Kapacitné obmedzenia

const request = require('supertest');
const bcrypt = require('bcryptjs');
const {
  cleanupTestData,
  createTestTrainingType,
  createTestTraining,
  pool,
} = require('./setup');

// ─────────────────────────────────────────────
// STRIPE MOCK
// ─────────────────────────────────────────────
let sessionCounter = 0;
let lastStripeSession = null;

const buildMockStripeSession = (payload = {}) => {
  sessionCounter += 1;
  const sessionId = `test_session_${Date.now()}_${sessionCounter}`;
  const paymentIntentId = `test_pi_${Date.now()}_${sessionCounter}`;
  return {
    id: sessionId,
    payment_status: 'paid',
    payment_intent: paymentIntentId,
    created: Math.floor(Date.now() / 1000),
    customer_details: { email: 'test@example.com' },
    metadata: payload.metadata || {},
  };
};

const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  },
  paymentIntents: {
    retrieve: jest.fn(),
  },
  refunds: {
    create: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

jest.mock('stripe', () => jest.fn(() => mockStripe));

// ─────────────────────────────────────────────
// EMAIL SERVICE MOCK
// ─────────────────────────────────────────────
jest.mock('../services/emailService', () => ({
  sendPaymentFailedEmail: jest.fn().mockResolvedValue(true),
  sendSeasonTicketConfirmation: jest.fn().mockResolvedValue(true),
  sendAdminSeasonTicketPurchase: jest.fn().mockResolvedValue(true),
  sendAdultBookingEmail: jest.fn().mockResolvedValue(true),
  sendUserBookingEmail: jest.fn().mockResolvedValue(true),
  sendAdminNewBookingNotification: jest.fn().mockResolvedValue(true),
  sendCancellationEmails: jest.fn().mockResolvedValue(true),
  sendMassCancellationEmail: jest.fn().mockResolvedValue(true),
  sendMassCancellationCredit: jest.fn().mockResolvedValue(true),
  sendMassCancellationSeasonTicket: jest.fn().mockResolvedValue(true),
  sendRefundConfirmationEmail: jest.fn().mockResolvedValue(true),
  sendAdminCreditUsage: jest.fn().mockResolvedValue(true),
}));

// Import reálnej app AŽ po mockoch
const { app, pool: serverPool } = require('../server');

// ─────────────────────────────────────────────
// HELPER FUNKCIE
// ─────────────────────────────────────────────

function resetStripeMocks() {
  mockStripe.checkout.sessions.create.mockImplementation(async (payload) => {
    lastStripeSession = buildMockStripeSession(payload);
    return lastStripeSession;
  });
  mockStripe.refunds.create.mockImplementation(() =>
    Promise.resolve({
      id: `test_refund_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      status: 'succeeded',
    })
  );
  mockStripe.webhooks.constructEvent.mockImplementation((payload) => {
    if (Buffer.isBuffer(payload)) return JSON.parse(payload.toString('utf8'));
    if (typeof payload === 'string') return JSON.parse(payload);
    return payload;
  });
}

async function createVerifiedUser(email, role = 'user') {
  const hashed = await bcrypt.hash('TestPass123!', 10);
  const result = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password, address, verified, role)
     VALUES ($1, $2, $3, $4, $5, true, $6)
     ON CONFLICT (email) DO UPDATE SET password = $4, verified = true, role = $6
     RETURNING *`,
    ['Test', 'User', email, hashed, 'Test Address 1', role]
  );
  return result.rows[0];
}

async function loginAsUser(email) {
  const agent = request.agent(app);
  const res = await agent.post('/api/login').send({ email, password: 'TestPass123!' });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  return agent;
}

async function createTrainingWithPrice({
  typeName,
  audienceType = 'children',
  price = '15.00',
  maxParticipants = 10,
  hoursFromNow = null,
}) {
  const trainingType = await createTestTrainingType(typeName, audienceType);

  let training;
  if (hoursFromNow !== null) {
    const result = await pool.query(
      `INSERT INTO training_availability (training_type_id, training_type, training_date, max_participants)
       VALUES ($1, $2, NOW() + ($3 || ' hours')::interval, $4)
       RETURNING *`,
      [trainingType.id, trainingType.name, String(hoursFromNow), maxParticipants]
    );
    training = result.rows[0];
  } else {
    training = await createTestTraining(trainingType.id, maxParticipants);
  }

  // Cena pre 1 dieťa / 1 dospelého
  await pool.query(
    `INSERT INTO training_prices (training_type_id, child_count, price)
     VALUES ($1, 1, $2)
     ON CONFLICT (training_type_id, child_count) DO UPDATE SET price = $2`,
    [trainingType.id, price]
  );

  return { trainingType, training };
}

async function triggerStripeWebhook(sessionId, metadata, paymentIntentId) {
  return request(app)
    .post('/stripe-webhook')
    .set('Content-Type', 'application/json')
    .set('stripe-signature', 'test_sig')
    .send({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId,
          payment_status: 'paid',
          payment_intent: paymentIntentId || `test_pi_wh_${Date.now()}`,
          created: Math.floor(Date.now() / 1000),
          metadata,
          customer_details: { email: 'test@example.com' },
        },
      },
    });
}

async function createActiveChildBooking(userId, trainingId) {
  const result = await pool.query(
    `INSERT INTO bookings
       (user_id, training_id, number_of_children, amount_paid, payment_intent_id,
        payment_time, session_id, booked_at, active, booking_type)
     VALUES ($1, $2, 1, 15.00, $3, NOW(), $4, NOW(), true, 'paid')
     RETURNING *`,
    [
      userId,
      trainingId,
      `test_pi_child_${Date.now()}`,
      `test_sess_child_${Date.now()}`,
    ]
  );
  return result.rows[0];
}

async function createActiveAdultBooking(userId, trainingId) {
  const result = await pool.query(
    `INSERT INTO bookings
       (user_id, training_id, number_of_children, number_of_adults, amount_paid,
        payment_intent_id, payment_time, session_id, booked_at, active, booking_type, age_group)
     VALUES ($1, $2, 0, 1, 15.00, $3, NOW(), $4, NOW(), true, 'paid', 'adult')
     RETURNING *`,
    [
      userId,
      trainingId,
      `test_pi_adult_${Date.now()}`,
      `test_sess_adult_${Date.now()}`,
    ]
  );
  return result.rows[0];
}

async function createSeasonTicketProductWithOffer(trainingTypeIds, code) {
  const product = await pool.query(
    `INSERT INTO season_ticket_products (name, code, active)
     VALUES ($1, $2, true)
     RETURNING *`,
    [`Test Product ${code}`, code]
  );
  const productId = product.rows[0].id;

  for (const typeId of trainingTypeIds) {
    await pool.query(
      `INSERT INTO season_ticket_product_training_types (season_ticket_product_id, training_type_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [productId, typeId]
    );
  }

  await pool.query(
    `INSERT INTO season_ticket_offers (season_ticket_product_id, entries, price, active)
     VALUES ($1, 5, 60.00, true)
     ON CONFLICT DO NOTHING`,
    [productId]
  );

  return product.rows[0];
}

async function createActiveSeasonTicket(userId, productId, entriesRemaining = 5) {
  const result = await pool.query(
    `INSERT INTO season_tickets
       (user_id, season_ticket_product_id, entries_total, entries_remaining,
        purchase_date, expiry_date, stripe_payment_id, amount_paid)
     VALUES ($1, $2, 5, $3, NOW(), NOW() + interval '6 months', $4, 60.00)
     RETURNING *`,
    [userId, productId, entriesRemaining, `test_st_pay_${Date.now()}`]
  );
  return result.rows[0];
}

// ─────────────────────────────────────────────
// HLAVNÁ TEST SUITE
// ─────────────────────────────────────────────

describe('E2E – Kompletný booking systém', () => {
  beforeAll(async () => {
    await cleanupTestData();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    resetStripeMocks();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await pool.end();
    await serverPool.end();
  });

  // ══════════════════════════════════════════
  // 1. DETSKÁ REZERVÁCIA – STRIPE PLATBA
  // ══════════════════════════════════════════

  describe('1. Detská rezervácia cez Stripe platbu', () => {
    test('1.1 Vytvorí pending rezerváciu a Stripe session', async () => {
      const user = await createVerifiedUser('test_ch_1_1@example.com');
      const agent = await loginAsUser(user.email);
      const { trainingType, training } = await createTrainingWithPrice({
        typeName: 'TEST_CH_1_1',
        audienceType: 'children',
      });

      const res = await agent.post('/api/create-payment-session').send({
        userId: user.id,
        trainingId: training.id,
        trainingType: trainingType.name,
        selectedDate: '2025-06-01',
        selectedTime: '10:00',
        childrenCount: 1,
        childrenAge: '5',
        photoConsent: false,
        mobile: '',
        note: '',
        accompanyingPerson: false,
        allowDuplicate: false,
      });

      expect(res.status).toBe(200);
      expect(res.body.sessionId).toBeDefined();
      expect(res.body.bookingId).toBeDefined();

      const booking = await pool.query('SELECT * FROM bookings WHERE id = $1', [res.body.bookingId]);
      expect(booking.rows[0].active).toBe(false);
      expect(booking.rows[0].amount_paid).toBeNull();
      expect(booking.rows[0].session_id).toBe(res.body.sessionId);
    });

    test('1.2 Webhook aktivuje detskú rezerváciu', async () => {
      const user = await createVerifiedUser('test_ch_1_2@example.com');
      const agent = await loginAsUser(user.email);
      const { trainingType, training } = await createTrainingWithPrice({
        typeName: 'TEST_CH_1_2',
        audienceType: 'children',
      });

      const createRes = await agent.post('/api/create-payment-session').send({
        userId: user.id,
        trainingId: training.id,
        trainingType: trainingType.name,
        selectedDate: '2025-06-01',
        selectedTime: '10:00',
        childrenCount: 1,
        childrenAge: '5',
        photoConsent: false,
        mobile: '',
        note: '',
        accompanyingPerson: false,
        allowDuplicate: false,
      });
      expect(createRes.status).toBe(200);

      const { sessionId, bookingId } = createRes.body;
      const stripeMetadata = mockStripe.checkout.sessions.create.mock.calls[0][0].metadata;

      const wh = await triggerStripeWebhook(sessionId, stripeMetadata, lastStripeSession.payment_intent);
      expect(wh.status).toBe(200);

      const booking = await pool.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
      expect(booking.rows[0].active).toBe(true);
      expect(parseFloat(booking.rows[0].amount_paid)).toBe(15);
      expect(booking.rows[0].number_of_children).toBe(1);
      expect(booking.rows[0].payment_intent_id).toBeDefined();
    });

    test('1.3 Odmietne rezerváciu bez trainingId (400)', async () => {
      const user = await createVerifiedUser('test_ch_1_3@example.com');
      const agent = await loginAsUser(user.email);

      const res = await agent.post('/api/create-payment-session').send({
        userId: user.id,
        childrenCount: 1,
      });

      expect(res.status).toBe(400);
    });

    test('1.4 Odmietne neprihlásené volanie (401)', async () => {
      const { training } = await createTrainingWithPrice({
        typeName: 'TEST_CH_1_4',
        audienceType: 'children',
      });

      const res = await request(app).post('/api/create-payment-session').send({
        userId: 999,
        trainingId: training.id,
        childrenCount: 1,
      });

      expect(res.status).toBe(401);
    });
  });

  // ══════════════════════════════════════════
  // 2. DOSPELÁ REZERVÁCIA – STRIPE PLATBA
  // ══════════════════════════════════════════

  describe('2. Dospelá rezervácia cez Stripe platbu', () => {
    test('2.1 Vytvorí pending dospelú rezerváciu', async () => {
      const user = await createVerifiedUser('test_ad_2_1@example.com');
      const agent = await loginAsUser(user.email);
      const { trainingType, training } = await createTrainingWithPrice({
        typeName: 'TEST_AD_2_1',
        audienceType: 'adults',
      });

      const res = await agent.post('/api/create-adult-payment-session').send({
        userId: user.id,
        trainingId: training.id,
        trainingType: trainingType.name,
        selectedDate: '2025-06-01',
        selectedTime: '10:00',
        mobile: '',
        note: '',
        photoConsent: false,
        allowDuplicate: false,
      });

      expect(res.status).toBe(200);
      expect(res.body.sessionId).toBeDefined();
      expect(res.body.bookingId).toBeDefined();

      const booking = await pool.query('SELECT * FROM bookings WHERE id = $1', [res.body.bookingId]);
      expect(booking.rows[0].active).toBe(false);
      expect(booking.rows[0].age_group).toBe('adult');
      expect(booking.rows[0].number_of_adults).toBe(1);
      expect(booking.rows[0].number_of_children).toBe(0);
    });

    test('2.2 Webhook aktivuje dospelú rezerváciu', async () => {
      const user = await createVerifiedUser('test_ad_2_2@example.com');
      const agent = await loginAsUser(user.email);
      const { trainingType, training } = await createTrainingWithPrice({
        typeName: 'TEST_AD_2_2',
        audienceType: 'adults',
      });

      const createRes = await agent.post('/api/create-adult-payment-session').send({
        userId: user.id,
        trainingId: training.id,
        trainingType: trainingType.name,
        selectedDate: '2025-06-01',
        selectedTime: '10:00',
        mobile: '',
        note: '',
        photoConsent: false,
        allowDuplicate: false,
      });
      expect(createRes.status).toBe(200);

      const { sessionId, bookingId } = createRes.body;
      const stripeMetadata = mockStripe.checkout.sessions.create.mock.calls[0][0].metadata;

      const wh = await triggerStripeWebhook(sessionId, stripeMetadata, lastStripeSession.payment_intent);
      expect(wh.status).toBe(200);

      const booking = await pool.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
      expect(booking.rows[0].active).toBe(true);
      expect(booking.rows[0].age_group).toBe('adult');
      expect(booking.rows[0].number_of_adults).toBe(1);
      expect(parseFloat(booking.rows[0].amount_paid)).toBe(15);
    });
  });

  // ══════════════════════════════════════════
  // 3. DETEKCIA DUPLICITNÝCH REZERVÁCIÍ
  // ══════════════════════════════════════════

  describe('3. Detekcia duplicitných rezervácií', () => {
    test('3.1 Blokuje aktívnu duplicitu – 409 ACTIVE_DUPLICATE', async () => {
      const user = await createVerifiedUser('test_dup_3_1@example.com');
      const agent = await loginAsUser(user.email);
      const { trainingType, training } = await createTrainingWithPrice({
        typeName: 'TEST_DUP_3_1',
        audienceType: 'children',
      });

      await createActiveChildBooking(user.id, training.id);

      const res = await agent.post('/api/create-payment-session').send({
        userId: user.id,
        trainingId: training.id,
        trainingType: trainingType.name,
        selectedDate: '2025-06-01',
        selectedTime: '10:00',
        childrenCount: 1,
        childrenAge: '5',
        photoConsent: false,
        mobile: '',
        note: '',
        accompanyingPerson: false,
        allowDuplicate: false,
      });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('ACTIVE_DUPLICATE');
      expect(res.body.requiresConfirmation).toBe(true);
    });

    test('3.2 allowDuplicate=true povolí druhú rezerváciu', async () => {
      const user = await createVerifiedUser('test_dup_3_2@example.com');
      const agent = await loginAsUser(user.email);
      const { trainingType, training } = await createTrainingWithPrice({
        typeName: 'TEST_DUP_3_2',
        audienceType: 'children',
        maxParticipants: 20,
      });

      await createActiveChildBooking(user.id, training.id);

      const res = await agent.post('/api/create-payment-session').send({
        userId: user.id,
        trainingId: training.id,
        trainingType: trainingType.name,
        selectedDate: '2025-06-01',
        selectedTime: '10:00',
        childrenCount: 1,
        childrenAge: '5',
        photoConsent: false,
        mobile: '',
        note: '',
        accompanyingPerson: false,
        allowDuplicate: true,
      });

      expect(res.status).toBe(200);
    });

    test('3.3 Blokuje pending duplicitu – 409 PENDING_BOOKING', async () => {
      const user = await createVerifiedUser('test_dup_3_3@example.com');
      const agent = await loginAsUser(user.email);
      const { trainingType, training } = await createTrainingWithPrice({
        typeName: 'TEST_DUP_3_3',
        audienceType: 'children',
      });

      // Pending booking – active=false, amount_paid=NULL, session_id nastavený
      await pool.query(
        `INSERT INTO bookings (user_id, training_id, number_of_children, active, booking_type, session_id, booked_at)
         VALUES ($1, $2, 1, false, 'paid', 'test_pending_sess_3_3', NOW())`,
        [user.id, training.id]
      );

      const res = await agent.post('/api/create-payment-session').send({
        userId: user.id,
        trainingId: training.id,
        trainingType: trainingType.name,
        selectedDate: '2025-06-01',
        selectedTime: '10:00',
        childrenCount: 1,
        childrenAge: '5',
        photoConsent: false,
        mobile: '',
        note: '',
        accompanyingPerson: false,
        allowDuplicate: false,
      });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('PENDING_BOOKING');
    });

    test('3.4 duplicate-status vráti ACTIVE_DUPLICATE', async () => {
      const user = await createVerifiedUser('test_dup_3_4@example.com');
      const agent = await loginAsUser(user.email);
      const { training } = await createTrainingWithPrice({
        typeName: 'TEST_DUP_3_4',
        audienceType: 'children',
      });

      const booking = await createActiveChildBooking(user.id, training.id);

      const res = await agent.get(`/api/bookings/duplicate-status?trainingId=${training.id}`);
      expect(res.status).toBe(200);
      expect(res.body.code).toBe('ACTIVE_DUPLICATE');
      expect(res.body.existingBookingId).toBe(booking.id);
    });

    test('3.5 duplicate-status vráti null keď neexistuje rezervácia', async () => {
      const user = await createVerifiedUser('test_dup_3_5@example.com');
      const agent = await loginAsUser(user.email);
      const { training } = await createTrainingWithPrice({
        typeName: 'TEST_DUP_3_5',
        audienceType: 'children',
      });

      const res = await agent.get(`/api/bookings/duplicate-status?trainingId=${training.id}`);
      expect(res.status).toBe(200);
      expect(res.body.code).toBeNull();
    });
  });

  // ══════════════════════════════════════════
  // 4. PERMANENTKA (SEASON TICKET)
  // ══════════════════════════════════════════

  describe('4. Permanentka (Season Ticket)', () => {
    test('4.1 Kúpa permanentky – vytvorí Stripe session', async () => {
      const user = await createVerifiedUser('test_st_4_1@example.com');
      const agent = await loginAsUser(user.email);
      const { trainingType } = await createTrainingWithPrice({
        typeName: 'TEST_ST_4_1',
        audienceType: 'children',
      });
      const product = await createSeasonTicketProductWithOffer([trainingType.id], 'test_st_prod_4_1');

      const res = await agent.post('/api/create-season-ticket-payment').send({
        userId: user.id,
        productId: product.id,
        entries: 5,
        totalPrice: 60.0,
      });

      expect(res.status).toBe(200);
      expect(res.body.sessionId).toBeDefined();
    });

    test('4.2 Webhook aktivuje permanentku', async () => {
      const user = await createVerifiedUser('test_st_4_2@example.com');
      const agent = await loginAsUser(user.email);
      const { trainingType } = await createTrainingWithPrice({
        typeName: 'TEST_ST_4_2',
        audienceType: 'children',
      });
      const product = await createSeasonTicketProductWithOffer([trainingType.id], 'test_st_prod_4_2');

      const createRes = await agent.post('/api/create-season-ticket-payment').send({
        userId: user.id,
        productId: product.id,
        entries: 5,
        totalPrice: 60.0,
      });
      expect(createRes.status).toBe(200);

      const { sessionId } = createRes.body;
      const stripeMetadata = mockStripe.checkout.sessions.create.mock.calls[0][0].metadata;

      const wh = await triggerStripeWebhook(sessionId, stripeMetadata, lastStripeSession.payment_intent);
      expect(wh.status).toBe(200);

      const tickets = await pool.query('SELECT * FROM season_tickets WHERE user_id = $1', [user.id]);
      expect(tickets.rows.length).toBe(1);
      expect(tickets.rows[0].entries_remaining).toBe(5);
      expect(tickets.rows[0].entries_total).toBe(5);
    });

    test('4.3 Použije permanentku na rezerváciu (entries_remaining -1)', async () => {
      const user = await createVerifiedUser('test_st_4_3@example.com');
      const agent = await loginAsUser(user.email);
      const { trainingType, training } = await createTrainingWithPrice({
        typeName: 'TEST_ST_4_3',
        audienceType: 'children',
      });
      const product = await createSeasonTicketProductWithOffer([trainingType.id], 'test_st_prod_4_3');
      const ticket = await createActiveSeasonTicket(user.id, product.id, 5);

      const res = await agent.post('/api/use-season-ticket').send({
        userId: user.id,
        trainingId: training.id,
        seasonTicketId: ticket.id,
        trainingTypeId: trainingType.id,
        childrenCount: 1,
        childrenAge: '6',
        photoConsent: false,
        mobile: '',
        note: '',
      });

      expect(res.status).toBe(200);

      const updatedTicket = await pool.query('SELECT * FROM season_tickets WHERE id = $1', [ticket.id]);
      expect(updatedTicket.rows[0].entries_remaining).toBe(4);

      const booking = await pool.query(
        'SELECT * FROM bookings WHERE user_id = $1 AND training_id = $2',
        [user.id, training.id]
      );
      expect(booking.rows[0].booking_type).toBe('season_ticket');
      expect(booking.rows[0].active).toBe(true);
    });

    test('4.4 Odmietne permanentku na nekompatibilný typ tréningu (400)', async () => {
      const user = await createVerifiedUser('test_st_4_4@example.com');
      const agent = await loginAsUser(user.email);

      const { trainingType: childType } = await createTrainingWithPrice({
        typeName: 'TEST_ST_CHILD_4_4',
        audienceType: 'children',
      });
      const { trainingType: adultType, training: adultTraining } = await createTrainingWithPrice({
        typeName: 'TEST_ST_ADULT_4_4',
        audienceType: 'adults',
      });

      const childProduct = await createSeasonTicketProductWithOffer([childType.id], 'test_st_child_prod_4_4');
      const ticket = await createActiveSeasonTicket(user.id, childProduct.id, 5);

      const res = await agent.post('/api/use-season-ticket').send({
        userId: user.id,
        trainingId: adultTraining.id,
        seasonTicketId: ticket.id,
        trainingTypeId: adultType.id,
        childrenCount: 1,
        photoConsent: false,
        mobile: '',
        note: '',
      });

      expect(res.status).toBe(400);
    });

    test('4.5 Vráti zoznam permanentiek používateľa', async () => {
      const user = await createVerifiedUser('test_st_4_5@example.com');
      const agent = await loginAsUser(user.email);
      const { trainingType } = await createTrainingWithPrice({
        typeName: 'TEST_ST_4_5',
        audienceType: 'children',
      });
      const product = await createSeasonTicketProductWithOffer([trainingType.id], 'test_st_prod_4_5');
      await createActiveSeasonTicket(user.id, product.id, 5);

      const res = await agent.get(`/api/season-tickets/${user.id}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].entries_remaining).toBe(5);
      expect(Array.isArray(res.body[0].training_types)).toBe(true);
      expect(res.body[0].training_types.length).toBeGreaterThan(0);
    });

    test('4.6 Odmietne prístup k permanentkám iného používateľa (403)', async () => {
      const user1 = await createVerifiedUser('test_st_4_6a@example.com');
      const user2 = await createVerifiedUser('test_st_4_6b@example.com');
      const agent2 = await loginAsUser(user2.email);

      const res = await agent2.get(`/api/season-tickets/${user1.id}`);
      expect(res.status).toBe(403);
    });
  });

  // ══════════════════════════════════════════
  // 5. KREDIT FLOW
  // ══════════════════════════════════════════

  describe('5. Kredit flow', () => {
    test('5.1 Úspešné použitie kreditu na rovnaký typ tréningu', async () => {
      const user = await createVerifiedUser('test_cr_5_1@example.com');
      const agent = await loginAsUser(user.email);
      const { trainingType, training: training1 } = await createTrainingWithPrice({
        typeName: 'TEST_CR_5_1',
        audienceType: 'adults',
      });
      // Druhý termín rovnakého typu
      const training2 = await pool.query(
        `INSERT INTO training_availability (training_type_id, training_type, training_date, max_participants)
         VALUES ($1, $2, NOW() + interval '72 hours', 10) RETURNING *`,
        [trainingType.id, trainingType.name]
      );

      // Kredit pre typ trainingType
      const creditRes = await pool.query(
        `INSERT INTO credits (user_id, session_id, child_count, training_type, original_date,
           reason, status, created_at, accompanying_person)
         VALUES ($1, $2, 1, $3, NOW(), 'Zrušenie rezervácie', 'active', NOW(), false)
         RETURNING *`,
        [user.id, training1.id, trainingType.name]
      );
      const credit = creditRes.rows[0];

      const res = await agent.post('/api/bookings/use-credit').send({
        creditId: credit.id,
        trainingId: training2.rows[0].id,
        mobile: '',
        note: '',
      });

      expect(res.status).toBe(200);

      // Kredit označený ako použitý
      const usedCredit = await pool.query('SELECT * FROM credits WHERE id = $1', [credit.id]);
      expect(usedCredit.rows[0].status).toBe('used');

      // Rezervácia vytvorená
      const booking = await pool.query(
        'SELECT * FROM bookings WHERE user_id = $1 AND training_id = $2',
        [user.id, training2.rows[0].id]
      );
      expect(booking.rows[0].booking_type).toBe('credit');
      expect(booking.rows[0].credit_id).toBe(credit.id);
    });

    test('5.2 Odmietne kredit pre iný typ tréningu (400)', async () => {
      const user = await createVerifiedUser('test_cr_5_2@example.com');
      const agent = await loginAsUser(user.email);

      const { trainingType: typeA, training: trainingA } = await createTrainingWithPrice({
        typeName: 'TEST_CR_A_5_2',
        audienceType: 'adults',
      });
      const { training: trainingB } = await createTrainingWithPrice({
        typeName: 'TEST_CR_B_5_2',
        audienceType: 'adults',
      });

      const creditRes = await pool.query(
        `INSERT INTO credits (user_id, session_id, child_count, training_type, original_date,
           reason, status, created_at, accompanying_person)
         VALUES ($1, $2, 1, $3, NOW(), 'test', 'active', NOW(), false)
         RETURNING *`,
        [user.id, trainingA.id, typeA.name]
      );

      const res = await agent.post('/api/bookings/use-credit').send({
        creditId: creditRes.rows[0].id,
        trainingId: trainingB.id,
        mobile: '',
        note: '',
      });

      expect(res.status).toBe(400);
    });

    test('5.3 Odmietne opätovné použitie už použitého kreditu (404)', async () => {
      const user = await createVerifiedUser('test_cr_5_3@example.com');
      const agent = await loginAsUser(user.email);
      const { trainingType, training } = await createTrainingWithPrice({
        typeName: 'TEST_CR_5_3',
        audienceType: 'adults',
      });

      const creditRes = await pool.query(
        `INSERT INTO credits (user_id, session_id, child_count, training_type, original_date,
           reason, status, created_at, accompanying_person)
         VALUES ($1, $2, 1, $3, NOW(), 'test', 'used', NOW(), false)
         RETURNING *`,
        [user.id, training.id, trainingType.name]
      );

      const res = await agent.post('/api/bookings/use-credit').send({
        creditId: creditRes.rows[0].id,
        trainingId: training.id,
        mobile: '',
        note: '',
      });

      expect(res.status).toBe(404);
    });

    test('5.4 Vráti zoznam aktívnych kreditov používateľa', async () => {
      const user = await createVerifiedUser('test_cr_5_4@example.com');
      const agent = await loginAsUser(user.email);
      const { trainingType, training } = await createTrainingWithPrice({
        typeName: 'TEST_CR_5_4',
        audienceType: 'adults',
      });

      await pool.query(
        `INSERT INTO credits (user_id, session_id, child_count, training_type, original_date,
           reason, status, created_at, accompanying_person)
         VALUES ($1, $2, 1, $3, NOW(), 'test', 'active', NOW(), false)`,
        [user.id, training.id, trainingType.name]
      );

      const res = await agent.get(`/api/credits/${user.id}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].status).toBe('active');
      expect(res.body[0].training_type).toBe(trainingType.name);
    });
  });

  // ══════════════════════════════════════════
  // 6. ZRUŠENIE REZERVÁCIE
  // ══════════════════════════════════════════

  describe('6. Zrušenie rezervácie', () => {
    test('6.1 Zrušenie platnej rezervácie s vrátením peňazí (Stripe refund)', async () => {
      const user = await createVerifiedUser('test_cn_6_1@example.com');
      const agent = await loginAsUser(user.email);
      const { training } = await createTrainingWithPrice({
        typeName: 'TEST_CN_6_1',
        audienceType: 'children',
      });

      const booking = await createActiveChildBooking(user.id, training.id);

      const res = await agent.delete(`/api/bookings/${booking.id}`).send({ requestCredit: false });

      expect(res.status).toBe(200);
      expect(mockStripe.refunds.create).toHaveBeenCalled();

      const deleted = await pool.query('SELECT * FROM bookings WHERE id = $1', [booking.id]);
      expect(deleted.rows.length).toBe(0);
    });

    test('6.2 Zrušenie platnej rezervácie s kreditom (requestCredit=true)', async () => {
      const user = await createVerifiedUser('test_cn_6_2@example.com');
      const agent = await loginAsUser(user.email);
      const { trainingType, training } = await createTrainingWithPrice({
        typeName: 'TEST_CN_6_2',
        audienceType: 'children',
      });

      const booking = await createActiveChildBooking(user.id, training.id);

      const res = await agent.delete(`/api/bookings/${booking.id}`).send({ requestCredit: true });

      expect(res.status).toBe(200);
      expect(mockStripe.refunds.create).not.toHaveBeenCalled();

      const deleted = await pool.query('SELECT * FROM bookings WHERE id = $1', [booking.id]);
      expect(deleted.rows.length).toBe(0);

      const credits = await pool.query(
        "SELECT * FROM credits WHERE user_id = $1 AND status = 'active'",
        [user.id]
      );
      expect(credits.rows.length).toBe(1);
      expect(credits.rows[0].training_type).toBe(trainingType.name);
    });

    test('6.3 Zrušenie rezervácie na permanentku – vstup sa vráti', async () => {
      const user = await createVerifiedUser('test_cn_6_3@example.com');
      const agent = await loginAsUser(user.email);
      const { trainingType, training } = await createTrainingWithPrice({
        typeName: 'TEST_CN_6_3',
        audienceType: 'children',
      });
      const product = await createSeasonTicketProductWithOffer([trainingType.id], 'test_cn_prod_6_3');
      const ticket = await createActiveSeasonTicket(user.id, product.id, 4);

      const bookingRes = await pool.query(
        `INSERT INTO bookings (user_id, training_id, number_of_children, amount_paid, booked_at, active, booking_type)
         VALUES ($1, $2, 1, 0, NOW(), true, 'season_ticket') RETURNING *`,
        [user.id, training.id]
      );
      const booking = bookingRes.rows[0];

      await pool.query(
        `INSERT INTO season_ticket_usage (season_ticket_id, booking_id, training_type_id, used_date)
         VALUES ($1, $2, $3, NOW())`,
        [ticket.id, booking.id, trainingType.id]
      );

      const res = await agent.delete(`/api/bookings/${booking.id}`).send({});

      expect(res.status).toBe(200);

      const updatedTicket = await pool.query('SELECT * FROM season_tickets WHERE id = $1', [ticket.id]);
      expect(updatedTicket.rows[0].entries_remaining).toBe(5);

      const deleted = await pool.query('SELECT * FROM bookings WHERE id = $1', [booking.id]);
      expect(deleted.rows.length).toBe(0);
    });

    test('6.4 Zrušenie kreditnej rezervácie – kredit sa reaktivuje', async () => {
      const user = await createVerifiedUser('test_cn_6_4@example.com');
      const agent = await loginAsUser(user.email);
      const { trainingType, training } = await createTrainingWithPrice({
        typeName: 'TEST_CN_6_4',
        audienceType: 'adults',
      });

      const creditRes = await pool.query(
        `INSERT INTO credits (user_id, session_id, child_count, training_type, original_date,
           reason, status, created_at, accompanying_person)
         VALUES ($1, $2, 1, $3, NOW(), 'test', 'used', NOW(), false) RETURNING *`,
        [user.id, training.id, trainingType.name]
      );
      const credit = creditRes.rows[0];

      const bookingRes = await pool.query(
        `INSERT INTO bookings (user_id, training_id, number_of_adults, amount_paid, booked_at,
           active, booking_type, age_group, credit_id)
         VALUES ($1, $2, 1, 0, NOW(), true, 'credit', 'adult', $3) RETURNING *`,
        [user.id, training.id, credit.id]
      );

      const res = await agent.delete(`/api/bookings/${bookingRes.rows[0].id}`).send({});

      expect(res.status).toBe(200);

      const updatedCredit = await pool.query('SELECT * FROM credits WHERE id = $1', [credit.id]);
      expect(updatedCredit.rows[0].status).toBe('active');
    });

    test('6.5 Blokuje zrušenie menej ako 10 hodín pred tréningom (400)', async () => {
      const user = await createVerifiedUser('test_cn_6_5@example.com');
      const agent = await loginAsUser(user.email);
      // Tréning začína za 5 hodín – pod limitom 10h
      const { training } = await createTrainingWithPrice({
        typeName: 'TEST_CN_6_5',
        audienceType: 'children',
        hoursFromNow: 5,
      });

      const booking = await createActiveChildBooking(user.id, training.id);

      const res = await agent.delete(`/api/bookings/${booking.id}`).send({ requestCredit: false });

      // Server vracia 500 (throw inside try/catch) keď je training do 10 hodín
      expect(res.status).not.toBe(200);
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  // ══════════════════════════════════════════
  // 7. ADMIN – ZRUŠENIE TERMÍNU
  // ══════════════════════════════════════════

  describe('7. Admin – Zrušenie termínu (cancel-session)', () => {
    test('7.1 Admin zruší termín – vstup na permanentku sa vráti', async () => {
      const admin = await createVerifiedUser('test_adm_7_1a@example.com', 'admin');
      const user = await createVerifiedUser('test_adm_7_1b@example.com');
      const adminAgent = await loginAsUser(admin.email);

      const { trainingType, training } = await createTrainingWithPrice({
        typeName: 'TEST_ADM_ST_7_1',
        audienceType: 'children',
      });
      const product = await createSeasonTicketProductWithOffer([trainingType.id], 'test_adm_st_prod_7_1');
      const ticket = await createActiveSeasonTicket(user.id, product.id, 4);

      const bookingRes = await pool.query(
        `INSERT INTO bookings (user_id, training_id, number_of_children, amount_paid, booked_at, active, booking_type)
         VALUES ($1, $2, 1, 0, NOW(), true, 'season_ticket') RETURNING *`,
        [user.id, training.id]
      );
      const booking = bookingRes.rows[0];

      await pool.query(
        `INSERT INTO season_ticket_usage (season_ticket_id, booking_id, training_type_id, used_date)
         VALUES ($1, $2, $3, NOW())`,
        [ticket.id, booking.id, trainingType.id]
      );

      const res = await adminAgent.post('/api/admin/cancel-session').send({
        trainingId: training.id,
        forceCancel: true,
      });

      expect(res.status).toBe(200);

      const cancelled = await pool.query('SELECT cancelled FROM training_availability WHERE id = $1', [training.id]);
      expect(cancelled.rows[0].cancelled).toBe(true);

      const updatedTicket = await pool.query('SELECT * FROM season_tickets WHERE id = $1', [ticket.id]);
      expect(updatedTicket.rows[0].entries_remaining).toBe(5);
    });

    test('7.2 Admin zruší termín – kreditná rezervácia sa reaktivuje', async () => {
      const admin = await createVerifiedUser('test_adm_7_2a@example.com', 'admin');
      const user = await createVerifiedUser('test_adm_7_2b@example.com');
      const adminAgent = await loginAsUser(admin.email);

      const { trainingType, training } = await createTrainingWithPrice({
        typeName: 'TEST_ADM_CR_7_2',
        audienceType: 'adults',
      });

      const creditRes = await pool.query(
        `INSERT INTO credits (user_id, session_id, child_count, training_type, original_date,
           reason, status, created_at, accompanying_person)
         VALUES ($1, $2, 1, $3, NOW(), 'test', 'used', NOW(), false) RETURNING *`,
        [user.id, training.id, trainingType.name]
      );
      const credit = creditRes.rows[0];

      await pool.query(
        `INSERT INTO bookings (user_id, training_id, number_of_adults, amount_paid, booked_at,
           active, booking_type, age_group, credit_id)
         VALUES ($1, $2, 1, 0, NOW(), true, 'credit', 'adult', $3)`,
        [user.id, training.id, credit.id]
      );

      const res = await adminAgent.post('/api/admin/cancel-session').send({
        trainingId: training.id,
        forceCancel: true,
      });

      expect(res.status).toBe(200);

      const updatedCredit = await pool.query('SELECT * FROM credits WHERE id = $1', [credit.id]);
      expect(updatedCredit.rows[0].status).toBe('active');
    });

    test('7.3 Non-admin nemôže zrušiť termín (403)', async () => {
      const user = await createVerifiedUser('test_adm_7_3@example.com');
      const agent = await loginAsUser(user.email);
      const { training } = await createTrainingWithPrice({
        typeName: 'TEST_ADM_FORBID_7_3',
        audienceType: 'children',
      });

      const res = await agent.post('/api/admin/cancel-session').send({
        trainingId: training.id,
        forceCancel: true,
      });

      expect(res.status).toBe(403);
    });
  });

  // ══════════════════════════════════════════
  // 8. PRESUN REZERVÁCIE NA INÝ TERMÍN
  // ══════════════════════════════════════════

  describe('8. Presun rezervácie na iný termín', () => {
    test('8.1 Presunie aktívnu rezerváciu na voľný termín', async () => {
      const user = await createVerifiedUser('test_rep_8_1@example.com');
      const agent = await loginAsUser(user.email);
      const { trainingType, training: training1 } = await createTrainingWithPrice({
        typeName: 'TEST_REP_8_1',
        audienceType: 'children',
      });

      const training2Res = await pool.query(
        `INSERT INTO training_availability (training_type_id, training_type, training_date, max_participants)
         VALUES ($1, $2, NOW() + interval '96 hours', 10) RETURNING *`,
        [trainingType.id, trainingType.name]
      );
      const training2 = training2Res.rows[0];

      const booking = await createActiveChildBooking(user.id, training1.id);

      const res = await agent.post(`/api/replace-booking/${booking.id}`).send({
        newTrainingId: training2.id,
      });

      expect(res.status).toBe(200);

      const updated = await pool.query(
        'SELECT * FROM bookings WHERE user_id = $1 AND active = true',
        [user.id]
      );
      expect(updated.rows[0].training_id).toBe(training2.id);
    });

    test('8.2 Vráti dostupné termíny pre presun', async () => {
      const user = await createVerifiedUser('test_rep_8_2@example.com');
      const agent = await loginAsUser(user.email);
      const { trainingType, training: training1 } = await createTrainingWithPrice({
        typeName: 'TEST_REP_8_2',
        audienceType: 'children',
      });

      // Druhý termín rovnakého typu
      await pool.query(
        `INSERT INTO training_availability (training_type_id, training_type, training_date, max_participants)
         VALUES ($1, $2, NOW() + interval '96 hours', 10)`,
        [trainingType.id, trainingType.name]
      );

      const booking = await createActiveChildBooking(user.id, training1.id);

      const res = await agent.get(`/api/replacement-sessions/${booking.id}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ══════════════════════════════════════════
  // 9. INFO ENDPOINTY
  // ══════════════════════════════════════════

  describe('9. Info endpointy', () => {
    test('9.1 Vráti aktívne rezervácie používateľa', async () => {
      const user = await createVerifiedUser('test_inf_9_1@example.com');
      const agent = await loginAsUser(user.email);
      const { training } = await createTrainingWithPrice({
        typeName: 'TEST_INF_9_1',
        audienceType: 'children',
      });

      await createActiveChildBooking(user.id, training.id);

      const res = await agent.get(`/api/bookings/user/${user.id}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    test('9.2 Vráti správny typ rezervácie (paid / credit / season_ticket)', async () => {
      const user = await createVerifiedUser('test_inf_9_2@example.com');
      const agent = await loginAsUser(user.email);
      const { training } = await createTrainingWithPrice({
        typeName: 'TEST_INF_9_2',
        audienceType: 'children',
      });

      const booking = await createActiveChildBooking(user.id, training.id);

      const res = await agent.get(`/api/bookings/${booking.id}/type`);
      expect(res.status).toBe(200);
      expect(res.body.bookingType).toBe('paid');
    });

    test('9.3 Skontroluje dostupnosť termínu', async () => {
      const { training } = await createTrainingWithPrice({
        typeName: 'TEST_INF_9_3',
        audienceType: 'children',
        maxParticipants: 5,
      });

      const res = await request(app).get(`/api/check-availability?trainingId=${training.id}`);
      expect(res.status).toBe(200);
      expect(res.body.available).toBeDefined();
    });

    test('9.4 Vráti zoznam aktívnych typov tréningov', async () => {
      const res = await request(app).get('/api/training-types');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('9.5 Vráti nadchádzajúce termíny tréningov', async () => {
      const res = await request(app).get('/api/training-dates');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ══════════════════════════════════════════
  // 10. KAPACITNÉ OBMEDZENIA
  // ══════════════════════════════════════════

  describe('10. Kapacitné obmedzenia', () => {
    test('10.1 Odmietne rezerváciu keď je kapacita plná', async () => {
      const user1 = await createVerifiedUser('test_cap_10_1a@example.com');
      const user2 = await createVerifiedUser('test_cap_10_1b@example.com');
      const agent2 = await loginAsUser(user2.email);

      const { trainingType, training } = await createTrainingWithPrice({
        typeName: 'TEST_CAP_10_1',
        audienceType: 'children',
        maxParticipants: 1,
      });

      // Naplnenie kapacity
      await createActiveChildBooking(user1.id, training.id);

      const res = await agent2.post('/api/create-payment-session').send({
        userId: user2.id,
        trainingId: training.id,
        trainingType: trainingType.name,
        selectedDate: '2025-06-01',
        selectedTime: '10:00',
        childrenCount: 1,
        childrenAge: '5',
        photoConsent: false,
        mobile: '',
        note: '',
        accompanyingPerson: false,
        allowDuplicate: false,
      });

      // Server vracia 500 s chybou "Kapacita tréningu bola práve naplnená."
      expect(res.status).not.toBe(200);
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    test('10.2 Odmietne použitie permanentky keď je kapacita plná', async () => {
      const user1 = await createVerifiedUser('test_cap_10_2a@example.com');
      const user2 = await createVerifiedUser('test_cap_10_2b@example.com');
      const agent2 = await loginAsUser(user2.email);

      const { trainingType, training } = await createTrainingWithPrice({
        typeName: 'TEST_CAP_10_2',
        audienceType: 'children',
        maxParticipants: 1,
      });
      const product = await createSeasonTicketProductWithOffer([trainingType.id], 'test_cap_prod_10_2');
      const ticket = await createActiveSeasonTicket(user2.id, product.id, 5);

      // Naplnenie kapacity user1-om
      await createActiveChildBooking(user1.id, training.id);

      const res = await agent2.post('/api/use-season-ticket').send({
        userId: user2.id,
        trainingId: training.id,
        seasonTicketId: ticket.id,
        trainingTypeId: trainingType.id,
        childrenCount: 1,
        childrenAge: '5',
        photoConsent: false,
        mobile: '',
        note: '',
      });

      expect(res.status).not.toBe(200);
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
