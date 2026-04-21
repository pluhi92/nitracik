const request = require('supertest');
const bcrypt = require('bcryptjs');
const {
  cleanupTestData,
  createTestTrainingType,
  createTestTraining,
  pool,
} = require('./setup');

let sessionCounter = 0;

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
      create: jest.fn().mockImplementation(async (payload) => buildMockStripeSession(payload)),
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
    constructEvent: jest.fn().mockImplementation((payload) => {
      if (Buffer.isBuffer(payload)) {
        return JSON.parse(payload.toString('utf8'));
      }
      if (typeof payload === 'string') {
        return JSON.parse(payload);
      }
      return payload;
    }),
  },
};

jest.mock('stripe', () => jest.fn(() => mockStripe));

jest.mock('../services/emailService', () => ({
  sendPaymentFailedEmail: jest.fn().mockResolvedValue(true),
  sendSeasonTicketConfirmation: jest.fn().mockResolvedValue(true),
  sendAdminSeasonTicketPurchase: jest.fn().mockResolvedValue(true),
  sendAdultBookingEmail: jest.fn().mockResolvedValue(true),
  sendUserBookingEmail: jest.fn().mockResolvedValue(true),
  sendAdminNewBookingNotification: jest.fn().mockResolvedValue(true),
}));

const { app, pool: serverPool } = require('../server');

async function createVerifiedUser(email) {
  const hashedPassword = await bcrypt.hash('TestPass123', 10);
  const result = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password, address, verified, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (email) DO UPDATE SET password = $4, verified = $6
     RETURNING *`,
    ['Test', 'Booking', email, hashedPassword, 'Test address 123', true, 'user']
  );
  return result.rows[0];
}

async function loginAsUser(email) {
  const agent = request.agent(app);
  const response = await agent.post('/api/login').send({
    email,
    password: 'TestPass123',
  });

  if (response.status !== 200) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(response.body)}`);
  }

  return agent;
}

async function createTrainingWithPrice({ trainingTypeName, audienceType, price }) {
  const trainingType = await createTestTrainingType(trainingTypeName, audienceType);
  const training = await createTestTraining(trainingType.id, 12);

  await pool.query(
    `INSERT INTO training_prices (training_type_id, child_count, price)
     VALUES ($1, $2, $3)
     ON CONFLICT (training_type_id, child_count) DO UPDATE SET price = $3`,
    [trainingType.id, 1, price]
  );

  return { trainingType, training };
}

async function completeCheckoutWebhook({ sessionId, metadata, paymentIntentId }) {
  const response = await request(app)
    .post('/stripe-webhook')
    .set('Content-Type', 'application/json')
    .set('stripe-signature', 'test_signature')
    .send({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId,
          payment_status: 'paid',
          payment_intent: paymentIntentId || `test_pi_complete_${Date.now()}`,
          created: Math.floor(Date.now() / 1000),
          metadata,
          customer_details: { email: 'test@example.com' },
        },
      },
    });

  expect(response.status).toBe(200);
}

async function getBookingById(bookingId) {
  const result = await pool.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
  return result.rows[0];
}

describe('E2E - Booking platby z Booking/Aktivity stránky + duplikáty', () => {
  beforeAll(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await pool.end();
    await serverPool.end();
  });

  test('1. normálna rezervácia pre detský tréning s platbou z Booking page', async () => {
    const user = await createVerifiedUser('test_child_booking_page@example.com');
    const agent = await loginAsUser(user.email);
    const { trainingType, training } = await createTrainingWithPrice({
      trainingTypeName: 'TEST_CHILD_BOOKING_PAGE',
      audienceType: 'children',
      price: 13.5,
    });

    const createResponse = await agent.post('/api/create-payment-session').send({
      userId: user.id,
      trainingId: training.id,
      trainingType: trainingType.name,
      selectedDate: '2026-05-01',
      selectedTime: '16:30',
      childrenCount: 1,
      childrenAge: '8',
      photoConsent: true,
      mobile: '+421900000001',
      note: 'booking-page-child',
      accompanyingPerson: false,
    });

    expect(createResponse.status).toBe(200);
    expect(createResponse.body.bookingId).toBeDefined();

    const pendingBooking = await getBookingById(createResponse.body.bookingId);
    expect(pendingBooking.active).toBe(false);
    expect(pendingBooking.number_of_children).toBe(1);
    expect(pendingBooking.session_id).toBeTruthy();

    await completeCheckoutWebhook({
      sessionId: pendingBooking.session_id,
      metadata: {
        type: 'training_session',
        userId: String(user.id),
        trainingId: String(training.id),
        trainingType: trainingType.name,
        selectedDate: '2026-05-01',
        selectedTime: '16:30',
        childrenCount: '1',
        childrenAge: '8',
        totalPrice: '13.5',
        photoConsent: 'true',
        mobile: '+421900000001',
        note: 'booking-page-child',
        accompanyingPerson: 'false',
      },
    });

    const paidBooking = await getBookingById(createResponse.body.bookingId);
    expect(paidBooking.active).toBe(true);
    expect(parseFloat(paidBooking.amount_paid)).toBe(13.5);
    expect(paidBooking.payment_intent_id).toBeTruthy();
  });

  test('2. normálna rezervácia pre dospelácky tréning s platbou z Booking page', async () => {
    const user = await createVerifiedUser('test_adult_booking_page@example.com');
    const agent = await loginAsUser(user.email);
    const { trainingType, training } = await createTrainingWithPrice({
      trainingTypeName: 'TEST_ADULT_BOOKING_PAGE',
      audienceType: 'adults',
      price: 17,
    });

    const createResponse = await agent.post('/api/create-adult-payment-session').send({
      userId: user.id,
      trainingId: training.id,
      trainingType: trainingType.name,
      selectedDate: '2026-05-02',
      selectedTime: '18:00',
      mobile: '+421900000002',
      note: 'booking-page-adult',
    });

    expect(createResponse.status).toBe(200);

    const pendingBooking = await getBookingById(createResponse.body.bookingId);
    expect(pendingBooking.active).toBe(false);
    expect(pendingBooking.number_of_adults).toBe(1);
    expect(pendingBooking.age_group).toBe('adult');

    await completeCheckoutWebhook({
      sessionId: pendingBooking.session_id,
      metadata: {
        type: 'adult_training_session',
        userId: String(user.id),
        trainingId: String(training.id),
        trainingType: trainingType.name,
        selectedDate: '2026-05-02',
        selectedTime: '18:00',
        totalPrice: '17',
        mobile: '+421900000002',
        note: 'booking-page-adult',
      },
    });

    const paidBooking = await getBookingById(createResponse.body.bookingId);
    expect(paidBooking.active).toBe(true);
    expect(parseFloat(paidBooking.amount_paid)).toBe(17);
    expect(paidBooking.payment_intent_id).toBeTruthy();
  });

  test('3. presmerovaný booking z Aktivity page s platbou pre detský tréning', async () => {
    const user = await createVerifiedUser('test_child_activity_page@example.com');
    const agent = await loginAsUser(user.email);
    const { trainingType, training } = await createTrainingWithPrice({
      trainingTypeName: 'TEST_CHILD_ACTIVITY_PAGE',
      audienceType: 'children',
      price: 14,
    });

    const createResponse = await agent.post('/api/create-payment-session').send({
      userId: user.id,
      trainingId: training.id,
      trainingType: trainingType.name,
      selectedDate: '2026-05-03',
      selectedTime: '17:00',
      childrenCount: 1,
      childrenAge: '7',
      photoConsent: true,
      mobile: '+421900000003',
      note: 'redirected-from-activity-child',
      accompanyingPerson: false,
    });

    expect(createResponse.status).toBe(200);

    const pendingBooking = await getBookingById(createResponse.body.bookingId);

    await completeCheckoutWebhook({
      sessionId: pendingBooking.session_id,
      metadata: {
        type: 'training_session',
        userId: String(user.id),
        trainingId: String(training.id),
        trainingType: trainingType.name,
        selectedDate: '2026-05-03',
        selectedTime: '17:00',
        childrenCount: '1',
        childrenAge: '7',
        totalPrice: '14',
        photoConsent: 'true',
        mobile: '+421900000003',
        note: 'redirected-from-activity-child',
        accompanyingPerson: 'false',
      },
    });

    const paidBooking = await getBookingById(createResponse.body.bookingId);
    expect(paidBooking.active).toBe(true);
    expect(parseFloat(paidBooking.amount_paid)).toBe(14);
  });

  test('4. presmerovaný booking z Aktivity page s platbou pre dospelácky tréning', async () => {
    const user = await createVerifiedUser('test_adult_activity_page@example.com');
    const agent = await loginAsUser(user.email);
    const { trainingType, training } = await createTrainingWithPrice({
      trainingTypeName: 'TEST_ADULT_ACTIVITY_PAGE',
      audienceType: 'adults',
      price: 18,
    });

    const createResponse = await agent.post('/api/create-adult-payment-session').send({
      userId: user.id,
      trainingId: training.id,
      trainingType: trainingType.name,
      selectedDate: '2026-05-04',
      selectedTime: '19:00',
      mobile: '+421900000004',
      note: 'redirected-from-activity-adult',
    });

    expect(createResponse.status).toBe(200);

    const pendingBooking = await getBookingById(createResponse.body.bookingId);

    await completeCheckoutWebhook({
      sessionId: pendingBooking.session_id,
      metadata: {
        type: 'adult_training_session',
        userId: String(user.id),
        trainingId: String(training.id),
        trainingType: trainingType.name,
        selectedDate: '2026-05-04',
        selectedTime: '19:00',
        totalPrice: '18',
        mobile: '+421900000004',
        note: 'redirected-from-activity-adult',
      },
    });

    const paidBooking = await getBookingById(createResponse.body.bookingId);
    expect(paidBooking.active).toBe(true);
    expect(parseFloat(paidBooking.amount_paid)).toBe(18);
  });

  test('5. duplikovaný booking (2x na ten istý session) s platbou na detský tréning', async () => {
    const user = await createVerifiedUser('test_child_duplicate@example.com');
    const agent = await loginAsUser(user.email);
    const { trainingType, training } = await createTrainingWithPrice({
      trainingTypeName: 'TEST_CHILD_DUPLICATE',
      audienceType: 'children',
      price: 15,
    });

    const first = await agent.post('/api/create-payment-session').send({
      userId: user.id,
      trainingId: training.id,
      trainingType: trainingType.name,
      selectedDate: '2026-05-05',
      selectedTime: '16:00',
      childrenCount: 1,
      childrenAge: '9',
      photoConsent: true,
      mobile: '+421900000005',
      note: 'duplicate-child-1',
      accompanyingPerson: false,
    });
    expect(first.status).toBe(200);

    const firstBooking = await getBookingById(first.body.bookingId);
    await completeCheckoutWebhook({
      sessionId: firstBooking.session_id,
      metadata: {
        type: 'training_session',
        userId: String(user.id),
        trainingId: String(training.id),
        trainingType: trainingType.name,
        selectedDate: '2026-05-05',
        selectedTime: '16:00',
        childrenCount: '1',
        childrenAge: '9',
        totalPrice: '15',
        photoConsent: 'true',
        mobile: '+421900000005',
        note: 'duplicate-child-1',
        accompanyingPerson: 'false',
      },
    });

    const second = await agent.post('/api/create-payment-session').send({
      userId: user.id,
      trainingId: training.id,
      trainingType: trainingType.name,
      selectedDate: '2026-05-05',
      selectedTime: '16:00',
      childrenCount: 1,
      childrenAge: '9',
      photoConsent: true,
      mobile: '+421900000005',
      note: 'duplicate-child-2',
      accompanyingPerson: false,
    });
    expect(second.status).toBe(200);

    const secondBooking = await getBookingById(second.body.bookingId);
    await completeCheckoutWebhook({
      sessionId: secondBooking.session_id,
      metadata: {
        type: 'training_session',
        userId: String(user.id),
        trainingId: String(training.id),
        trainingType: trainingType.name,
        selectedDate: '2026-05-05',
        selectedTime: '16:00',
        childrenCount: '1',
        childrenAge: '9',
        totalPrice: '15',
        photoConsent: 'true',
        mobile: '+421900000005',
        note: 'duplicate-child-2',
        accompanyingPerson: 'false',
      },
    });

    const result = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM bookings
       WHERE user_id = $1 AND training_id = $2 AND active = true AND booking_type = 'paid'`,
      [user.id, training.id]
    );
    expect(result.rows[0].count).toBe(2);
  });

  test('6. duplikovaný booking (2x na ten istý session) s platbou na dospelácky tréning', async () => {
    const user = await createVerifiedUser('test_adult_duplicate@example.com');
    const agent = await loginAsUser(user.email);
    const { trainingType, training } = await createTrainingWithPrice({
      trainingTypeName: 'TEST_ADULT_DUPLICATE',
      audienceType: 'adults',
      price: 19,
    });

    const first = await agent.post('/api/create-adult-payment-session').send({
      userId: user.id,
      trainingId: training.id,
      trainingType: trainingType.name,
      selectedDate: '2026-05-06',
      selectedTime: '18:30',
      mobile: '+421900000006',
      note: 'duplicate-adult-1',
    });
    expect(first.status).toBe(200);

    const firstBooking = await getBookingById(first.body.bookingId);
    await completeCheckoutWebhook({
      sessionId: firstBooking.session_id,
      metadata: {
        type: 'adult_training_session',
        userId: String(user.id),
        trainingId: String(training.id),
        trainingType: trainingType.name,
        selectedDate: '2026-05-06',
        selectedTime: '18:30',
        totalPrice: '19',
        mobile: '+421900000006',
        note: 'duplicate-adult-1',
      },
    });

    const second = await agent.post('/api/create-adult-payment-session').send({
      userId: user.id,
      trainingId: training.id,
      trainingType: trainingType.name,
      selectedDate: '2026-05-06',
      selectedTime: '18:30',
      mobile: '+421900000006',
      note: 'duplicate-adult-2',
    });
    expect(second.status).toBe(200);

    const secondBooking = await getBookingById(second.body.bookingId);
    await completeCheckoutWebhook({
      sessionId: secondBooking.session_id,
      metadata: {
        type: 'adult_training_session',
        userId: String(user.id),
        trainingId: String(training.id),
        trainingType: trainingType.name,
        selectedDate: '2026-05-06',
        selectedTime: '18:30',
        totalPrice: '19',
        mobile: '+421900000006',
        note: 'duplicate-adult-2',
      },
    });

    const result = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM bookings
       WHERE user_id = $1 AND training_id = $2 AND active = true AND booking_type = 'paid'`,
      [user.id, training.id]
    );
    expect(result.rows[0].count).toBe(2);
  });
});