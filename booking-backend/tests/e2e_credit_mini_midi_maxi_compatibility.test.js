const request = require('supertest');
const bcrypt = require('bcryptjs');
const { cleanupTestData, pool } = require('./setup');
const { app } = require('../server');
const emailService = require('../services/emailService');

jest.mock('../services/emailService', () => ({
  sendAdultBookingEmail: jest.fn().mockResolvedValue(true),
  sendAdminNewBookingNotification: jest.fn().mockResolvedValue(true),
  sendCancellationEmails: jest.fn().mockResolvedValue(true),
  sendMassCancellationEmail: jest.fn().mockResolvedValue(true),
  sendMassCancellationCredit: jest.fn().mockResolvedValue(true),
  sendMassCancellationSeasonTicket: jest.fn().mockResolvedValue(true),
  sendAdminCreditUsage: jest.fn().mockResolvedValue(true),
  sendUserBookingEmail: jest.fn().mockResolvedValue(true)
}));

const COMPATIBLE_TYPES = ['MINI', 'MIDI', 'MAXI'];

async function ensureChildTrainingType(name) {
  const result = await pool.query(
    `INSERT INTO training_types (name, description, duration_minutes, active, audience_type, color_hex)
     VALUES ($1, $2, 60, true, 'children', '#3b82f6')
     ON CONFLICT (name)
     DO UPDATE SET
       description = EXCLUDED.description,
       active = true,
       audience_type = 'children'
     RETURNING *`,
    [name, `Compatibility test type ${name}`]
  );

  const type = result.rows[0];

  await pool.query(
    `INSERT INTO training_prices (training_type_id, child_count, price)
     VALUES ($1, 1, 15.00)
     ON CONFLICT (training_type_id, child_count)
     DO UPDATE SET price = 15.00`,
    [type.id]
  );

  return type;
}

async function createTrainingSession(type, hoursOffset) {
  const trainingDate = new Date(Date.now() + hoursOffset * 60 * 60 * 1000);
  const result = await pool.query(
    `INSERT INTO training_availability (training_type_id, training_type, training_date, max_participants)
     VALUES ($1, $2, $3, 10)
     RETURNING *`,
    [type.id, type.name, trainingDate]
  );

  return result.rows[0];
}

async function createActiveCredit(userId, sourceSession, sourceType) {
  const result = await pool.query(
    `INSERT INTO credits (
      user_id, session_id, child_count, accompanying_person, children_ages,
      photo_consent, mobile, note, training_type, original_date,
      reason, status, created_at
    )
    VALUES ($1, $2, 1, false, '5', true, '', '', $3, $4, 'compatibility test', 'active', NOW())
    RETURNING *`,
    [userId, sourceSession.id, sourceType.name, sourceSession.training_date]
  );

  return result.rows[0];
}

async function createPaidChildBooking(userId, session, opts = {}) {
  const {
    amountPaid = 15,
    paymentIntentId = `pi_test_${Date.now()}`,
    mobile = '+421900123456',
    note = 'Compatibility flow booking',
    accompanyingPerson = false,
    photoConsent = true,
    childrenAges = '5'
  } = opts;

  const result = await pool.query(
    `INSERT INTO bookings (
      user_id, training_id, number_of_children, amount_paid,
      payment_intent_id, payment_time, booked_at, active,
      booking_type, age_group, mobile, note, accompanying_person,
      photo_consent, children_ages
    ) VALUES (
      $1, $2, 1, $3,
      $4, NOW(), NOW(), true,
      'paid', 'child', $5, $6, $7,
      $8, $9
    ) RETURNING *`,
    [
      userId,
      session.id,
      amountPaid,
      paymentIntentId,
      mobile,
      note,
      accompanyingPerson,
      photoConsent,
      childrenAges
    ]
  );

  return result.rows[0];
}

describe('E2E - MINI/MIDI/MAXI credit compatibility', () => {
  let testUser;
  let agent;
  let typeByName = {};
  const createdTrainingIds = [];

  beforeAll(async () => {
    await cleanupTestData();

    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    const userResult = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password, address, verified, role)
       VALUES ($1, $2, $3, $4, $5, true, 'user')
       ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, verified = true
       RETURNING *`,
      ['Test', 'Compatibility', 'test_credit_mini_midi_maxi@example.com', hashedPassword, 'Test Address']
    );
    testUser = userResult.rows[0];

    for (const typeName of COMPATIBLE_TYPES) {
      typeByName[typeName] = await ensureChildTrainingType(typeName);
    }

    agent = request.agent(app);
    const loginResponse = await agent.post('/api/login').send({
      email: 'test_credit_mini_midi_maxi@example.com',
      password: 'testpassword123'
    });

    expect(loginResponse.status).toBe(200);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await pool.query('DELETE FROM bookings WHERE user_id = $1', [testUser.id]);
    await pool.query('DELETE FROM credits WHERE user_id = $1', [testUser.id]);
  });

  afterAll(async () => {
    if (createdTrainingIds.length > 0) {
      await pool.query('DELETE FROM training_availability WHERE id = ANY($1::int[])', [createdTrainingIds]);
    }

    await pool.query('DELETE FROM bookings WHERE user_id = $1', [testUser.id]);
    await pool.query('DELETE FROM credits WHERE user_id = $1', [testUser.id]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);

    await pool.end();
  });

  test('allows all 9 MINI/MIDI/MAXI source-target combinations', async () => {
    const scenarios = [
      ['MINI', 'MINI'],
      ['MINI', 'MIDI'],
      ['MINI', 'MAXI'],
      ['MIDI', 'MINI'],
      ['MIDI', 'MIDI'],
      ['MIDI', 'MAXI'],
      ['MAXI', 'MINI'],
      ['MAXI', 'MIDI'],
      ['MAXI', 'MAXI']
    ];

    for (let i = 0; i < scenarios.length; i += 1) {
      const [sourceName, targetName] = scenarios[i];
      const sourceType = typeByName[sourceName];
      const targetType = typeByName[targetName];

      const sourceSession = await createTrainingSession(sourceType, 72 + i);
      const targetSession = await createTrainingSession(targetType, 200 + i);
      createdTrainingIds.push(sourceSession.id, targetSession.id);

      const credit = await createActiveCredit(testUser.id, sourceSession, sourceType);

      const response = await agent.post('/api/bookings/use-credit').send({
        creditId: credit.id,
        trainingId: targetSession.id,
        childrenAges: '5',
        photoConsent: true,
        mobile: '+421900123456',
        note: `${sourceName}->${targetName}`,
        accompanyingPerson: false
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.bookingId).toBeDefined();

      const creditAfterUse = await pool.query('SELECT status FROM credits WHERE id = $1', [credit.id]);
      expect(creditAfterUse.rows[0].status).toBe('used');

      const bookingCheck = await pool.query(
        'SELECT booking_type, credit_id, training_id FROM bookings WHERE id = $1',
        [response.body.bookingId]
      );
      expect(bookingCheck.rows[0].booking_type).toBe('credit');
      expect(bookingCheck.rows[0].credit_id).toBe(credit.id);
      expect(bookingCheck.rows[0].training_id).toBe(targetSession.id);

      // Keep scenarios isolated in a single test.
      await pool.query('DELETE FROM bookings WHERE user_id = $1', [testUser.id]);
      await pool.query('DELETE FROM credits WHERE user_id = $1', [testUser.id]);
    }
  });

  test('rejects MINI credit for incompatible non-whitelisted child type', async () => {
    const miniType = typeByName.MINI;
    const otherChildType = await ensureChildTrainingType('TEST_OTHER_CHILD');

    const sourceSession = await createTrainingSession(miniType, 350);
    const targetSession = await createTrainingSession(otherChildType, 360);
    createdTrainingIds.push(sourceSession.id, targetSession.id);

    const credit = await createActiveCredit(testUser.id, sourceSession, miniType);

    const response = await agent.post('/api/bookings/use-credit').send({
      creditId: credit.id,
      trainingId: targetSession.id,
      childrenAges: '5',
      photoConsent: true,
      accompanyingPerson: false
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('not compatible');
  });

  test('rejects non-whitelisted child credit for MINI target type', async () => {
    const miniType = typeByName.MINI;
    const otherChildType = await ensureChildTrainingType('TEST_OTHER_CHILD_2');

    const sourceSession = await createTrainingSession(otherChildType, 370);
    const targetSession = await createTrainingSession(miniType, 380);
    createdTrainingIds.push(sourceSession.id, targetSession.id);

    const credit = await createActiveCredit(testUser.id, sourceSession, otherChildType);

    const response = await agent.post('/api/bookings/use-credit').send({
      creditId: credit.id,
      trainingId: targetSession.id,
      childrenAges: '5',
      photoConsent: true,
      accompanyingPerson: false
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('not compatible');
  });

  test('rejects child credit for adult target training', async () => {
    const miniType = typeByName.MINI;
    const adultType = await pool.query(
      `INSERT INTO training_types (name, description, duration_minutes, active, audience_type, color_hex)
       VALUES ('TEST_ADULT_COMPAT', 'Adult type for compatibility negative test', 60, true, 'adults', '#10b981')
       ON CONFLICT (name)
       DO UPDATE SET audience_type = 'adults', active = true
       RETURNING *`
    );

    await pool.query(
      `INSERT INTO training_prices (training_type_id, child_count, price)
       VALUES ($1, 1, 15.00)
       ON CONFLICT (training_type_id, child_count)
       DO UPDATE SET price = 15.00`,
      [adultType.rows[0].id]
    );

    const sourceSession = await createTrainingSession(miniType, 390);
    const targetSession = await createTrainingSession(adultType.rows[0], 400);
    createdTrainingIds.push(sourceSession.id, targetSession.id);

    const credit = await createActiveCredit(testUser.id, sourceSession, miniType);

    const response = await agent.post('/api/bookings/use-credit').send({
      creditId: credit.id,
      trainingId: targetSession.id,
      childrenAges: '5',
      photoConsent: true,
      accompanyingPerson: false
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('not compatible');
  });

  test('flow 1: user cancels MINI to credit and uses it on MAXI with notifications', async () => {
    const miniSession = await createTrainingSession(typeByName.MINI, 500);
    const maxiSession = await createTrainingSession(typeByName.MAXI, 520);
    createdTrainingIds.push(miniSession.id, maxiSession.id);

    const paidBooking = await createPaidChildBooking(testUser.id, miniSession, {
      note: 'User cancellation to credit flow'
    });

    const cancelResponse = await agent
      .delete(`/api/bookings/${paidBooking.id}`)
      .send({ requestCredit: true });

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.creditIssued).toBe(true);
    expect(emailService.sendCancellationEmails).toHaveBeenCalled();

    const creditResult = await pool.query(
      `SELECT * FROM credits
       WHERE user_id = $1 AND status = 'active'
       ORDER BY id DESC
       LIMIT 1`,
      [testUser.id]
    );

    expect(creditResult.rows.length).toBe(1);
    expect(creditResult.rows[0].training_type).toBe('MINI');

    const useCreditResponse = await agent.post('/api/bookings/use-credit').send({
      creditId: creditResult.rows[0].id,
      trainingId: maxiSession.id,
      childrenAges: '5',
      photoConsent: true,
      mobile: '+421900123456',
      note: 'Using MINI credit on MAXI',
      accompanyingPerson: false
    });

    expect(useCreditResponse.status).toBe(200);
    expect(useCreditResponse.body.success).toBe(true);
    expect(emailService.sendUserBookingEmail).toHaveBeenCalled();
    expect(emailService.sendAdminCreditUsage).toHaveBeenCalled();

    const userEmailPayload = emailService.sendUserBookingEmail.mock.calls.at(-1)[1];
    expect(userEmailPayload.paymentType).toBe('credit');
    expect(userEmailPayload.trainingType).toBe('MAXI');

    const adminCreditPayload = emailService.sendAdminCreditUsage.mock.calls.at(-1)[1];
    expect(adminCreditPayload.training.training_type).toBe('MAXI');
    expect(adminCreditPayload.credit.training_type).toBe('MINI');
  });

  test('flow 2: admin cancels MAXI, user picks credit and uses it on MIDI with notifications', async () => {
    const adminPassword = await bcrypt.hash('adminpassword123', 10);
    const adminInsert = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password, address, verified, role)
       VALUES ($1, $2, $3, $4, $5, true, 'admin')
       ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = 'admin', verified = true
       RETURNING *`,
      ['Admin', 'Compatibility', 'test_credit_mini_midi_maxi_admin@example.com', adminPassword, 'Admin Address']
    );
    const adminUser = adminInsert.rows[0];

    const userPassword = await bcrypt.hash('userpassword123', 10);
    const userInsert = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password, address, verified, role)
       VALUES ($1, $2, $3, $4, $5, true, 'user')
       ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = 'user', verified = true
       RETURNING *`,
      ['Flow2', 'User', 'test_credit_mini_midi_maxi_user2@example.com', userPassword, 'Flow2 Address']
    );
    const flow2User = userInsert.rows[0];

    const adminAgent = request.agent(app);
    const adminLogin = await adminAgent.post('/api/login').send({
      email: adminUser.email,
      password: 'adminpassword123'
    });
    expect(adminLogin.status).toBe(200);

    const userAgent = request.agent(app);
    const userLogin = await userAgent.post('/api/login').send({
      email: flow2User.email,
      password: 'userpassword123'
    });
    expect(userLogin.status).toBe(200);

    const maxiSession = await createTrainingSession(typeByName.MAXI, 530);
    const midiSession = await createTrainingSession(typeByName.MIDI, 550);
    createdTrainingIds.push(maxiSession.id, midiSession.id);

    const paidBooking = await createPaidChildBooking(flow2User.id, maxiSession, {
      note: 'Admin cancellation to credit flow'
    });

    const adminCancelResponse = await adminAgent.post('/api/admin/cancel-session').send({
      trainingId: maxiSession.id,
      reason: 'Test admin cancellation flow',
      forceCancel: true
    });

    expect(adminCancelResponse.status).toBe(200);
    expect(emailService.sendMassCancellationEmail).toHaveBeenCalled();

    const creditPickResponse = await userAgent
      .get('/api/booking/credit')
      .query({ bookingId: paidBooking.id });

    expect(creditPickResponse.status).toBe(200);
    expect(['processed', 'already']).toContain(creditPickResponse.body.status);

    const creditResult = await pool.query(
      `SELECT * FROM credits
       WHERE user_id = $1 AND status = 'active'
       ORDER BY id DESC
       LIMIT 1`,
      [flow2User.id]
    );

    expect(creditResult.rows.length).toBe(1);
    expect(creditResult.rows[0].training_type).toBe('MAXI');

    const useCreditResponse = await userAgent.post('/api/bookings/use-credit').send({
      creditId: creditResult.rows[0].id,
      trainingId: midiSession.id,
      childrenAges: '5',
      photoConsent: true,
      mobile: '+421900000000',
      note: 'Using MAXI credit on MIDI',
      accompanyingPerson: false
    });

    expect(useCreditResponse.status).toBe(200);
    expect(useCreditResponse.body.success).toBe(true);
    expect(emailService.sendUserBookingEmail).toHaveBeenCalled();
    expect(emailService.sendAdminCreditUsage).toHaveBeenCalled();

    const userEmailPayload = emailService.sendUserBookingEmail.mock.calls.at(-1)[1];
    expect(userEmailPayload.paymentType).toBe('credit');
    expect(userEmailPayload.trainingType).toBe('MIDI');

    const adminCreditPayload = emailService.sendAdminCreditUsage.mock.calls.at(-1)[1];
    expect(adminCreditPayload.training.training_type).toBe('MIDI');
    expect(adminCreditPayload.credit.training_type).toBe('MAXI');

    await pool.query('DELETE FROM bookings WHERE user_id = $1', [flow2User.id]);
    await pool.query('DELETE FROM credits WHERE user_id = $1', [flow2User.id]);
    await pool.query('DELETE FROM users WHERE id = $1', [flow2User.id]);
    await pool.query('DELETE FROM users WHERE id = $1', [adminUser.id]);
  });
});
