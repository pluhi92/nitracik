const request = require('supertest');
const bcrypt = require('bcryptjs');
const {
  cleanupTestData,
  createTestSeasonTicket,
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
  sendAdminSeasonTicketUsage: jest.fn().mockResolvedValue(true),
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

async function getLatestBookingByNote({ userId, trainingId, note }) {
  const result = await pool.query(
    `SELECT *
     FROM bookings
     WHERE user_id = $1 AND training_id = $2 AND note = $3
     ORDER BY id DESC
     LIMIT 1`,
    [userId, trainingId, note]
  );
  return result.rows[0];
}

async function createSeasonTicketForTrainingType({
  userId,
  trainingTypeId,
  entriesTotal = 5,
  entriesRemaining = entriesTotal,
}) {
  const ticket = await createTestSeasonTicket(userId, entriesTotal, entriesRemaining);

  await pool.query(
    `INSERT INTO season_ticket_product_training_types (season_ticket_product_id, training_type_id)
     VALUES ($1, $2)`,
    [ticket.season_ticket_product_id, trainingTypeId]
  );

  return ticket;
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

  test('4. booking z Activities s predvyplnenym datumom a casom funguje aj cez permanentku a pocita sa do adult kapacity', async () => {
    const { trainingType, session, selectedDate, selectedTime, basePrice } = await createAdultSessionByAdmin({
      maxParticipants: 2,
      basePrice: 21,
    });

    const seasonTicketUser = await createUser({
      email: 'test_adult_activity_season_ticket@example.com',
      firstName: 'Season',
      lastName: 'Adult',
    });
    const paidUser = await createUser({
      email: 'test_adult_activity_paid@example.com',
      firstName: 'Paid',
      lastName: 'Adult',
    });
    const blockedUser = await createUser({
      email: 'test_adult_activity_blocked@example.com',
      firstName: 'Blocked',
      lastName: 'Adult',
    });

    const seasonTicket = await createSeasonTicketForTrainingType({
      userId: seasonTicketUser.id,
      trainingTypeId: trainingType.id,
      entriesTotal: 5,
    });

    const seasonTicketAgent = await loginAsUser(seasonTicketUser.email);
    const seasonTicketNote = 'redirected-from-activity-adult-season-ticket';
    const seasonTicketResponse = await seasonTicketAgent.post('/api/use-season-ticket').send({
      userId: seasonTicketUser.id,
      seasonTicketId: seasonTicket.id,
      trainingTypeId: trainingType.id,
      trainingId: session.id,
      selectedDate,
      selectedTime,
      childrenCount: 1,
      mobile: '+421900000401',
      note: seasonTicketNote,
      ageGroup: 'adult',
    });

    expect(seasonTicketResponse.status).toBe(200);
    expect(seasonTicketResponse.body.success).toBe(true);

    const seasonTicketBooking = await getLatestBookingByNote({
      userId: seasonTicketUser.id,
      trainingId: session.id,
      note: seasonTicketNote,
    });
    expect(seasonTicketBooking.active).toBe(true);
    expect(seasonTicketBooking.booking_type).toBe('season_ticket');
    expect(seasonTicketBooking.number_of_children).toBe(0);
    expect(seasonTicketBooking.number_of_adults).toBe(1);
    expect(seasonTicketBooking.age_group).toBe('adult');
    expect(parseFloat(seasonTicketBooking.amount_paid)).toBe(0);
    expect(seasonTicketBooking.mobile).toBe('+421900000401');
    expect(seasonTicketBooking.note).toBe(seasonTicketNote);

    const ticketAfterUsage = await pool.query(
      'SELECT entries_remaining FROM season_tickets WHERE id = $1',
      [seasonTicket.id]
    );
    expect(ticketAfterUsage.rows[0].entries_remaining).toBe(4);

    const paidAgent = await loginAsUser(paidUser.email);
    const paidResponse = await paidAgent.post('/api/create-adult-payment-session').send({
      userId: paidUser.id,
      trainingId: session.id,
      trainingType: trainingType.name,
      selectedDate,
      selectedTime,
      mobile: '+421900000402',
      note: 'redirected-from-activity-adult-paid',
    });

    expect(paidResponse.status).toBe(200);

    const pendingPaidBooking = await getBookingById(paidResponse.body.bookingId);
    await completeCheckoutWebhook({
      sessionId: pendingPaidBooking.session_id,
      metadata: {
        type: 'adult_training_session',
        userId: String(paidUser.id),
        trainingId: String(session.id),
        trainingType: trainingType.name,
        selectedDate,
        selectedTime,
        totalPrice: String(basePrice),
        mobile: '+421900000402',
        note: 'redirected-from-activity-adult-paid',
      },
    });

    const blockedAgent = await loginAsUser(blockedUser.email);
    const blocked = await blockedAgent.post('/api/create-adult-payment-session').send({
      userId: blockedUser.id,
      trainingId: session.id,
      trainingType: trainingType.name,
      selectedDate,
      selectedTime,
      mobile: '+421900000403',
      note: 'redirected-from-activity-adult-blocked',
    });

    expect(blocked.status).toBe(500);
    expect(blocked.body.error).toContain('Kapacita tréningu bola práve naplnená.');

    const availabilityResponse = await request(app)
      .get('/api/check-availability')
      .query({
        trainingId: session.id,
        childrenCount: 1,
      });

    expect(availabilityResponse.status).toBe(200);
    expect(availabilityResponse.body.bookedChildren).toBe(2);
    expect(availabilityResponse.body.remainingSpots).toBe(0);
    expect(availabilityResponse.body.available).toBe(false);

    const activeBookings = await pool.query(
      `SELECT booking_type, COUNT(*)::int AS count,
              COALESCE(SUM(number_of_children), 0)::int AS children_count,
              COALESCE(SUM(number_of_adults), 0)::int AS adult_count
       FROM bookings
       WHERE training_id = $1 AND active = true
       GROUP BY booking_type
       ORDER BY booking_type ASC`,
      [session.id]
    );

    expect(activeBookings.rows).toEqual([
      { booking_type: 'paid', count: 1, children_count: 0, adult_count: 1 },
      { booking_type: 'season_ticket', count: 1, children_count: 0, adult_count: 1 },
    ]);

    expect(emailService.sendAdultBookingEmail).toHaveBeenCalledTimes(2);
    expect(emailService.sendAdminSeasonTicketUsage).toHaveBeenCalledTimes(1);
    expect(emailService.sendAdminNewBookingNotification).toHaveBeenCalledTimes(1);

    const adultBookingEmails = new Set(emailService.sendAdultBookingEmail.mock.calls.map((call) => call[0]));
    expect(adultBookingEmails).toEqual(new Set([seasonTicketUser.email, paidUser.email]));
  });

  test('5. permanentka s nedostatocnym poctom vstupov vrati chybu a nevytvori adult booking', async () => {
    const { trainingType, session, selectedDate, selectedTime } = await createAdultSessionByAdmin({
      maxParticipants: 3,
      basePrice: 20,
    });

    const user = await createUser({
      email: 'test_adult_season_ticket_not_enough_entries@example.com',
      firstName: 'Entries',
      lastName: 'Low',
    });

    const seasonTicket = await createSeasonTicketForTrainingType({
      userId: user.id,
      trainingTypeId: trainingType.id,
      entriesTotal: 5,
      entriesRemaining: 0,
    });

    const agent = await loginAsUser(user.email);
    const response = await agent.post('/api/use-season-ticket').send({
      userId: user.id,
      seasonTicketId: seasonTicket.id,
      trainingTypeId: trainingType.id,
      trainingId: session.id,
      selectedDate,
      selectedTime,
      childrenCount: 1,
      mobile: '+421900000501',
      note: 'redirected-from-activity-adult-season-ticket-not-enough',
      ageGroup: 'adult',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Not enough entries remaining in your season ticket');

    const activeSeasonTicketBookings = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM bookings
       WHERE user_id = $1 AND training_id = $2 AND booking_type = 'season_ticket' AND active = true`,
      [user.id, session.id]
    );
    expect(activeSeasonTicketBookings.rows[0].count).toBe(0);

    const ticketAfterAttempt = await pool.query(
      'SELECT entries_remaining FROM season_tickets WHERE id = $1',
      [seasonTicket.id]
    );
    expect(ticketAfterAttempt.rows[0].entries_remaining).toBe(0);

    expect(emailService.sendAdultBookingEmail).not.toHaveBeenCalled();
    expect(emailService.sendAdminSeasonTicketUsage).not.toHaveBeenCalled();
  });
});
