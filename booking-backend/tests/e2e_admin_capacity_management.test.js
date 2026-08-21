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
  sendAdminSeasonTicketUsage: jest.fn().mockResolvedValue(true),
  sendAdultBookingEmail: jest.fn().mockResolvedValue(true),
  sendUserBookingEmail: jest.fn().mockResolvedValue(true),
  sendAdminNewBookingNotification: jest.fn().mockResolvedValue(true),
  sendMassCancellationEmail: jest.fn().mockResolvedValue(true),
  sendMassCancellationSeasonTicket: jest.fn().mockResolvedValue(true),
  sendMassCancellationCredit: jest.fn().mockResolvedValue(true),
}));

const emailService = require('../services/emailService');
const { app, pool: serverPool } = require('../server');

// ---------------------------------------------------------------------------
// Pomocné funkcie
// ---------------------------------------------------------------------------

async function createUser({ email, role = 'user', firstName = 'Test', lastName = 'User' }) {
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

async function getBookingById(bookingId) {
  const result = await pool.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
  return result.rows[0];
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

// Vytvorí session cez admin endpoint /api/set-training
async function createSessionByAdmin({ audienceType = 'children', maxParticipants = 5, basePrice = 14 }) {
  const unique = `${Date.now()}_${sessionCounter}`;
  const trainingTypeName = `TEST_CAP_${audienceType.toUpperCase()}_${unique}`;
  const trainingType = await createTestTrainingType(trainingTypeName, audienceType);

  // Ceny pre child_count 1..maxParticipants (dospelý = cena pri child_count 1)
  for (let childCount = 1; childCount <= Math.max(maxParticipants, 1); childCount += 1) {
    await pool.query(
      `INSERT INTO training_prices (training_type_id, child_count, price)
       VALUES ($1, $2, $3)
       ON CONFLICT (training_type_id, child_count) DO UPDATE SET price = $3`,
      [trainingType.id, childCount, basePrice * childCount]
    );
  }

  const admin = await createUser({
    email: `test_cap_admin_${unique}@example.com`,
    role: 'admin',
    firstName: 'Admin',
    lastName: 'Capacity',
  });
  const adminAgent = await loginAsUser(admin.email);

  const localDateTime = '2026-09-20T10:00';
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
    selectedDate: '2026-09-20',
    selectedTime: '10:00',
    basePrice,
    admin,
    adminAgent,
  };
}

// Rezervuje a "zaplatí" detskú rezerváciu (childrenCount detí)
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
  const childrenAge = Array.from({ length: childrenCount }, (_, index) => 5 + index).join(', ');
  const mobile = `+421900${String(100000 + Number(user.id)).slice(0, 6)}`;

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
  expect(paidBooking.booking_type).toBe('paid');

  return paidBooking;
}

// Rezervuje a "zaplatí" dospelácku rezerváciu (1 dospelý)
async function createAndPayAdultBooking({
  agent,
  user,
  trainingType,
  session,
  selectedDate,
  selectedTime,
  basePrice,
  note,
  allowDuplicate = false,
}) {
  const mobile = `+421900${String(200000 + Number(user.id)).slice(0, 6)}`;

  const createResponse = await agent.post('/api/create-adult-payment-session').send({
    userId: user.id,
    trainingId: session.id,
    trainingType: trainingType.name,
    selectedDate,
    selectedTime,
    mobile,
    note,
    allowDuplicate,
  });

  expect(createResponse.status).toBe(200);

  const pendingBooking = await getBookingById(createResponse.body.bookingId);
  expect(pendingBooking.active).toBe(false);

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
      mobile,
      note,
    },
  });

  const paidBooking = await getBookingById(createResponse.body.bookingId);
  expect(paidBooking.active).toBe(true);
  expect(paidBooking.booking_type).toBe('paid');

  return paidBooking;
}

// Počet aktívne prihlásených (rovnaká logika ako v produkčnom kóde)
async function getBookedCount(trainingId) {
  const result = await pool.query(
    `SELECT COALESCE(
       SUM(
         CASE
           WHEN COALESCE(age_group, '') = 'adult' OR COALESCE(number_of_adults, 0) > 0
             THEN COALESCE(NULLIF(number_of_adults, 0), 1)
           ELSE COALESCE(number_of_children, 0)
         END
       ),
       0
     )::int AS booked
     FROM bookings WHERE training_id = $1 AND active = true`,
    [trainingId]
  );
  return result.rows[0].booked;
}

async function getDbMaxParticipants(trainingId) {
  const result = await pool.query(
    'SELECT max_participants FROM training_availability WHERE id = $1',
    [trainingId]
  );
  return result.rows[0] ? result.rows[0].max_participants : null;
}

// ---------------------------------------------------------------------------
// Testy
// ---------------------------------------------------------------------------

describe('E2E - Admin capacity management (max_participants)', () => {
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

  // ===================== AUTORIZÁCIA =====================

  test('1. neprihlásený user nemôže meniť kapacitu (401)', async () => {
    const { session } = await createSessionByAdmin({ audienceType: 'children', maxParticipants: 5 });

    const response = await request(app)
      .put(`/api/admin/training-sessions/${session.id}/capacity`)
      .send({ newCapacity: 10 });

    expect(response.status).toBe(401);
  });

  test('2. bežný user (nie admin) nemôže meniť kapacitu (403)', async () => {
    const { session } = await createSessionByAdmin({ audienceType: 'children', maxParticipants: 5 });

    const user = await createUser({
      email: 'test_cap_regular_user@example.com',
      role: 'user',
    });
    const userAgent = await loginAsUser(user.email);

    const response = await userAgent
      .put(`/api/admin/training-sessions/${session.id}/capacity`)
      .send({ newCapacity: 10 });

    expect(response.status).toBe(403);
    // Kapacita sa nesmie zmeniť
    expect(await getDbMaxParticipants(session.id)).toBe(5);
  });

  // ===================== VALIDÁCIA newCapacity =====================

  test('3. chýbajúce newCapacity → 400', async () => {
    const { session, adminAgent } = await createSessionByAdmin({ audienceType: 'children', maxParticipants: 5 });

    const response = await adminAgent
      .put(`/api/admin/training-sessions/${session.id}/capacity`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('väčšie alebo rovné 1');
    expect(await getDbMaxParticipants(session.id)).toBe(5);
  });

  test('4. newCapacity = 0 → 400', async () => {
    const { session, adminAgent } = await createSessionByAdmin({ audienceType: 'children', maxParticipants: 5 });

    const response = await adminAgent
      .put(`/api/admin/training-sessions/${session.id}/capacity`)
      .send({ newCapacity: 0 });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('väčšie alebo rovné 1');
    expect(await getDbMaxParticipants(session.id)).toBe(5);
  });

  test('5. newCapacity = -5 → 400', async () => {
    const { session, adminAgent } = await createSessionByAdmin({ audienceType: 'children', maxParticipants: 5 });

    const response = await adminAgent
      .put(`/api/admin/training-sessions/${session.id}/capacity`)
      .send({ newCapacity: -5 });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('väčšie alebo rovné 1');
    expect(await getDbMaxParticipants(session.id)).toBe(5);
  });

  test('6. newCapacity = "abc" (nečíselný string) → 400', async () => {
    const { session, adminAgent } = await createSessionByAdmin({ audienceType: 'children', maxParticipants: 5 });

    const response = await adminAgent
      .put(`/api/admin/training-sessions/${session.id}/capacity`)
      .send({ newCapacity: 'abc' });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('väčšie alebo rovné 1');
    expect(await getDbMaxParticipants(session.id)).toBe(5);
  });

  // ===================== EXISTENCIA SESSION =====================

  test('7. neexistujúce training session id → 404', async () => {
    const { adminAgent } = await createSessionByAdmin({ audienceType: 'children', maxParticipants: 5 });

    const response = await adminAgent
      .put('/api/admin/training-sessions/999999999/capacity')
      .send({ newCapacity: 10 });

    expect(response.status).toBe(404);
    expect(response.body.error).toContain('not found');
  });

  // ===================== POZITÍVNE UPDATE (prázdna session) =====================

  test('8. admin zvýši kapacitu prázdnej session → 200, DB sa aktualizuje, response tvar', async () => {
    const { session, adminAgent } = await createSessionByAdmin({ audienceType: 'children', maxParticipants: 5 });

    const response = await adminAgent
      .put(`/api/admin/training-sessions/${session.id}/capacity`)
      .send({ newCapacity: 12 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Number(response.body.trainingId)).toBe(session.id);
    expect(response.body.max_participants).toBe(12);
    expect(response.body.bookedParticipants).toBe(0);
    expect(await getDbMaxParticipants(session.id)).toBe(12);
  });

  test('9. admin zníži kapacitu prázdnej session → 200', async () => {
    const { session, adminAgent } = await createSessionByAdmin({ audienceType: 'children', maxParticipants: 10 });

    const response = await adminAgent
      .put(`/api/admin/training-sessions/${session.id}/capacity`)
      .send({ newCapacity: 3 });

    expect(response.status).toBe(200);
    expect(response.body.max_participants).toBe(3);
    expect(await getDbMaxParticipants(session.id)).toBe(3);
  });

  // ===================== CHILD SESSION - plná kapacita → admin zvýši → prejde =====================

  test('10. detská session: kapacita 2, 2 deti, 3. zablokovaný; admin zvýši na 3 → 3. prejde', async () => {
    const { trainingType, session, selectedDate, selectedTime, basePrice, adminAgent } =
      await createSessionByAdmin({ audienceType: 'children', maxParticipants: 2, basePrice: 14 });

    const child1 = await createUser({ email: 'test_cap_child_1@example.com', firstName: 'Child', lastName: 'One' });
    const child2 = await createUser({ email: 'test_cap_child_2@example.com', firstName: 'Child', lastName: 'Two' });
    const child3 = await createUser({ email: 'test_cap_child_3@example.com', firstName: 'Child', lastName: 'Three' });

    const agent1 = await loginAsUser(child1.email);
    const agent2 = await loginAsUser(child2.email);
    const agent3 = await loginAsUser(child3.email);

    await createAndPayChildBooking({
      agent: agent1, user: child1, trainingType, session, selectedDate, selectedTime,
      childrenCount: 1, totalPrice: basePrice, note: 'cap-child-1',
    });
    await createAndPayChildBooking({
      agent: agent2, user: child2, trainingType, session, selectedDate, selectedTime,
      childrenCount: 1, totalPrice: basePrice, note: 'cap-child-2',
    });

    // Kapacita je plná → tretí user je zablokovaný
    const blocked = await agent3.post('/api/create-payment-session').send({
      userId: child3.id,
      trainingId: session.id,
      trainingType: trainingType.name,
      selectedDate,
      selectedTime,
      childrenCount: 1,
      childrenAge: '5',
      photoConsent: true,
      mobile: '+421900333333',
      note: 'cap-child-3',
      accompanyingPerson: false,
    });

    expect(blocked.status).toBe(500);
    expect(blocked.body.error).toContain('Kapacita tréningu bola práve naplnená.');

    // Admin zvýši kapacitu na 3
    const updateResponse = await adminAgent
      .put(`/api/admin/training-sessions/${session.id}/capacity`)
      .send({ newCapacity: 3 });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.bookedParticipants).toBe(2);
    expect(await getDbMaxParticipants(session.id)).toBe(3);

    // Teraz tretí user prejde
    const paid = await createAndPayChildBooking({
      agent: agent3, user: child3, trainingType, session, selectedDate, selectedTime,
      childrenCount: 1, totalPrice: basePrice, note: 'cap-child-3-after',
    });

    expect(paid.active).toBe(true);
    expect(await getBookedCount(session.id)).toBe(3);
  });

  test('11. detská session: admin nemôže znížiť kapacitu pod počet prihlásených (400 + správa)', async () => {
    const { trainingType, session, selectedDate, selectedTime, basePrice, adminAgent } =
      await createSessionByAdmin({ audienceType: 'children', maxParticipants: 5, basePrice: 15 });

    const user = await createUser({ email: 'test_cap_child_lower@example.com', firstName: 'Child', lastName: 'Lower' });
    const agent = await loginAsUser(user.email);

    await createAndPayChildBooking({
      agent, user, trainingType, session, selectedDate, selectedTime,
      childrenCount: 2, totalPrice: basePrice * 2, note: 'cap-child-lower',
    });

    expect(await getBookedCount(session.id)).toBe(2);

    const response = await adminAgent
      .put(`/api/admin/training-sessions/${session.id}/capacity`)
      .send({ newCapacity: 1 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Nová kapacita nemôže byť menšia ako počet už prihlásených.');
    expect(await getDbMaxParticipants(session.id)).toBe(5);
  });

  test('12. detská session: viac detí v jednej rezervácii sa počíta do kapacity', async () => {
    const { trainingType, session, selectedDate, selectedTime, basePrice, adminAgent } =
      await createSessionByAdmin({ audienceType: 'children', maxParticipants: 5, basePrice: 13 });

    const parent1 = await createUser({ email: 'test_cap_parent_1@example.com', firstName: 'Parent', lastName: 'One' });
    const parent2 = await createUser({ email: 'test_cap_parent_2@example.com', firstName: 'Parent', lastName: 'Two' });

    const agent1 = await loginAsUser(parent1.email);
    const agent2 = await loginAsUser(parent2.email);

    // 3 deti v jednej rezervácii + 2 deti v druhej = 5 (plná kapacita)
    await createAndPayChildBooking({
      agent: agent1, user: parent1, trainingType, session, selectedDate, selectedTime,
      childrenCount: 3, totalPrice: basePrice * 3, note: 'cap-parent-1',
    });
    await createAndPayChildBooking({
      agent: agent2, user: parent2, trainingType, session, selectedDate, selectedTime,
      childrenCount: 2, totalPrice: basePrice * 2, note: 'cap-parent-2',
    });

    expect(await getBookedCount(session.id)).toBe(5);

    // Znížiť na 4 nemôže (5 prihlásených)
    const tooLow = await adminAgent
      .put(`/api/admin/training-sessions/${session.id}/capacity`)
      .send({ newCapacity: 4 });

    expect(tooLow.status).toBe(400);
    expect(tooLow.body.error).toBe('Nová kapacita nemôže byť menšia ako počet už prihlásených.');

    // Zvýšiť na 6 môže
    const raise = await adminAgent
      .put(`/api/admin/training-sessions/${session.id}/capacity`)
      .send({ newCapacity: 6 });

    expect(raise.status).toBe(200);
    expect(raise.body.bookedParticipants).toBe(5);
    expect(await getDbMaxParticipants(session.id)).toBe(6);
  });

  test('13. detská session: kapacita rovná počtu prihlásených je povolená (nie striktne menej)', async () => {
    const { trainingType, session, selectedDate, selectedTime, basePrice, adminAgent } =
      await createSessionByAdmin({ audienceType: 'children', maxParticipants: 3, basePrice: 14 });

    const user = await createUser({ email: 'test_cap_child_equal@example.com', firstName: 'Child', lastName: 'Equal' });
    const agent = await loginAsUser(user.email);

    await createAndPayChildBooking({
      agent, user, trainingType, session, selectedDate, selectedTime,
      childrenCount: 2, totalPrice: basePrice * 2, note: 'cap-child-equal',
    });

    expect(await getBookedCount(session.id)).toBe(2);

    const response = await adminAgent
      .put(`/api/admin/training-sessions/${session.id}/capacity`)
      .send({ newCapacity: 2 });

    expect(response.status).toBe(200);
    expect(response.body.max_participants).toBe(2);
    expect(await getDbMaxParticipants(session.id)).toBe(2);

    // Session je teraz plná (kapacita 2, 2 prihlásení) → ďalší zablokovaný
    const blocked = await agent.post('/api/create-payment-session').send({
      userId: user.id,
      trainingId: session.id,
      trainingType: trainingType.name,
      selectedDate,
      selectedTime,
      childrenCount: 1,
      childrenAge: '5',
      photoConsent: true,
      mobile: '+421900999999',
      note: 'cap-child-equal-blocked',
      accompanyingPerson: false,
      allowDuplicate: true,
    });

    expect(blocked.status).toBe(500);
    expect(blocked.body.error).toContain('Kapacita tréningu bola práve naplnená.');
  });

  // ===================== ADULT SESSION - plná kapacita → admin zvýši → prejde =====================

  test('14. dospelácka session: kapacita 2, 2 dospelí, 3. zablokovaný; admin zvýši na 3 → 3. prejde', async () => {
    const { trainingType, session, selectedDate, selectedTime, basePrice, adminAgent } =
      await createSessionByAdmin({ audienceType: 'adults', maxParticipants: 2, basePrice: 16 });

    const adult1 = await createUser({ email: 'test_cap_adult_1@example.com', firstName: 'Adult', lastName: 'One' });
    const adult2 = await createUser({ email: 'test_cap_adult_2@example.com', firstName: 'Adult', lastName: 'Two' });
    const adult3 = await createUser({ email: 'test_cap_adult_3@example.com', firstName: 'Adult', lastName: 'Three' });

    const agent1 = await loginAsUser(adult1.email);
    const agent2 = await loginAsUser(adult2.email);
    const agent3 = await loginAsUser(adult3.email);

    await createAndPayAdultBooking({
      agent: agent1, user: adult1, trainingType, session, selectedDate, selectedTime,
      basePrice, note: 'cap-adult-1',
    });
    await createAndPayAdultBooking({
      agent: agent2, user: adult2, trainingType, session, selectedDate, selectedTime,
      basePrice, note: 'cap-adult-2',
    });

    // Kapacita plná → tretí dospelý zablokovaný
    const blocked = await agent3.post('/api/create-adult-payment-session').send({
      userId: adult3.id,
      trainingId: session.id,
      trainingType: trainingType.name,
      selectedDate,
      selectedTime,
      mobile: '+421900444444',
      note: 'cap-adult-3',
    });

    expect(blocked.status).toBe(500);
    expect(blocked.body.error).toContain('Kapacita tréningu bola práve naplnená.');

    // Admin zvýši kapacitu
    const updateResponse = await adminAgent
      .put(`/api/admin/training-sessions/${session.id}/capacity`)
      .send({ newCapacity: 3 });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.bookedParticipants).toBe(2);
    expect(await getDbMaxParticipants(session.id)).toBe(3);

    // Tretí dospelý teraz prejde
    const paid = await createAndPayAdultBooking({
      agent: agent3, user: adult3, trainingType, session, selectedDate, selectedTime,
      basePrice, note: 'cap-adult-3-after',
    });

    expect(paid.active).toBe(true);
    expect(await getBookedCount(session.id)).toBe(3);
  });

  test('15. dospelácka session: admin nemôže znížiť kapacitu pod počet prihlásených', async () => {
    const { trainingType, session, selectedDate, selectedTime, basePrice, adminAgent } =
      await createSessionByAdmin({ audienceType: 'adults', maxParticipants: 4, basePrice: 17 });

    for (let i = 1; i <= 3; i += 1) {
      const user = await createUser({
        email: `test_cap_adult_lower_${i}@example.com`,
        firstName: 'Adult',
        lastName: `Lower${i}`,
      });
      const agent = await loginAsUser(user.email);
      await createAndPayAdultBooking({
        agent, user, trainingType, session, selectedDate, selectedTime,
        basePrice, note: `cap-adult-lower-${i}`,
      });
    }

    expect(await getBookedCount(session.id)).toBe(3);

    const response = await adminAgent
      .put(`/api/admin/training-sessions/${session.id}/capacity`)
      .send({ newCapacity: 2 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Nová kapacita nemôže byť menšia ako počet už prihlásených.');
    expect(await getDbMaxParticipants(session.id)).toBe(4);
  });

  test('16. dospelácka session: check-availability počíta dospelých ako 1 (nie ako deti)', async () => {
    const { trainingType, session, selectedDate, selectedTime, basePrice } =
      await createSessionByAdmin({ audienceType: 'adults', maxParticipants: 2, basePrice: 18 });

    const adult = await createUser({ email: 'test_cap_adult_count@example.com', firstName: 'Adult', lastName: 'Count' });
    const agent = await loginAsUser(adult.email);

    await createAndPayAdultBooking({
      agent, user: adult, trainingType, session, selectedDate, selectedTime,
      basePrice, note: 'cap-adult-count',
    });

    const availabilityResponse = await request(app)
      .get('/api/check-availability')
      .query({ trainingId: session.id, childrenCount: 1 });

    expect(availabilityResponse.status).toBe(200);
    // 1 dospelý = 1 miesto (nie 0 detí)
    expect(availabilityResponse.body.bookedChildren).toBe(1);
    expect(availabilityResponse.body.remainingSpots).toBe(1);
    expect(availabilityResponse.body.available).toBe(true);
  });

  // ===================== SÚHRNÉ OVERENIA =====================

  test('17. response.bookedParticipants zodpovedá skutočnému počtu prihlásených (detská session)', async () => {
    const { trainingType, session, selectedDate, selectedTime, basePrice, adminAgent } =
      await createSessionByAdmin({ audienceType: 'children', maxParticipants: 4, basePrice: 12 });

    const parent = await createUser({ email: 'test_cap_booked_count@example.com', firstName: 'Parent', lastName: 'Count' });
    const agent = await loginAsUser(parent.email);

    await createAndPayChildBooking({
      agent, user: parent, trainingType, session, selectedDate, selectedTime,
      childrenCount: 3, totalPrice: basePrice * 3, note: 'cap-booked-count',
    });

    const response = await adminAgent
      .put(`/api/admin/training-sessions/${session.id}/capacity`)
      .send({ newCapacity: 4 });

    expect(response.status).toBe(200);
    expect(response.body.bookedParticipants).toBe(3);
    expect(await getBookedCount(session.id)).toBe(3);
  });

  test('18. zvýšenie kapacity neovplyvní existujúce rezervácie', async () => {
    const { trainingType, session, selectedDate, selectedTime, basePrice, adminAgent } =
      await createSessionByAdmin({ audienceType: 'children', maxParticipants: 2, basePrice: 14 });

    const user = await createUser({ email: 'test_cap_intact@example.com', firstName: 'Child', lastName: 'Intact' });
    const agent = await loginAsUser(user.email);

    const paid = await createAndPayChildBooking({
      agent, user, trainingType, session, selectedDate, selectedTime,
      childrenCount: 1, totalPrice: basePrice, note: 'cap-intact',
    });

    const updateResponse = await adminAgent
      .put(`/api/admin/training-sessions/${session.id}/capacity`)
      .send({ newCapacity: 10 });

    expect(updateResponse.status).toBe(200);

    const after = await getBookingById(paid.id);
    expect(after.active).toBe(true);
    expect(after.booking_type).toBe('paid');
    expect(Number(after.number_of_children)).toBe(1);

    const bookingsCount = await pool.query(
      `SELECT COUNT(*)::int AS count FROM bookings WHERE training_id = $1 AND active = true`,
      [session.id]
    );
    expect(bookingsCount.rows[0].count).toBe(1);
  });
});
