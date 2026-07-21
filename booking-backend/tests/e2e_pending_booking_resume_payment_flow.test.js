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

const emailService = require('../services/emailService');
const { app, pool: serverPool } = require('../server');

async function createVerifiedUser(email) {
  const hashedPassword = await bcrypt.hash('TestPass123', 10);
  const result = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password, address, verified, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (email) DO UPDATE SET password = $4, verified = $6
     RETURNING *`,
    ['Flow', 'Tester', email, hashedPassword, 'Test address 123', true, 'user']
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
  const training = await createTestTraining(trainingType.id, 10);

  await pool.query(
    `INSERT INTO training_prices (training_type_id, child_count, price)
     VALUES ($1, $2, $3)
     ON CONFLICT (training_type_id, child_count) DO UPDATE SET price = $3`,
    [trainingType.id, 1, price]
  );

  return { trainingType, training };
}

async function getBookingById(bookingId) {
  const result = await pool.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
  return result.rows[0];
}

async function triggerWebhookEvent(eventPayload) {
  const response = await request(app)
    .post('/stripe-webhook')
    .set('Content-Type', 'application/json')
    .set('stripe-signature', 'test_signature')
    .send(eventPayload);

  expect(response.status).toBe(200);
}

async function triggerCompletedWebhook({ sessionId, metadata, paymentStatus = 'paid' }) {
  await triggerWebhookEvent({
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        payment_status: paymentStatus,
        payment_intent: `test_pi_complete_${Date.now()}`,
        created: Math.floor(Date.now() / 1000),
        metadata,
        customer_details: { email: 'test@example.com' },
      },
    },
  });
}

async function triggerPaymentFailedWebhook({ bookingId, amount = 1600 }) {
  await triggerWebhookEvent({
    type: 'payment_intent.payment_failed',
    data: {
      object: {
        id: `test_pi_failed_${Date.now()}`,
        amount,
        metadata: {
          bookingId: String(bookingId),
        },
      },
    },
  });
}

async function getBookingsForUserTraining(userId, trainingId) {
  const result = await pool.query(
    `SELECT * FROM bookings WHERE user_id = $1 AND training_id = $2 ORDER BY id ASC`,
    [userId, trainingId]
  );
  return result.rows;
}

function childPayload({ userId, trainingId, trainingType, note = 'pending-resume-flow' }) {
  return {
    userId,
    trainingId,
    trainingType,
    selectedDate: '2026-10-01',
    selectedTime: '16:00',
    childrenCount: 1,
    childrenAge: '7',
    photoConsent: true,
    mobile: '+421900111222',
    note,
    accompanyingPerson: false,
  };
}

function adultPayload({ userId, trainingId, trainingType, note = 'pending-resume-flow-adult' }) {
  return {
    userId,
    trainingId,
    trainingType,
    selectedDate: '2026-10-02',
    selectedTime: '18:00',
    mobile: '+421900333444',
    note,
    photoConsent: true,
  };
}

async function flushAsyncSideEffects() {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

describe('E2E - pending booking resume payment flow', () => {
  beforeAll(async () => {
    await cleanupTestData();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await pool.end();
    await serverPool.end();
  });

  test('user can resume pending payment for same session and receives confirmation emails after successful payment', async () => {
    const user = await createVerifiedUser('test_pending_resume_flow@example.com');
    const agent = await loginAsUser(user.email);

    const { trainingType, training } = await createTrainingWithPrice({
      trainingTypeName: 'TEST_PENDING_RESUME_FLOW',
      audienceType: 'children',
      price: 16,
    });

    const bookingPayload = childPayload({
      userId: user.id,
      trainingId: training.id,
      trainingType: trainingType.name,
    });

    // 1-2: Create booking and receive Stripe session for checkout redirect.
    const firstCreate = await agent.post('/api/create-payment-session').send(bookingPayload);
    expect(firstCreate.status).toBe(200);
    expect(firstCreate.body.bookingId).toBeDefined();
    expect(firstCreate.body.sessionId).toBeDefined();

    const firstBooking = await getBookingById(firstCreate.body.bookingId);
    expect(firstBooking).toBeDefined();
    expect(firstBooking.active).toBe(false);
    expect(firstBooking.amount_paid).toBeNull();
    expect(firstBooking.session_id).toBe(firstCreate.body.sessionId);

    // 3-5: User closes payment gateway; second attempt must return PENDING_BOOKING with existing session.
    const duplicateStatus = await agent
      .get('/api/bookings/duplicate-status')
      .query({ trainingId: training.id });

    expect(duplicateStatus.status).toBe(200);
    expect(duplicateStatus.body.code).toBe('PENDING_BOOKING');
    expect(duplicateStatus.body.existingBookingId).toBe(firstCreate.body.bookingId);
    expect(duplicateStatus.body.existingSessionId).toBe(firstCreate.body.sessionId);

    const secondCreate = await agent.post('/api/create-payment-session').send(bookingPayload);
    expect(secondCreate.status).toBe(409);
    expect(secondCreate.body.code).toBe('PENDING_BOOKING');
    expect(secondCreate.body.existingBookingId).toBe(firstCreate.body.bookingId);
    expect(secondCreate.body.existingSessionId).toBe(firstCreate.body.sessionId);

    // 6-8: "Complete payment" -> continue with existing Stripe session and simulate successful payment.
    const resumedSessionId = secondCreate.body.existingSessionId;
    await triggerCompletedWebhook({
      sessionId: resumedSessionId,
      metadata: {
        type: 'training_session',
        userId: String(user.id),
        trainingId: String(training.id),
        trainingType: trainingType.name,
        selectedDate: bookingPayload.selectedDate,
        selectedTime: bookingPayload.selectedTime,
        childrenCount: String(bookingPayload.childrenCount),
        childrenAge: bookingPayload.childrenAge,
        totalPrice: '16',
        photoConsent: 'true',
        mobile: bookingPayload.mobile,
        note: bookingPayload.note,
        accompanyingPerson: 'false',
      },
    });

    await flushAsyncSideEffects();

    // 9: Booking becomes valid/active after successful payment.
    const paidBooking = await getBookingById(firstCreate.body.bookingId);
    expect(paidBooking.active).toBe(true);
    expect(parseFloat(paidBooking.amount_paid)).toBe(16);
    expect(paidBooking.payment_intent_id).toBeTruthy();

    const bookingCount = await pool.query(
      `SELECT COUNT(*)::int AS count FROM bookings WHERE user_id = $1 AND training_id = $2`,
      [user.id, training.id]
    );
    expect(bookingCount.rows[0].count).toBe(1);

    // 10: Confirmation emails are sent (user + admin).
    expect(emailService.sendUserBookingEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendUserBookingEmail).toHaveBeenCalledWith(
      user.email,
      expect.objectContaining({
        paymentType: 'payment',
        trainingType: trainingType.name,
      })
    );

    expect(emailService.sendAdminNewBookingNotification).toHaveBeenCalledTimes(1);
    expect(emailService.sendAdminNewBookingNotification).toHaveBeenCalledWith(
      'info@nitracik.sk',
      expect.objectContaining({
        trainingId: training.id,
        selectedDate: bookingPayload.selectedDate,
        selectedTime: bookingPayload.selectedTime,
      })
    );
  });

  test('adult user can resume pending payment for same session and receives adult confirmation emails', async () => {
    const user = await createVerifiedUser('test_pending_resume_adult_flow@example.com');
    const agent = await loginAsUser(user.email);

    const { trainingType, training } = await createTrainingWithPrice({
      trainingTypeName: 'TEST_PENDING_RESUME_FLOW_ADULT',
      audienceType: 'adults',
      price: 19,
    });

    const payload = adultPayload({
      userId: user.id,
      trainingId: training.id,
      trainingType: trainingType.name,
    });

    const firstCreate = await agent.post('/api/create-adult-payment-session').send(payload);
    expect(firstCreate.status).toBe(200);

    const duplicateStatus = await agent
      .get('/api/bookings/duplicate-status')
      .query({ trainingId: training.id });

    expect(duplicateStatus.status).toBe(200);
    expect(duplicateStatus.body.code).toBe('PENDING_BOOKING');
    expect(duplicateStatus.body.existingSessionId).toBe(firstCreate.body.sessionId);

    const secondCreate = await agent.post('/api/create-adult-payment-session').send(payload);
    expect(secondCreate.status).toBe(409);
    expect(secondCreate.body.code).toBe('PENDING_BOOKING');

    await triggerCompletedWebhook({
      sessionId: secondCreate.body.existingSessionId,
      metadata: {
        type: 'adult_training_session',
        userId: String(user.id),
        trainingId: String(training.id),
        trainingType: trainingType.name,
        selectedDate: payload.selectedDate,
        selectedTime: payload.selectedTime,
        totalPrice: '19',
        mobile: payload.mobile,
        note: payload.note,
        photoConsent: 'true',
      },
    });

    await flushAsyncSideEffects();

    const paidBooking = await getBookingById(firstCreate.body.bookingId);
    expect(paidBooking.active).toBe(true);
    expect(parseFloat(paidBooking.amount_paid)).toBe(19);
    expect(paidBooking.age_group).toBe('adult');

    expect(emailService.sendAdultBookingEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendAdultBookingEmail).toHaveBeenCalledWith(
      user.email,
      expect.objectContaining({
        paymentType: 'paid',
        trainingType: trainingType.name,
      })
    );
    expect(emailService.sendAdminNewBookingNotification).toHaveBeenCalledTimes(1);
  });

  test('negative: unauthenticated user cannot check duplicate status', async () => {
    const response = await request(app)
      .get('/api/bookings/duplicate-status')
      .query({ trainingId: 9999 });

    expect(response.status).toBe(401);
  });

  test('negative: duplicate status requires trainingId', async () => {
    const user = await createVerifiedUser('test_pending_duplicate_missing_training_id@example.com');
    const agent = await loginAsUser(user.email);

    const response = await agent.get('/api/bookings/duplicate-status');

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/trainingId is required/i);
  });

  test('negative: child create-payment-session requires trainingId', async () => {
    const user = await createVerifiedUser('test_pending_missing_training_id@example.com');
    const agent = await loginAsUser(user.email);

    const response = await agent.post('/api/create-payment-session').send({
      userId: user.id,
      trainingId: null,
      trainingType: 'TEST_TYPE',
      childrenCount: 1,
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Nebol vybratý konkrétny termín/i);
  });

  test('negative: child create-payment-session rejects childrenCount < 1', async () => {
    const user = await createVerifiedUser('test_pending_invalid_children_count@example.com');
    const agent = await loginAsUser(user.email);
    const { trainingType, training } = await createTrainingWithPrice({
      trainingTypeName: 'TEST_PENDING_INVALID_CHILDREN_COUNT',
      audienceType: 'children',
      price: 14,
    });

    const response = await agent.post('/api/create-payment-session').send({
      userId: user.id,
      trainingId: training.id,
      trainingType: trainingType.name,
      selectedDate: '2026-10-01',
      selectedTime: '15:00',
      childrenCount: 0,
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/aspoň jedno dieťa/i);
  });

  test('negative: adult create-payment-session requires trainingId', async () => {
    const user = await createVerifiedUser('test_pending_adult_missing_training_id@example.com');
    const agent = await loginAsUser(user.email);

    const response = await agent.post('/api/create-adult-payment-session').send({
      userId: user.id,
      trainingId: null,
      trainingType: 'TEST_ADULT',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Nebol vybratý konkrétny termín/i);
  });

  test('negative: pending booking of user A is not reported to user B', async () => {
    const userA = await createVerifiedUser('test_pending_user_a@example.com');
    const userB = await createVerifiedUser('test_pending_user_b@example.com');
    const agentA = await loginAsUser(userA.email);
    const agentB = await loginAsUser(userB.email);

    const { trainingType, training } = await createTrainingWithPrice({
      trainingTypeName: 'TEST_PENDING_USER_ISOLATION',
      audienceType: 'children',
      price: 12,
    });

    const payloadA = childPayload({
      userId: userA.id,
      trainingId: training.id,
      trainingType: trainingType.name,
      note: 'pending-a',
    });

    const createA = await agentA.post('/api/create-payment-session').send(payloadA);
    expect(createA.status).toBe(200);

    const statusB = await agentB
      .get('/api/bookings/duplicate-status')
      .query({ trainingId: training.id });
    expect(statusB.status).toBe(200);
    expect(statusB.body.code).toBeNull();

    const payloadB = childPayload({
      userId: userB.id,
      trainingId: training.id,
      trainingType: trainingType.name,
      note: 'pending-b',
    });

    const createB = await agentB.post('/api/create-payment-session').send(payloadB);
    expect(createB.status).toBe(200);

    const bookings = await getBookingsForUserTraining(userB.id, training.id);
    expect(bookings.length).toBe(1);
    expect(bookings[0].active).toBe(false);
  });

  test('negative: completed webhook with payment_status != paid keeps booking pending and sends no confirmation emails', async () => {
    const user = await createVerifiedUser('test_pending_unpaid_webhook@example.com');
    const agent = await loginAsUser(user.email);
    const { trainingType, training } = await createTrainingWithPrice({
      trainingTypeName: 'TEST_PENDING_UNPAID_WEBHOOK',
      audienceType: 'children',
      price: 11,
    });

    const payload = childPayload({
      userId: user.id,
      trainingId: training.id,
      trainingType: trainingType.name,
      note: 'unpaid-webhook',
    });

    const createResponse = await agent.post('/api/create-payment-session').send(payload);
    expect(createResponse.status).toBe(200);

    await triggerCompletedWebhook({
      sessionId: createResponse.body.sessionId,
      paymentStatus: 'unpaid',
      metadata: {
        type: 'training_session',
        userId: String(user.id),
        trainingId: String(training.id),
      },
    });
    await flushAsyncSideEffects();

    const booking = await getBookingById(createResponse.body.bookingId);
    expect(booking.active).toBe(false);
    expect(booking.amount_paid).toBeNull();

    expect(emailService.sendUserBookingEmail).not.toHaveBeenCalled();
    expect(emailService.sendAdminNewBookingNotification).not.toHaveBeenCalled();
  });

  test('negative: completed webhook without bookingId metadata does not activate pending booking', async () => {
    const user = await createVerifiedUser('test_pending_missing_booking_id_in_metadata@example.com');
    const agent = await loginAsUser(user.email);
    const { trainingType, training } = await createTrainingWithPrice({
      trainingTypeName: 'TEST_PENDING_MISSING_BOOKING_ID',
      audienceType: 'children',
      price: 15,
    });

    const payload = childPayload({
      userId: user.id,
      trainingId: training.id,
      trainingType: trainingType.name,
      note: 'missing-booking-id',
    });

    const createResponse = await agent.post('/api/create-payment-session').send(payload);
    expect(createResponse.status).toBe(200);

    await triggerCompletedWebhook({
      sessionId: createResponse.body.sessionId,
      metadata: {
        type: 'training_session',
        userId: String(user.id),
        trainingId: String(training.id),
      },
    });
    await flushAsyncSideEffects();

    const booking = await getBookingById(createResponse.body.bookingId);
    expect(booking.active).toBe(false);
    expect(booking.amount_paid).toBeNull();

    expect(emailService.sendUserBookingEmail).not.toHaveBeenCalled();
    expect(emailService.sendAdminNewBookingNotification).not.toHaveBeenCalled();
  });

  test('negative: payment_intent.payment_failed keeps booking pending and still blocks duplicate create with PENDING_BOOKING', async () => {
    const user = await createVerifiedUser('test_pending_payment_failed_flow@example.com');
    const agent = await loginAsUser(user.email);
    const { trainingType, training } = await createTrainingWithPrice({
      trainingTypeName: 'TEST_PENDING_PAYMENT_FAILED_FLOW',
      audienceType: 'children',
      price: 18,
    });

    const payload = childPayload({
      userId: user.id,
      trainingId: training.id,
      trainingType: trainingType.name,
      note: 'payment-failed-flow',
    });

    const firstCreate = await agent.post('/api/create-payment-session').send(payload);
    expect(firstCreate.status).toBe(200);

    await triggerPaymentFailedWebhook({ bookingId: firstCreate.body.bookingId, amount: 1800 });
    await flushAsyncSideEffects();

    const statusAfterFail = await agent
      .get('/api/bookings/duplicate-status')
      .query({ trainingId: training.id });

    expect(statusAfterFail.status).toBe(200);
    expect(statusAfterFail.body.code).toBe('PENDING_BOOKING');
    expect(statusAfterFail.body.existingBookingId).toBe(firstCreate.body.bookingId);
    expect(statusAfterFail.body.existingSessionId).toBe(firstCreate.body.sessionId);

    const secondCreate = await agent.post('/api/create-payment-session').send(payload);
    expect(secondCreate.status).toBe(409);
    expect(secondCreate.body.code).toBe('PENDING_BOOKING');
    expect(secondCreate.body.existingBookingId).toBe(firstCreate.body.bookingId);
    expect(secondCreate.body.existingSessionId).toBe(firstCreate.body.sessionId);

    const bookings = await getBookingsForUserTraining(user.id, training.id);
    expect(bookings.length).toBe(1);
    expect(bookings[0].active).toBe(false);
    expect(bookings[0].amount_paid).toBeNull();

    expect(emailService.sendPaymentFailedEmail).toHaveBeenCalledTimes(1);
  });
});
