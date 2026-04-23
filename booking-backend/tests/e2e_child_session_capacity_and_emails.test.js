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

async function createUser({ email, role = 'user', firstName = 'Test', lastName = 'Child' }) {
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

async function createChildSessionByAdmin({ maxParticipants = 5, basePrice = 14 }) {
  const unique = Date.now();
  const trainingTypeName = `TEST_CHILD_E2E_${unique}`;
  const trainingType = await createTestTrainingType(trainingTypeName, 'children');

  for (let childCount = 1; childCount <= maxParticipants; childCount += 1) {
    await pool.query(
      `INSERT INTO training_prices (training_type_id, child_count, price)
       VALUES ($1, $2, $3)
       ON CONFLICT (training_type_id, child_count) DO UPDATE SET price = $3`,
      [trainingType.id, childCount, basePrice * childCount]
    );
  }

  const admin = await createUser({
    email: `test_child_admin_${unique}@example.com`,
    role: 'admin',
    firstName: 'Admin',
    lastName: 'Tester',
  });

  const adminAgent = await loginAsUser(admin.email);
  const localDateTime = `2026-07-11T1${unique % 10}:00`;

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
    selectedDate: '2026-07-11',
    selectedTime: `${String(10 + (unique % 10)).padStart(2, '0')}:00`,
    priceByCount: Object.fromEntries(
      Array.from({ length: maxParticipants }, (_, index) => {
        const childCount = index + 1;
        return [childCount, basePrice * childCount];
      })
    ),
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

async function getActivePaidChildBookingsBySession(sessionId) {
  const result = await pool.query(
    `SELECT
      id,
      user_id,
      number_of_children,
      COALESCE(number_of_adults, 0) AS number_of_adults,
      age_group,
      amount_paid,
      payment_intent_id,
      session_id,
      booking_type,
      children_ages,
      photo_consent,
      accompanying_person,
      note,
      mobile,
      active
     FROM bookings
     WHERE training_id = $1 AND active = true AND booking_type = 'paid'
     ORDER BY id ASC`,
    [sessionId]
  );
  return result.rows;
}

async function assertSessionChildBookingsSnapshot({
  sessionId,
  expectedBookings,
  expectedChildren,
  expectedUniqueUsers,
}) {
  const rows = await getActivePaidChildBookingsBySession(sessionId);

  expect(rows.length).toBe(expectedBookings);
  expect(rows.reduce((sum, row) => sum + Number(row.number_of_children), 0)).toBe(expectedChildren);

  if (typeof expectedUniqueUsers === 'number') {
    expect(new Set(rows.map((row) => row.user_id)).size).toBe(expectedUniqueUsers);
  }

  rows.forEach((row) => {
    expect(row.active).toBe(true);
    expect(row.booking_type).toBe('paid');
    expect(Number(row.number_of_children)).toBeGreaterThan(0);
    expect(Number(row.number_of_adults)).toBe(0);
    expect(row.age_group).not.toBe('adult');
    expect(row.session_id).toBeNull();
    expect(row.payment_intent_id).toBeTruthy();
    expect(Number(row.amount_paid)).toBeGreaterThan(0);
    expect(row.children_ages).toBeTruthy();
    expect(row.photo_consent).toBe(true);
    expect(row.accompanying_person).toBe(false);
    expect(row.note).toBeTruthy();
    expect(row.mobile).toBeTruthy();
  });
}

function buildChildrenAges(childrenCount) {
  return Array.from({ length: childrenCount }, (_, index) => 5 + index).join(', ');
}

async function createAndPayChildBooking({
  agent,
  user,
  trainingType,
  session,
  selectedDate,
  selectedTime,
  childrenCount,
  totalPrice,
  note,
  allowDuplicate = false,
}) {
  const childrenAge = buildChildrenAges(childrenCount);
  const mobile = `+421900${String(user.id).padStart(6, '0')}`;

  const createResponse = await agent.post('/api/create-payment-session').send({
    userId: user.id,
    trainingId: session.id,
    trainingType: trainingType.name,
    selectedDate,
    selectedTime,
    childrenCount,
    childrenAge,
    photoConsent: true,
    mobile,
    note,
    accompanyingPerson: false,
    allowDuplicate,
  });

  expect(createResponse.status).toBe(200);
  const pendingBooking = await getBookingById(createResponse.body.bookingId);
  expect(pendingBooking.active).toBe(false);
  expect(pendingBooking.number_of_children).toBe(childrenCount);
  expect(pendingBooking.session_id).toBeTruthy();

  await completeCheckoutWebhook({
    sessionId: pendingBooking.session_id,
    metadata: {
      type: 'training_session',
      userId: String(user.id),
      trainingId: String(session.id),
      trainingType: trainingType.name,
      selectedDate,
      selectedTime,
      childrenCount: String(childrenCount),
      childrenAge,
      totalPrice: String(totalPrice),
      photoConsent: 'true',
      mobile,
      note,
      accompanyingPerson: 'false',
    },
  });

  const paidBooking = await getBookingById(createResponse.body.bookingId);
  expect(paidBooking.active).toBe(true);
  expect(paidBooking.number_of_children).toBe(childrenCount);
  expect((paidBooking.number_of_adults || 0)).toBe(0);
  expect(paidBooking.age_group).not.toBe('adult');
  expect(parseFloat(paidBooking.amount_paid)).toBe(totalPrice);
  expect(paidBooking.booking_type).toBe('paid');
  expect(paidBooking.payment_intent_id).toBeTruthy();
  expect(paidBooking.session_id).toBeNull();
  expect(paidBooking.children_ages).toBe(childrenAge);
  expect(paidBooking.photo_consent).toBe(true);
  expect(paidBooking.mobile).toBe(mobile);
  expect(paidBooking.note).toBe(note);
  expect(paidBooking.accompanying_person).toBe(false);

  return paidBooking;
}

describe('E2E - Child session capacity and emails', () => {
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

  test('1. admin vytvori detsky session s kapacitou 5 miest', async () => {
    const { session } = await createChildSessionByAdmin({ maxParticipants: 5, basePrice: 14 });

    const dbSession = await pool.query(
      'SELECT id, max_participants FROM training_availability WHERE id = $1',
      [session.id]
    );

    expect(dbSession.rows.length).toBe(1);
    expect(dbSession.rows[0].max_participants).toBe(5);
  });

  test('2. jeden user: 5 rezervacii po 1 dietati, 6. pokus zlyha na kapacite', async () => {
    const { trainingType, session, selectedDate, selectedTime, priceByCount } = await createChildSessionByAdmin({
      maxParticipants: 5,
      basePrice: 15,
    });

    const user = await createUser({
      email: 'test_child_same_user_capacity@example.com',
      firstName: 'Same',
      lastName: 'Parent',
    });
    const agent = await loginAsUser(user.email);

    for (let i = 1; i <= 5; i += 1) {
      await createAndPayChildBooking({
        agent,
        user,
        trainingType,
        session,
        selectedDate,
        selectedTime,
        childrenCount: 1,
        totalPrice: priceByCount[1],
        note: `child-same-user-${i}`,
        allowDuplicate: i > 1,
      });
    }

    const availabilityResponse = await request(app)
      .get('/api/check-availability')
      .query({
        trainingId: session.id,
        childrenCount: 1,
      });

    expect(availabilityResponse.status).toBe(200);
    expect(availabilityResponse.body.bookedChildren).toBe(5);
    expect(availabilityResponse.body.remainingSpots).toBe(0);
    expect(availabilityResponse.body.available).toBe(false);

    const blocked = await agent.post('/api/create-payment-session').send({
      userId: user.id,
      trainingId: session.id,
      trainingType: trainingType.name,
      selectedDate,
      selectedTime,
      childrenCount: 1,
      childrenAge: '5',
      photoConsent: true,
      mobile: '+421900111111',
      note: 'child-same-user-6',
      accompanyingPerson: false,
      allowDuplicate: true,
    });

    expect(blocked.status).toBe(500);
    expect(blocked.body.error).toContain('Kapacita tréningu bola práve naplnená.');

    const userBookings = await pool.query(
      `SELECT COUNT(*)::int AS count, COALESCE(SUM(number_of_children), 0)::int AS children_count
       FROM bookings
       WHERE user_id = $1 AND training_id = $2 AND active = true AND booking_type = 'paid'`,
      [user.id, session.id]
    );
    expect(userBookings.rows[0].count).toBe(5);
    expect(userBookings.rows[0].children_count).toBe(5);

    expect(emailService.sendUserBookingEmail).toHaveBeenCalledTimes(5);
    expect(emailService.sendAdminNewBookingNotification).toHaveBeenCalledTimes(5);

    await assertSessionChildBookingsSnapshot({
      sessionId: session.id,
      expectedBookings: 5,
      expectedChildren: 5,
      expectedUniqueUsers: 1,
    });
  });

  test('3. 6 roznych userov: session s 5 miestami je pri 6. pokuse plna', async () => {
    const { trainingType, session, selectedDate, selectedTime, priceByCount } = await createChildSessionByAdmin({
      maxParticipants: 5,
      basePrice: 16,
    });

    const bookedUserEmails = [];

    for (let i = 1; i <= 5; i += 1) {
      const user = await createUser({
        email: `test_child_capacity_multi_${i}@example.com`,
        firstName: `User${i}`,
        lastName: 'Child',
      });
      const agent = await loginAsUser(user.email);

      await createAndPayChildBooking({
        agent,
        user,
        trainingType,
        session,
        selectedDate,
        selectedTime,
        childrenCount: 1,
        totalPrice: priceByCount[1],
        note: `child-capacity-multi-${i}`,
      });

      bookedUserEmails.push(user.email);
    }

    const blockedUser = await createUser({
      email: 'test_child_capacity_multi_6@example.com',
      firstName: 'User6',
      lastName: 'Child',
    });
    const blockedAgent = await loginAsUser(blockedUser.email);

    const blocked = await blockedAgent.post('/api/create-payment-session').send({
      userId: blockedUser.id,
      trainingId: session.id,
      trainingType: trainingType.name,
      selectedDate,
      selectedTime,
      childrenCount: 1,
      childrenAge: '5',
      photoConsent: true,
      mobile: '+421900222222',
      note: 'child-capacity-multi-6',
      accompanyingPerson: false,
    });

    expect(blocked.status).toBe(500);
    expect(blocked.body.error).toContain('Kapacita tréningu bola práve naplnená.');

    const activeCountResult = await pool.query(
      `SELECT COUNT(*)::int AS count, COALESCE(SUM(number_of_children), 0)::int AS children_count
       FROM bookings
       WHERE training_id = $1 AND active = true AND booking_type = 'paid'`,
      [session.id]
    );
    expect(activeCountResult.rows[0].count).toBe(5);
    expect(activeCountResult.rows[0].children_count).toBe(5);

    expect(emailService.sendUserBookingEmail).toHaveBeenCalledTimes(5);
    expect(emailService.sendAdminNewBookingNotification).toHaveBeenCalledTimes(5);

    const emailedUsers = new Set(emailService.sendUserBookingEmail.mock.calls.map((call) => call[0]));
    expect(emailedUsers.size).toBe(5);
    bookedUserEmails.forEach((email) => {
      expect(emailedUsers.has(email)).toBe(true);
    });

    await assertSessionChildBookingsSnapshot({
      sessionId: session.id,
      expectedBookings: 5,
      expectedChildren: 5,
      expectedUniqueUsers: 5,
    });
  });

  test('4. user1 rezervuje 3 deti, user2 rezervuje 2 deti, user3 dostane plnu kapacitu', async () => {
    const { trainingType, session, selectedDate, selectedTime, priceByCount } = await createChildSessionByAdmin({
      maxParticipants: 5,
      basePrice: 17,
    });

    const user1 = await createUser({ email: 'test_child_mix_3_2_u1@example.com' });
    const user2 = await createUser({ email: 'test_child_mix_3_2_u2@example.com' });
    const user3 = await createUser({ email: 'test_child_mix_3_2_u3@example.com' });

    await createAndPayChildBooking({
      agent: await loginAsUser(user1.email),
      user: user1,
      trainingType,
      session,
      selectedDate,
      selectedTime,
      childrenCount: 3,
      totalPrice: priceByCount[3],
      note: 'child-mix-3-2-u1',
    });

    await createAndPayChildBooking({
      agent: await loginAsUser(user2.email),
      user: user2,
      trainingType,
      session,
      selectedDate,
      selectedTime,
      childrenCount: 2,
      totalPrice: priceByCount[2],
      note: 'child-mix-3-2-u2',
    });

    const blockedAgent = await loginAsUser(user3.email);
    const blocked = await blockedAgent.post('/api/create-payment-session').send({
      userId: user3.id,
      trainingId: session.id,
      trainingType: trainingType.name,
      selectedDate,
      selectedTime,
      childrenCount: 1,
      childrenAge: '5',
      photoConsent: true,
      mobile: '+421900333333',
      note: 'child-mix-3-2-u3',
      accompanyingPerson: false,
    });

    expect(blocked.status).toBe(500);
    expect(blocked.body.error).toContain('Kapacita tréningu bola práve naplnená.');

    await assertSessionChildBookingsSnapshot({
      sessionId: session.id,
      expectedBookings: 2,
      expectedChildren: 5,
      expectedUniqueUsers: 2,
    });
  });

  test('5. user1 rezervuje 2 deti, user2 rezervuje 2 deti, user3 chce 2 deti a dostane plnu kapacitu', async () => {
    const { trainingType, session, selectedDate, selectedTime, priceByCount } = await createChildSessionByAdmin({
      maxParticipants: 5,
      basePrice: 18,
    });

    const user1 = await createUser({ email: 'test_child_mix_2_2_2_u1@example.com' });
    const user2 = await createUser({ email: 'test_child_mix_2_2_2_u2@example.com' });
    const user3 = await createUser({ email: 'test_child_mix_2_2_2_u3@example.com' });

    await createAndPayChildBooking({
      agent: await loginAsUser(user1.email),
      user: user1,
      trainingType,
      session,
      selectedDate,
      selectedTime,
      childrenCount: 2,
      totalPrice: priceByCount[2],
      note: 'child-mix-2-2-2-u1',
    });

    await createAndPayChildBooking({
      agent: await loginAsUser(user2.email),
      user: user2,
      trainingType,
      session,
      selectedDate,
      selectedTime,
      childrenCount: 2,
      totalPrice: priceByCount[2],
      note: 'child-mix-2-2-2-u2',
    });

    const availabilityResponse = await request(app)
      .get('/api/check-availability')
      .query({
        trainingId: session.id,
        childrenCount: 2,
      });

    expect(availabilityResponse.status).toBe(200);
    expect(availabilityResponse.body.bookedChildren).toBe(4);
    expect(availabilityResponse.body.remainingSpots).toBe(1);
    expect(availabilityResponse.body.available).toBe(false);

    const blockedAgent = await loginAsUser(user3.email);
    const blocked = await blockedAgent.post('/api/create-payment-session').send({
      userId: user3.id,
      trainingId: session.id,
      trainingType: trainingType.name,
      selectedDate,
      selectedTime,
      childrenCount: 2,
      childrenAge: '5, 6',
      photoConsent: true,
      mobile: '+421900444444',
      note: 'child-mix-2-2-2-u3',
      accompanyingPerson: false,
    });

    expect(blocked.status).toBe(500);
    expect(blocked.body.error).toContain('Kapacita tréningu bola práve naplnená.');

    await assertSessionChildBookingsSnapshot({
      sessionId: session.id,
      expectedBookings: 2,
      expectedChildren: 4,
      expectedUniqueUsers: 2,
    });
  });

  test('6. user1 rezervuje 2 deti, user2 rezervuje 2 deti, user3 rezervuje 1 dieta a vsetko prejde', async () => {
    const { trainingType, session, selectedDate, selectedTime, priceByCount } = await createChildSessionByAdmin({
      maxParticipants: 5,
      basePrice: 19,
    });

    const user1 = await createUser({ email: 'test_child_mix_2_2_1_u1@example.com' });
    const user2 = await createUser({ email: 'test_child_mix_2_2_1_u2@example.com' });
    const user3 = await createUser({ email: 'test_child_mix_2_2_1_u3@example.com' });

    await createAndPayChildBooking({
      agent: await loginAsUser(user1.email),
      user: user1,
      trainingType,
      session,
      selectedDate,
      selectedTime,
      childrenCount: 2,
      totalPrice: priceByCount[2],
      note: 'child-mix-2-2-1-u1',
    });

    await createAndPayChildBooking({
      agent: await loginAsUser(user2.email),
      user: user2,
      trainingType,
      session,
      selectedDate,
      selectedTime,
      childrenCount: 2,
      totalPrice: priceByCount[2],
      note: 'child-mix-2-2-1-u2',
    });

    const availabilityBeforeThird = await request(app)
      .get('/api/check-availability')
      .query({
        trainingId: session.id,
        childrenCount: 1,
      });

    expect(availabilityBeforeThird.status).toBe(200);
    expect(availabilityBeforeThird.body.bookedChildren).toBe(4);
    expect(availabilityBeforeThird.body.remainingSpots).toBe(1);
    expect(availabilityBeforeThird.body.available).toBe(true);

    await createAndPayChildBooking({
      agent: await loginAsUser(user3.email),
      user: user3,
      trainingType,
      session,
      selectedDate,
      selectedTime,
      childrenCount: 1,
      totalPrice: priceByCount[1],
      note: 'child-mix-2-2-1-u3',
    });

    const availabilityAfterThird = await request(app)
      .get('/api/check-availability')
      .query({
        trainingId: session.id,
        childrenCount: 1,
      });

    expect(availabilityAfterThird.status).toBe(200);
    expect(availabilityAfterThird.body.bookedChildren).toBe(5);
    expect(availabilityAfterThird.body.remainingSpots).toBe(0);
    expect(availabilityAfterThird.body.available).toBe(false);

    await assertSessionChildBookingsSnapshot({
      sessionId: session.id,
      expectedBookings: 3,
      expectedChildren: 5,
      expectedUniqueUsers: 3,
    });
  });

  test('7. booking z Activities s predvyplnenym datumom a casom funguje aj cez permanentku a pocita sa do child kapacity', async () => {
    const { trainingType, session, selectedDate, selectedTime, priceByCount } = await createChildSessionByAdmin({
      maxParticipants: 5,
      basePrice: 20,
    });

    const seasonTicketUser = await createUser({
      email: 'test_child_activity_season_ticket@example.com',
      firstName: 'Season',
      lastName: 'Parent',
    });
    const paidUser = await createUser({
      email: 'test_child_activity_paid@example.com',
      firstName: 'Paid',
      lastName: 'Parent',
    });
    const blockedUser = await createUser({
      email: 'test_child_activity_blocked@example.com',
      firstName: 'Blocked',
      lastName: 'Parent',
    });

    const seasonTicket = await createSeasonTicketForTrainingType({
      userId: seasonTicketUser.id,
      trainingTypeId: trainingType.id,
      entriesTotal: 5,
    });

    const seasonTicketAgent = await loginAsUser(seasonTicketUser.email);
    const seasonTicketNote = 'redirected-from-activity-child-season-ticket';
    const seasonTicketResponse = await seasonTicketAgent.post('/api/use-season-ticket').send({
      userId: seasonTicketUser.id,
      seasonTicketId: seasonTicket.id,
      trainingTypeId: trainingType.id,
      trainingId: session.id,
      selectedDate,
      selectedTime,
      childrenCount: 2,
      childrenAge: '6, 7',
      photoConsent: true,
      mobile: '+421900000701',
      note: seasonTicketNote,
      accompanyingPerson: false,
      ageGroup: 'child',
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
    expect(seasonTicketBooking.number_of_children).toBe(2);
    expect((seasonTicketBooking.number_of_adults || 0)).toBe(0);
    expect(seasonTicketBooking.age_group).toBe('child');
    expect(parseFloat(seasonTicketBooking.amount_paid)).toBe(0);
    expect(seasonTicketBooking.children_ages).toBe('6, 7');
    expect(seasonTicketBooking.mobile).toBe('+421900000701');
    expect(seasonTicketBooking.note).toBe(seasonTicketNote);

    const ticketAfterUsage = await pool.query(
      'SELECT entries_remaining FROM season_tickets WHERE id = $1',
      [seasonTicket.id]
    );
    expect(ticketAfterUsage.rows[0].entries_remaining).toBe(3);

    await createAndPayChildBooking({
      agent: await loginAsUser(paidUser.email),
      user: paidUser,
      trainingType,
      session,
      selectedDate,
      selectedTime,
      childrenCount: 3,
      totalPrice: priceByCount[3],
      note: 'redirected-from-activity-child-paid',
    });

    const availabilityResponse = await request(app)
      .get('/api/check-availability')
      .query({
        trainingId: session.id,
        childrenCount: 1,
      });

    expect(availabilityResponse.status).toBe(200);
    expect(availabilityResponse.body.bookedChildren).toBe(5);
    expect(availabilityResponse.body.remainingSpots).toBe(0);
    expect(availabilityResponse.body.available).toBe(false);

    const blockedAgent = await loginAsUser(blockedUser.email);
    const blocked = await blockedAgent.post('/api/create-payment-session').send({
      userId: blockedUser.id,
      trainingId: session.id,
      trainingType: trainingType.name,
      selectedDate,
      selectedTime,
      childrenCount: 1,
      childrenAge: '5',
      photoConsent: true,
      mobile: '+421900000703',
      note: 'redirected-from-activity-child-blocked',
      accompanyingPerson: false,
    });

    expect(blocked.status).toBe(500);
    expect(blocked.body.error).toContain('Kapacita tréningu bola práve naplnená.');

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
      { booking_type: 'paid', count: 1, children_count: 3, adult_count: 0 },
      { booking_type: 'season_ticket', count: 1, children_count: 2, adult_count: 0 },
    ]);

    expect(emailService.sendUserBookingEmail).toHaveBeenCalledTimes(2);
    expect(emailService.sendAdminSeasonTicketUsage).toHaveBeenCalledTimes(1);
    expect(emailService.sendAdminNewBookingNotification).toHaveBeenCalledTimes(1);

    const userBookingEmails = new Set(emailService.sendUserBookingEmail.mock.calls.map((call) => call[0]));
    expect(userBookingEmails).toEqual(new Set([seasonTicketUser.email, paidUser.email]));
  });

  test('8. permanentka s nedostatocnym poctom vstupov vrati chybu a nevytvori child booking', async () => {
    const { trainingType, session, selectedDate, selectedTime } = await createChildSessionByAdmin({
      maxParticipants: 5,
      basePrice: 21,
    });

    const user = await createUser({
      email: 'test_child_season_ticket_not_enough_entries@example.com',
      firstName: 'Entries',
      lastName: 'Low',
    });

    const seasonTicket = await createSeasonTicketForTrainingType({
      userId: user.id,
      trainingTypeId: trainingType.id,
      entriesTotal: 5,
      entriesRemaining: 1,
    });

    const agent = await loginAsUser(user.email);
    const response = await agent.post('/api/use-season-ticket').send({
      userId: user.id,
      seasonTicketId: seasonTicket.id,
      trainingTypeId: trainingType.id,
      trainingId: session.id,
      selectedDate,
      selectedTime,
      childrenCount: 2,
      childrenAge: '6, 7',
      photoConsent: true,
      mobile: '+421900000801',
      note: 'redirected-from-activity-child-season-ticket-not-enough',
      accompanyingPerson: false,
      ageGroup: 'child',
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
    expect(ticketAfterAttempt.rows[0].entries_remaining).toBe(1);

    expect(emailService.sendUserBookingEmail).not.toHaveBeenCalled();
    expect(emailService.sendAdminSeasonTicketUsage).not.toHaveBeenCalled();
  });
});