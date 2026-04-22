const request = require('supertest');
const bcrypt = require('bcryptjs');
const {
  cleanupTestData,
  createTestTrainingType,
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

async function createUser({ email, role = 'user', firstName = 'Test', lastName = 'Adult' }) {
  const hashedPassword = await bcrypt.hash('TestPass123', 10);
  const result = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password, address, verified, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (email) DO UPDATE SET password = $4, verified = $6, role = $7
     RETURNING *`,
    [firstName, lastName, email, hashedPassword, 'Test address 123', true, role]
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

async function createAdultSessionByAdmin({ maxParticipants = 5, basePrice = 15 }) {
  const unique = Date.now();
  const trainingTypeName = `TEST_ADULT_E2E_${unique}`;
  const trainingType = await createTestTrainingType(trainingTypeName, 'adults');

  await pool.query(
    `INSERT INTO training_prices (training_type_id, child_count, price)
     VALUES ($1, $2, $3)
     ON CONFLICT (training_type_id, child_count) DO UPDATE SET price = $3`,
    [trainingType.id, 1, basePrice]
  );

  const admin = await createUser({
    email: `test_admin_${unique}@example.com`,
    role: 'admin',
    firstName: 'Admin',
    lastName: 'Tester',
  });

  const adminAgent = await loginAsUser(admin.email);
  const localDateTime = `2026-07-10T1${unique % 10}:00`;

  const response = await adminAgent.post('/api/set-training').send({
    trainingType: trainingType.id,
    trainingDate: localDateTime,
    maxParticipants,
  });

  expect(response.status).toBe(201);
  expect(response.body.id).toBeDefined();
  expect(response.body.max_participants).toBe(maxParticipants);

  return {
    trainingType,
    session: response.body,
    selectedDate: '2026-07-10',
    selectedTime: `${String(10 + (unique % 10)).padStart(2, '0')}:00`,
    basePrice,
  };
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

describe('E2E - Adult session (admin creation, payments, duplicate validation, emails)', () => {
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

  test('1. admin vytvori adult session s kapacitou 4 miesta', async () => {
    const { session } = await createAdultSessionByAdmin({ maxParticipants: 4, basePrice: 16 });

    const dbSession = await pool.query(
      'SELECT id, max_participants FROM training_availability WHERE id = $1',
      [session.id]
    );

    expect(dbSession.rows.length).toBe(1);
    expect(dbSession.rows[0].max_participants).toBe(4);
  });

  test('2. 5 roznych userov: session so 4 miestami je pri 5. pokuse plna', async () => {
    const { trainingType, session, selectedDate, selectedTime, basePrice } = await createAdultSessionByAdmin({
      maxParticipants: 4,
      basePrice: 18,
    });

    const bookedUserEmails = [];

    for (let i = 1; i <= 4; i += 1) {
      const user = await createUser({
        email: `test_adult_capacity_multi_${i}@example.com`,
        firstName: `User${i}`,
        lastName: 'Multi',
      });
      const agent = await loginAsUser(user.email);

      const createResponse = await agent.post('/api/create-adult-payment-session').send({
        userId: user.id,
        trainingId: session.id,
        trainingType: trainingType.name,
        selectedDate,
        selectedTime,
        mobile: `+42190000010${i}`,
        note: `adult-capacity-multi-${i}`,
      });

      expect(createResponse.status).toBe(200);
      const pendingBooking = await getBookingById(createResponse.body.bookingId);
      expect(pendingBooking.active).toBe(false);
      expect(pendingBooking.number_of_children).toBe(0);
      expect(pendingBooking.number_of_adults).toBe(1);

      await completeCheckoutWebhook({
        sessionId: pendingBooking.session_id,
        metadata: {
          type: 'adult_training_session',
          userId: String(user.id),
          trainingId: String(session.id),
          trainingType: trainingType.name,
          selectedDate,
          selectedTime,
          totalPrice: String(basePrice),
          mobile: `+42190000010${i}`,
          note: `adult-capacity-multi-${i}`,
        },
      });

      const paidBooking = await getBookingById(createResponse.body.bookingId);
      expect(paidBooking.active).toBe(true);
      expect(paidBooking.number_of_children).toBe(0);
      expect(paidBooking.number_of_adults).toBe(1);
      expect(parseFloat(paidBooking.amount_paid)).toBe(basePrice);
      bookedUserEmails.push(user.email);
    }

    const availabilityResponse = await request(app)
      .get('/api/check-availability')
      .query({
        trainingId: session.id,
        childrenCount: 1,
      });

    expect(availabilityResponse.status).toBe(200);
    expect(availabilityResponse.body.bookedChildren).toBe(4);
    expect(availabilityResponse.body.remainingSpots).toBe(0);
    expect(availabilityResponse.body.available).toBe(false);

    const blockedUser = await createUser({
      email: 'test_adult_capacity_multi_5@example.com',
      firstName: 'User5',
      lastName: 'Multi',
    });
    const blockedAgent = await loginAsUser(blockedUser.email);

    const blocked = await blockedAgent.post('/api/create-adult-payment-session').send({
      userId: blockedUser.id,
      trainingId: session.id,
      trainingType: trainingType.name,
      selectedDate,
      selectedTime,
      mobile: '+421900000105',
      note: 'adult-capacity-multi-5',
    });

    expect(blocked.status).toBe(500);
    expect(blocked.body.error).toContain('Kapacita tréningu bola práve naplnená.');

    const activeCountResult = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM bookings
       WHERE training_id = $1 AND active = true AND booking_type = 'paid'`,
      [session.id]
    );
    expect(activeCountResult.rows[0].count).toBe(4);

    expect(emailService.sendAdultBookingEmail).toHaveBeenCalledTimes(4);
    expect(emailService.sendAdminNewBookingNotification).toHaveBeenCalledTimes(4);

    const emailedUsers = new Set(emailService.sendAdultBookingEmail.mock.calls.map((call) => call[0]));
    expect(emailedUsers.size).toBe(4);
    bookedUserEmails.forEach((email) => {
      expect(emailedUsers.has(email)).toBe(true);
    });
  });

  test('3. jeden user: 5 pokusov na session so 4 miestami, 5. pokus zlyha na kapacite', async () => {
    const { trainingType, session, selectedDate, selectedTime, basePrice } = await createAdultSessionByAdmin({
      maxParticipants: 4,
      basePrice: 19,
    });

    const user = await createUser({
      email: 'test_adult_same_user_capacity@example.com',
      firstName: 'Same',
      lastName: 'User',
    });
    const agent = await loginAsUser(user.email);

    for (let i = 1; i <= 4; i += 1) {
      const createResponse = await agent.post('/api/create-adult-payment-session').send({
        userId: user.id,
        trainingId: session.id,
        trainingType: trainingType.name,
        selectedDate,
        selectedTime,
        mobile: '+421900000200',
        note: `adult-same-user-${i}`,
        allowDuplicate: i > 1,
      });

      expect(createResponse.status).toBe(200);

      const booking = await getBookingById(createResponse.body.bookingId);
      expect(booking.active).toBe(false);
      expect(booking.number_of_children).toBe(0);
      expect(booking.number_of_adults).toBe(1);

      await completeCheckoutWebhook({
        sessionId: booking.session_id,
        metadata: {
          type: 'adult_training_session',
          userId: String(user.id),
          trainingId: String(session.id),
          trainingType: trainingType.name,
          selectedDate,
          selectedTime,
          totalPrice: String(basePrice),
          mobile: '+421900000200',
          note: `adult-same-user-${i}`,
        },
      });
    }

    const blocked = await agent.post('/api/create-adult-payment-session').send({
      userId: user.id,
      trainingId: session.id,
      trainingType: trainingType.name,
      selectedDate,
      selectedTime,
      mobile: '+421900000200',
      note: 'adult-same-user-5',
      allowDuplicate: true,
    });

    expect(blocked.status).toBe(500);
    expect(blocked.body.error).toContain('Kapacita tréningu bola práve naplnená.');

    const userBookings = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM bookings
       WHERE user_id = $1 AND training_id = $2 AND active = true AND booking_type = 'paid'`,
      [user.id, session.id]
    );
    expect(userBookings.rows[0].count).toBe(4);

    expect(emailService.sendAdultBookingEmail).toHaveBeenCalledTimes(4);
    expect(emailService.sendAdminNewBookingNotification).toHaveBeenCalledTimes(4);
  });
});
