const request = require('supertest');
const bcrypt = require('bcryptjs');
const {
  cleanupTestData,
  createTestTrainingType,
  pool,
} = require('./setup');

let stripeCounter = 0;

const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  },
  refunds: {
    create: jest.fn(),
  },
  paymentIntents: {
    retrieve: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
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
  sendCancellationEmails: jest.fn().mockResolvedValue(true),
  sendMassCancellationEmail: jest.fn().mockResolvedValue(true),
  sendMassCancellationCredit: jest.fn().mockResolvedValue(true),
  sendMassCancellationSeasonTicket: jest.fn().mockResolvedValue(true),
  sendRefundConfirmationEmail: jest.fn().mockResolvedValue(true),
  sendAdminCreditUsage: jest.fn().mockResolvedValue(true),
  sendContactFormEmails: jest.fn().mockResolvedValue(true),
  sendAccountDeletionEmails: jest.fn().mockResolvedValue(true),
  sendAccountDeletedEmail: jest.fn().mockResolvedValue(true),
  sendAdminAccountDeleteNotification: jest.fn().mockResolvedValue(true),
}));

const { app, pool: serverPool } = require('../server');

function resetStripeMocks() {
  mockStripe.refunds.create.mockImplementation(async () => {
    stripeCounter += 1;
    return {
      id: `test_refund_user_profile_${Date.now()}_${stripeCounter}`,
      status: 'succeeded',
    };
  });

  mockStripe.webhooks.constructEvent.mockImplementation((payload) => {
    if (Buffer.isBuffer(payload)) return JSON.parse(payload.toString('utf8'));
    if (typeof payload === 'string') return JSON.parse(payload);
    return payload;
  });
}

async function createVerifiedUser(email, role = 'user', password = 'TestPass123!') {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password, address, mobile, verified, role)
     VALUES ($1, $2, $3, $4, $5, $6, true, $7)
     ON CONFLICT (email) DO UPDATE SET password = $4, verified = true, role = $7
     RETURNING *`,
    ['Test', 'Profile', email, hashedPassword, 'Old Address 10, 94901 Nitra', '+421900000000', role]
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

async function createTraining({ name, audienceType = 'children', hoursFromNow = 24, maxParticipants = 10, cancelled = false }) {
  const trainingType = await createTestTrainingType(name, audienceType);
  const result = await pool.query(
    `INSERT INTO training_availability (training_type_id, training_type, training_date, max_participants, cancelled)
     VALUES ($1, $2, NOW() + ($3 || ' hours')::interval, $4, $5)
     RETURNING *`,
    [trainingType.id, trainingType.name, String(hoursFromNow), maxParticipants, cancelled]
  );

  return { trainingType, training: result.rows[0] };
}

async function createPaidBooking({ userId, trainingId, numberOfChildren = 1, numberOfAdults = 0, hoursFromNow = 24, amountPaid = 15 }) {
  const trainingResult = await pool.query(
    `UPDATE training_availability
     SET training_date = NOW() + ($2 || ' hours')::interval
     WHERE id = $1
     RETURNING *`,
    [trainingId, String(hoursFromNow)]
  );

  const ageGroup = numberOfAdults > 0 ? 'adult' : 'children';
  const result = await pool.query(
    `INSERT INTO bookings
       (user_id, training_id, number_of_children, number_of_adults, amount_paid,
        payment_intent_id, payment_time, session_id, booked_at, active, booking_type, age_group)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, NOW(), true, 'paid', $8)
     RETURNING *`,
    [
      userId,
      trainingId,
      numberOfChildren,
      numberOfAdults,
      amountPaid,
      `test_pi_user_profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      `test_sess_user_profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ageGroup,
    ]
  );

  return { booking: result.rows[0], training: trainingResult.rows[0] };
}

async function createCredit({ userId, trainingId, trainingType, status = 'active' }) {
  const trainingDateResult = await pool.query('SELECT training_date FROM training_availability WHERE id = $1', [trainingId]);
  const trainingDate = trainingDateResult.rows[0].training_date;

  const result = await pool.query(
    `INSERT INTO credits
      (user_id, session_id, child_count, accompanying_person, children_ages, photo_consent, mobile, note,
       training_type, original_date, reason, status, created_at, used_at)
     VALUES ($1, $2, 1, false, '5', false, '', '', $3, $4, 'test credit', $5, NOW(), $6)
     RETURNING *`,
    [userId, trainingId, trainingType, trainingDate, status, status === 'used' ? new Date() : null]
  );

  return result.rows[0];
}

async function createCreditBooking({ userId, trainingId, creditId }) {
  const result = await pool.query(
    `INSERT INTO bookings
      (user_id, training_id, number_of_children, amount_paid, booked_at, active, booking_type, credit_id, age_group)
     VALUES ($1, $2, 1, 0, NOW(), true, 'credit', $3, 'children')
     RETURNING *`,
    [userId, trainingId, creditId]
  );

  return result.rows[0];
}

async function createSeasonTicketProductWithTicket({ userId, trainingTypeId, entriesRemaining = 5 }) {
  const code = `test_userprofile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const productResult = await pool.query(
    `INSERT INTO season_ticket_products (name, code, active)
     VALUES ($1, $2, true)
     RETURNING *`,
    [`Test Product ${code}`, code]
  );
  const productId = productResult.rows[0].id;

  await pool.query(
    `INSERT INTO season_ticket_product_training_types (season_ticket_product_id, training_type_id)
     VALUES ($1, $2)`,
    [productId, trainingTypeId]
  );

  const ticketResult = await pool.query(
    `INSERT INTO season_tickets
      (user_id, season_ticket_product_id, entries_total, entries_remaining, purchase_date, expiry_date, stripe_payment_id, amount_paid, payment_time)
     VALUES ($1, $2, 5, $3, NOW(), NOW() + interval '6 months', $4, 60.00, NOW())
     RETURNING *`,
    [userId, productId, entriesRemaining, `test_st_profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`]
  );

  return { product: productResult.rows[0], ticket: ticketResult.rows[0] };
}

async function createSeasonTicketBooking({ userId, trainingId, seasonTicketId, numberOfChildren = 1 }) {
  const trainingTypeResult = await pool.query(
    'SELECT training_type_id FROM training_availability WHERE id = $1',
    [trainingId]
  );

  const bookingResult = await pool.query(
    `INSERT INTO bookings
      (user_id, training_id, number_of_children, amount_paid, booked_at, active, booking_type, age_group)
     VALUES ($1, $2, $3, 0, NOW(), true, 'season_ticket', 'children')
     RETURNING *`,
    [userId, trainingId, numberOfChildren]
  );

  await pool.query(
    `INSERT INTO season_ticket_usage (season_ticket_id, booking_id, training_type_id, created_at, used_date)
     VALUES ($1, $2, $3, NOW(), NOW())`,
    [seasonTicketId, bookingResult.rows[0].id, trainingTypeResult.rows[0].training_type_id]
  );

  await pool.query(
    'UPDATE season_tickets SET entries_remaining = entries_remaining - $1 WHERE id = $2',
    [numberOfChildren, seasonTicketId]
  );

  return bookingResult.rows[0];
}

describe('E2E - UserProfile processes', () => {
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

  describe('User profile and account processes', () => {
    test('fetches user profile and updates own address/mobile', async () => {
      const user = await createVerifiedUser('test_userprofile_1@example.com');
      const otherUser = await createVerifiedUser('test_userprofile_1_other@example.com');
      const agent = await loginAs(user.email);

      const getRes = await agent.get(`/api/users/${user.id}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.email).toBe(user.email);

      const updateRes = await agent.put(`/api/users/${user.id}`).send({
        address: 'Nova 45, 949 01 Nitra',
        mobile: '+421900111222',
      });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.user.address).toContain('Nitra');
      expect(updateRes.body.user.mobile).toBe('+421900111222');

      const forbiddenRes = await agent.put(`/api/users/${otherUser.id}`).send({
        address: 'Hacker Address',
        mobile: '+421999999999',
      });
      expect(forbiddenRes.status).toBe(403);
    });

    test('verifies password (success and failure)', async () => {
      const user = await createVerifiedUser('test_userprofile_2@example.com');
      const agent = await loginAs(user.email);

      const okRes = await agent.post('/api/verify-password').send({ password: 'TestPass123!' });
      expect(okRes.status).toBe(200);
      expect(okRes.body.success).toBe(true);

      const failRes = await agent.post('/api/verify-password').send({ password: 'WrongPass999' });
      expect(failRes.status).toBe(400);
      expect(failRes.body.error).toContain('Incorrect password');
    });

    test('returns own season tickets and blocks access to another user', async () => {
      const user = await createVerifiedUser('test_userprofile_3@example.com');
      const otherUser = await createVerifiedUser('test_userprofile_3_other@example.com');
      const { trainingType } = await createTraining({ name: 'TEST_UP_ST_3', audienceType: 'children' });
      await createSeasonTicketProductWithTicket({ userId: user.id, trainingTypeId: trainingType.id, entriesRemaining: 4 });

      const agent = await loginAs(user.email);
      const ownTicketsRes = await agent.get(`/api/season-tickets/${user.id}`);
      expect(ownTicketsRes.status).toBe(200);
      expect(Array.isArray(ownTicketsRes.body)).toBe(true);
      expect(ownTicketsRes.body.length).toBe(1);

      const forbiddenRes = await agent.get(`/api/season-tickets/${otherUser.id}`);
      expect(forbiddenRes.status).toBe(403);
    });

    test('lists only active bookings for user profile', async () => {
      const user = await createVerifiedUser('test_userprofile_4@example.com');
      const { training: trainingA } = await createTraining({ name: 'TEST_UP_BK_4_A', audienceType: 'children', hoursFromNow: 24 });
      const { training: trainingB } = await createTraining({ name: 'TEST_UP_BK_4_B', audienceType: 'children', hoursFromNow: 48 });
      const agent = await loginAs(user.email);

      await pool.query(
        `INSERT INTO bookings
          (user_id, training_id, number_of_children, amount_paid, payment_intent_id, payment_time, booked_at, active, booking_type, age_group)
         VALUES ($1, $2, 1, 15.00, $3, NOW(), NOW(), true, 'paid', 'children')`,
        [user.id, trainingA.id, `test_pi_active_${Date.now()}`]
      );

      await pool.query(
        `INSERT INTO bookings
          (user_id, training_id, number_of_children, amount_paid, payment_intent_id, payment_time, booked_at, active, booking_type, age_group)
         VALUES ($1, $2, 1, 15.00, $3, NOW(), NOW(), false, 'paid', 'children')`,
        [user.id, trainingB.id, `test_pi_inactive_${Date.now()}`]
      );

      const res = await agent.get(`/api/bookings/user/${user.id}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].active).toBe(true);
    });

    test('resolves booking type for paid, credit and season-ticket bookings', async () => {
      const user = await createVerifiedUser('test_userprofile_5@example.com');
      const { trainingType, training } = await createTraining({ name: 'TEST_UP_TYPE_5', audienceType: 'children' });
      const agent = await loginAs(user.email);

      const { booking: paidBooking } = await createPaidBooking({ userId: user.id, trainingId: training.id });
      const paidRes = await agent.get(`/api/bookings/${paidBooking.id}/type`);
      expect(paidRes.status).toBe(200);
      expect(paidRes.body.bookingType).toBe('paid');

      const credit = await createCredit({ userId: user.id, trainingId: training.id, trainingType: trainingType.name, status: 'used' });
      const creditBooking = await createCreditBooking({ userId: user.id, trainingId: training.id, creditId: credit.id });
      const creditRes = await agent.get(`/api/bookings/${creditBooking.id}/type`);
      expect(creditRes.status).toBe(200);
      expect(creditRes.body.bookingType).toBe('credit');

      const { ticket } = await createSeasonTicketProductWithTicket({ userId: user.id, trainingTypeId: trainingType.id, entriesRemaining: 4 });
      const seasonBooking = await createSeasonTicketBooking({ userId: user.id, trainingId: training.id, seasonTicketId: ticket.id, numberOfChildren: 1 });
      const seasonRes = await agent.get(`/api/bookings/${seasonBooking.id}/type`);
      expect(seasonRes.status).toBe(200);
      expect(seasonRes.body.bookingType).toBe('season_ticket');
    });

    test('returns replacement sessions and replaces booking to another session', async () => {
      const user = await createVerifiedUser('test_userprofile_6@example.com');
      const { trainingType, training: source } = await createTraining({ name: 'TEST_UP_REPL_6', audienceType: 'children', hoursFromNow: 36, maxParticipants: 3 });
      const targetResult = await pool.query(
        `INSERT INTO training_availability (training_type_id, training_type, training_date, max_participants)
         VALUES ($1, $2, NOW() + interval '60 hours', 3)
         RETURNING *`,
        [trainingType.id, trainingType.name]
      );
      const target = targetResult.rows[0];
      const agent = await loginAs(user.email);

      const { booking } = await createPaidBooking({ userId: user.id, trainingId: source.id, numberOfChildren: 1, numberOfAdults: 0, hoursFromNow: 36 });

      const replacementsRes = await agent.get(`/api/replacement-sessions/${booking.id}`);
      expect(replacementsRes.status).toBe(200);
      expect(replacementsRes.body.some((r) => r.id === target.id)).toBe(true);

      const replaceRes = await agent.post(`/api/replace-booking/${booking.id}`).send({ newTrainingId: target.id });
      expect(replaceRes.status).toBe(200);
      expect(replaceRes.body.message).toContain('replaced');

      const dbBooking = await pool.query('SELECT training_id FROM bookings WHERE id = $1', [booking.id]);
      expect(dbBooking.rows[0].training_id).toBe(target.id);
    });

    test('fails replacing booking when target session has no capacity', async () => {
      const user = await createVerifiedUser('test_userprofile_7@example.com');
      const otherUser = await createVerifiedUser('test_userprofile_7_other@example.com');
      const { trainingType, training: source } = await createTraining({ name: 'TEST_UP_REPL_7', audienceType: 'children', hoursFromNow: 40, maxParticipants: 2 });
      const fullTargetResult = await pool.query(
        `INSERT INTO training_availability (training_type_id, training_type, training_date, max_participants)
         VALUES ($1, $2, NOW() + interval '64 hours', 1)
         RETURNING *`,
        [trainingType.id, trainingType.name]
      );
      const fullTarget = fullTargetResult.rows[0];

      await createPaidBooking({ userId: otherUser.id, trainingId: fullTarget.id, numberOfChildren: 1, numberOfAdults: 0, hoursFromNow: 64 });
      const { booking } = await createPaidBooking({ userId: user.id, trainingId: source.id, numberOfChildren: 1, numberOfAdults: 0, hoursFromNow: 40 });
      const agent = await loginAs(user.email);

      const res = await agent.post(`/api/replace-booking/${booking.id}`).send({ newTrainingId: fullTarget.id });
      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Not enough spots');
    });

    test('cancels paid booking with refund path', async () => {
      const user = await createVerifiedUser('test_userprofile_8@example.com');
      const { training } = await createTraining({ name: 'TEST_UP_CANCEL_REFUND_8', audienceType: 'children', hoursFromNow: 30 });
      const { booking } = await createPaidBooking({ userId: user.id, trainingId: training.id, hoursFromNow: 30, amountPaid: 20 });
      const agent = await loginAs(user.email);

      const res = await agent.delete(`/api/bookings/${booking.id}`).send({});
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.refundProcessed).toBe(true);
      expect(res.body.creditIssued).toBe(false);
      expect(mockStripe.refunds.create).toHaveBeenCalledTimes(1);

      const bookingDb = await pool.query('SELECT * FROM bookings WHERE id = $1', [booking.id]);
      expect(bookingDb.rows.length).toBe(0);
    });

    test('cancels paid booking and issues credit when requestCredit=true', async () => {
      const user = await createVerifiedUser('test_userprofile_9@example.com');
      const { training, trainingType } = await createTraining({ name: 'TEST_UP_CANCEL_CREDIT_9', audienceType: 'children', hoursFromNow: 28 });
      const { booking } = await createPaidBooking({ userId: user.id, trainingId: training.id, hoursFromNow: 28, amountPaid: 18 });
      const agent = await loginAs(user.email);

      const res = await agent.delete(`/api/bookings/${booking.id}`).send({ requestCredit: true });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.creditIssued).toBe(true);

      const creditDb = await pool.query(
        `SELECT * FROM credits WHERE user_id = $1 AND training_type = $2 ORDER BY id DESC LIMIT 1`,
        [user.id, trainingType.name]
      );
      expect(creditDb.rows.length).toBe(1);
      expect(creditDb.rows[0].status).toBe('active');
    });

    test('cancels credit booking and reactivates used credit', async () => {
      const user = await createVerifiedUser('test_userprofile_10@example.com');
      const { trainingType, training } = await createTraining({ name: 'TEST_UP_CANCEL_RETURN_CREDIT_10', audienceType: 'children', hoursFromNow: 26 });
      const credit = await createCredit({ userId: user.id, trainingId: training.id, trainingType: trainingType.name, status: 'used' });
      const creditBooking = await createCreditBooking({ userId: user.id, trainingId: training.id, creditId: credit.id });
      const agent = await loginAs(user.email);

      const res = await agent.delete(`/api/bookings/${creditBooking.id}`).send({});
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const creditDb = await pool.query('SELECT status, used_at FROM credits WHERE id = $1', [credit.id]);
      expect(creditDb.rows[0].status).toBe('active');
      expect(creditDb.rows[0].used_at).toBeNull();
    });

    test('cancels season-ticket booking and returns entries', async () => {
      const user = await createVerifiedUser('test_userprofile_11@example.com');
      const { trainingType, training } = await createTraining({ name: 'TEST_UP_CANCEL_RETURN_ST_11', audienceType: 'children', hoursFromNow: 30 });
      const { ticket } = await createSeasonTicketProductWithTicket({ userId: user.id, trainingTypeId: trainingType.id, entriesRemaining: 5 });
      const seasonBooking = await createSeasonTicketBooking({ userId: user.id, trainingId: training.id, seasonTicketId: ticket.id, numberOfChildren: 2 });
      const agent = await loginAs(user.email);

      const beforeTicket = await pool.query('SELECT entries_remaining FROM season_tickets WHERE id = $1', [ticket.id]);
      expect(beforeTicket.rows[0].entries_remaining).toBe(3);

      const res = await agent.delete(`/api/bookings/${seasonBooking.id}`).send({});
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const afterTicket = await pool.query('SELECT entries_remaining FROM season_tickets WHERE id = $1', [ticket.id]);
      expect(afterTicket.rows[0].entries_remaining).toBe(5);

      const usageDb = await pool.query('SELECT * FROM season_ticket_usage WHERE booking_id = $1', [seasonBooking.id]);
      expect(usageDb.rows.length).toBe(0);
    });

    test('blocks cancellation within 10 hours rule', async () => {
      const user = await createVerifiedUser('test_userprofile_12@example.com');
      const { training } = await createTraining({ name: 'TEST_UP_CANCEL_10H_12', audienceType: 'children', hoursFromNow: 5 });
      const { booking } = await createPaidBooking({ userId: user.id, trainingId: training.id, hoursFromNow: 5, amountPaid: 15 });
      const agent = await loginAs(user.email);

      const res = await agent.delete(`/api/bookings/${booking.id}`).send({});
      expect(res.status).toBe(500);
      expect(res.body.error).toContain('10 hours');

      const bookingDb = await pool.query('SELECT * FROM bookings WHERE id = $1', [booking.id]);
      expect(bookingDb.rows.length).toBe(1);
    });

    test('deletes own account after password verification flow', async () => {
      const user = await createVerifiedUser('test_userprofile_13@example.com');
      const agent = await loginAs(user.email);

      const verifyRes = await agent.post('/api/verify-password').send({ password: 'TestPass123!' });
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);

      const deleteRes = await agent.delete(`/api/users/${user.id}`);
      expect(deleteRes.status).toBe(200);

      const userDb = await pool.query('SELECT * FROM users WHERE id = $1', [user.id]);
      expect(userDb.rows.length).toBe(0);
    });
  });

  describe('Admin processes used in UserProfile', () => {
    test('admin can list bookings and season tickets', async () => {
      const admin = await createVerifiedUser('test_userprofile_admin_1@example.com', 'admin');
      const user = await createVerifiedUser('test_userprofile_admin_1_user@example.com');
      const { trainingType, training } = await createTraining({ name: 'TEST_UP_ADMIN_LIST_1', audienceType: 'children', hoursFromNow: 22 });

      await createPaidBooking({ userId: user.id, trainingId: training.id, hoursFromNow: 22, amountPaid: 15 });
      await createSeasonTicketProductWithTicket({ userId: user.id, trainingTypeId: trainingType.id, entriesRemaining: 3 });

      const adminAgent = await loginAs(admin.email);

      const bookingsRes = await adminAgent.get('/api/admin/bookings');
      expect(bookingsRes.status).toBe(200);
      expect(Array.isArray(bookingsRes.body)).toBe(true);
      expect(bookingsRes.body.some((row) => row.training_id === training.id)).toBe(true);

      const seasonRes = await adminAgent.get('/api/admin/season-tickets');
      expect(seasonRes.status).toBe(200);
      expect(Array.isArray(seasonRes.body)).toBe(true);
      expect(seasonRes.body.length).toBeGreaterThan(0);
    });

    test('admin cancel-session handles paid, credit and season-ticket bookings', async () => {
      const admin = await createVerifiedUser('test_userprofile_admin_2@example.com', 'admin');
      const user = await createVerifiedUser('test_userprofile_admin_2_user@example.com');
      const { trainingType, training } = await createTraining({ name: 'TEST_UP_ADMIN_CANCEL_2', audienceType: 'children', hoursFromNow: 36 });

      const { booking: paidBooking } = await createPaidBooking({ userId: user.id, trainingId: training.id, hoursFromNow: 36, amountPaid: 15 });

      const credit = await createCredit({ userId: user.id, trainingId: training.id, trainingType: trainingType.name, status: 'used' });
      const creditBooking = await createCreditBooking({ userId: user.id, trainingId: training.id, creditId: credit.id });

      const { ticket } = await createSeasonTicketProductWithTicket({ userId: user.id, trainingTypeId: trainingType.id, entriesRemaining: 4 });
      const seasonBooking = await createSeasonTicketBooking({ userId: user.id, trainingId: training.id, seasonTicketId: ticket.id, numberOfChildren: 1 });

      const adminAgent = await loginAs(admin.email);
      const res = await adminAgent.post('/api/admin/cancel-session').send({
        trainingId: training.id,
        reason: 'Admin test cancellation',
        forceCancel: false,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.canceledBookings).toBe(3);

      const trainingDb = await pool.query('SELECT cancelled FROM training_availability WHERE id = $1', [training.id]);
      expect(trainingDb.rows[0].cancelled).toBe(true);

      const paidDb = await pool.query('SELECT * FROM bookings WHERE id = $1', [paidBooking.id]);
      expect(paidDb.rows.length).toBe(1);

      const creditBookingDb = await pool.query('SELECT * FROM bookings WHERE id = $1', [creditBooking.id]);
      expect(creditBookingDb.rows.length).toBe(0);

      const creditDb = await pool.query('SELECT status FROM credits WHERE id = $1', [credit.id]);
      expect(creditDb.rows[0].status).toBe('active');

      const seasonBookingDb = await pool.query('SELECT * FROM bookings WHERE id = $1', [seasonBooking.id]);
      expect(seasonBookingDb.rows.length).toBe(0);

      const ticketDb = await pool.query('SELECT entries_remaining FROM season_tickets WHERE id = $1', [ticket.id]);
      expect(ticketDb.rows[0].entries_remaining).toBe(4);
    });

    test('admin cancel-session enforces 10h rule unless forceCancel=true', async () => {
      const admin = await createVerifiedUser('test_userprofile_admin_3@example.com', 'admin');
      const user = await createVerifiedUser('test_userprofile_admin_3_user@example.com');
      const { training } = await createTraining({ name: 'TEST_UP_ADMIN_FORCE_3', audienceType: 'children', hoursFromNow: 6 });
      await createPaidBooking({ userId: user.id, trainingId: training.id, hoursFromNow: 6, amountPaid: 15 });

      const adminAgent = await loginAs(admin.email);

      const blocked = await adminAgent.post('/api/admin/cancel-session').send({
        trainingId: training.id,
        reason: 'Too late',
        forceCancel: false,
      });
      expect(blocked.status).toBe(400);
      expect(blocked.body.error).toContain('within 10 hours');

      const forced = await adminAgent.post('/api/admin/cancel-session').send({
        trainingId: training.id,
        reason: 'Force late cancel',
        forceCancel: true,
      });
      expect(forced.status).toBe(200);
      expect(forced.body.success).toBe(true);
    });

    test('admin deletes cancelled session only when no unresolved paid bookings remain', async () => {
      const admin = await createVerifiedUser('test_userprofile_admin_4@example.com', 'admin');
      const user = await createVerifiedUser('test_userprofile_admin_4_user@example.com');
      const { training } = await createTraining({ name: 'TEST_UP_ADMIN_DELETE_4', audienceType: 'children', hoursFromNow: 48, cancelled: true });
      const { booking } = await createPaidBooking({ userId: user.id, trainingId: training.id, hoursFromNow: 48, amountPaid: 15 });

      const adminAgent = await loginAs(admin.email);

      const blockedRes = await adminAgent.delete(`/api/admin/training-sessions/${training.id}`);
      expect(blockedRes.status).toBe(400);
      expect(blockedRes.body.error).toContain('Nemožno vymazať');

      await pool.query(
        `INSERT INTO refunds (booking_id, refund_id, amount, status, reason, created_at)
         VALUES ($1, $2, 15.00, 'succeeded', 'test resolved', NOW())`,
        [booking.id, `test_refund_resolved_${Date.now()}`]
      );

      const okRes = await adminAgent.delete(`/api/admin/training-sessions/${training.id}`);
      expect(okRes.status).toBe(200);
      expect(okRes.body.success).toBe(true);

      const trainingDb = await pool.query('SELECT * FROM training_availability WHERE id = $1', [training.id]);
      expect(trainingDb.rows.length).toBe(0);

      const archivedBookingDb = await pool.query(
        'SELECT training_id, archived_training_date, archived_training_type FROM bookings WHERE id = $1',
        [booking.id]
      );
      expect(archivedBookingDb.rows[0].training_id).toBeNull();
      expect(archivedBookingDb.rows[0].archived_training_date).not.toBeNull();
      expect(archivedBookingDb.rows[0].archived_training_type).not.toBeNull();
    });

    test('admin payment report validates future date and returns PDF for valid range', async () => {
      const admin = await createVerifiedUser('test_userprofile_admin_5@example.com', 'admin');
      const adminAgent = await loginAs(admin.email);

      const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const badRes = await adminAgent.post('/api/admin/payment-report').send({
        startDate: past,
        endDate: future,
      });
      expect(badRes.status).toBe(400);
      expect(badRes.body.error).toContain('End date cannot be later');

      const okRes = await adminAgent.post('/api/admin/payment-report').send({
        startDate: past,
        endDate: today,
      });
      expect(okRes.status).toBe(200);
      expect(okRes.headers['content-type']).toContain('application/pdf');
    });

    test('admin can generate archived sessions report PDF', async () => {
      const admin = await createVerifiedUser('test_userprofile_admin_6@example.com', 'admin');
      const adminAgent = await loginAs(admin.email);

      const res = await adminAgent.get('/api/admin/archived-sessions-report');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
    });
  });
});
