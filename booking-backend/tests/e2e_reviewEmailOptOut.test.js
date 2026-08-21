/**
 * e2e_reviewEmailOptOut.test.js
 *
 * Testy pre review email opt-out logiku:
 *  - CRON scheduler filtruje používateľov s review_email_opt_out = true
 *  - Unsubscribe endpoint (GET /api/review/unsubscribe)
 *  - Full end-to-end flow (scheduler → email → unsubscribe → žiadne ďalšie maily)
 *
 * ⚠️ Všetky emaily sú mocknuté cez jest.mock('../services/emailService') — žiadne
 *    skutočné maily sa neodošlú. Používajú sa len testovacie adresy test_*@example.com.
 */

const {
  pool,
  cleanupTestData,
  createTestUser,
  createTestTrainingType,
  createTestTraining,
} = require('./setup');
const emailService = require('../services/emailService');
const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../services/emailService');

const { app } = require('../server');

// ─────────────────────────────────────────────
// POMOCNÉ FUNKCIE
// ─────────────────────────────────────────────

async function createTestBookingWithPastTraining(userId, trainingTypeId, hoursAgo) {
  const typeResult = await pool.query(
    'SELECT name FROM training_types WHERE id = $1',
    [trainingTypeId]
  );

  if (typeResult.rows.length === 0) {
    throw new Error(`Training type not found for id ${trainingTypeId}`);
  }

  const trainingTypeName = typeResult.rows[0].name;

  const trainingResult = await pool.query(
    `INSERT INTO training_availability (
      training_date, training_type_id, training_type, max_participants
    )
    VALUES (
      NOW() - ($1 * INTERVAL '1 hour'),
      $2,
      $3,
      10
    )
    RETURNING id`,
    [hoursAgo, trainingTypeId, trainingTypeName]
  );

  const trainingId = trainingResult.rows[0].id;

  const bookingResult = await pool.query(
    `INSERT INTO bookings (
      user_id,
      training_id,
      active,
      review_email_sent_at,
      number_of_children,
      booking_type
    )
    VALUES ($1, $2, true, NULL, 1, 'paid')
    RETURNING id`,
    [userId, trainingId]
  );

  return {
    bookingId: bookingResult.rows[0].id,
    trainingId,
  };
}

async function runSchedulerOnce() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
SELECT
  b.id AS booking_id,
  u.id AS user_id,
  u.email,
  u.first_name,
  ta.training_date,
  ta.training_type,
  tt.duration_minutes
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN training_availability ta ON b.training_id = ta.id
JOIN training_types tt ON ta.training_type_id = tt.id
WHERE b.active = true
  AND b.review_email_sent_at IS NULL
  AND u.review_email_opt_out = false
  AND ta.cancelled IS NOT TRUE
  AND (ta.training_date + (tt.duration_minutes * INTERVAL '1 minute') + INTERVAL '1 hour') <= NOW()
    `);

    for (const row of result.rows) {
      try {
        const unsubscribeToken = jwt.sign(
          { userId: row.user_id },
          process.env.JWT_SECRET,
          { expiresIn: '90d' }
        );

        await emailService.sendReviewRequestEmail(row.email, row.first_name, {
          trainingType: row.training_type,
          trainingDate: row.training_date,
          unsubscribeToken,
        });

        await client.query(
          'UPDATE bookings SET review_email_sent_at = NOW() WHERE id = $1',
          [row.booking_id]
        );
      } catch (err) {
        console.error(`❌ [REVIEW EMAIL] Failed for booking ${row.booking_id}:`, err.message);
      }
    }
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────
// SKUPINA 1: CRON scheduler (opt-out logika)
// ─────────────────────────────────────────────

describe('Review Email Opt-out — CRON scheduler', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await cleanupTestData();
  });

  test('should NOT send email to user with review_email_opt_out = true', async () => {
    const user = await createTestUser('test_optout_1@example.com');
    await pool.query(
      'UPDATE users SET review_email_opt_out = true WHERE id = $1',
      [user.id]
    );
    const trainingType = await createTestTrainingType('TEST_MINI');

    const { bookingId } = await createTestBookingWithPastTraining(user.id, trainingType.id, 3);

    emailService.sendReviewRequestEmail.mockResolvedValue(undefined);

    await runSchedulerOnce();

    expect(emailService.sendReviewRequestEmail).not.toHaveBeenCalled();

    const result = await pool.query(
      'SELECT review_email_sent_at FROM bookings WHERE id = $1',
      [bookingId]
    );
    expect(result.rows[0].review_email_sent_at).toBeNull();
  });

  test('should send email to user with review_email_opt_out = false (default)', async () => {
    const user = await createTestUser('test_optout_2@example.com');
    const trainingType = await createTestTrainingType('TEST_MINI');

    const { bookingId } = await createTestBookingWithPastTraining(user.id, trainingType.id, 3);

    emailService.sendReviewRequestEmail.mockResolvedValue(undefined);

    await runSchedulerOnce();

    expect(emailService.sendReviewRequestEmail).toHaveBeenCalledTimes(1);

    const result = await pool.query(
      'SELECT review_email_sent_at FROM bookings WHERE id = $1',
      [bookingId]
    );
    expect(result.rows[0].review_email_sent_at).not.toBeNull();
  });

  test('should send unsubscribeToken in email call', async () => {
    const user = await createTestUser('test_optout_3@example.com');
    const trainingType = await createTestTrainingType('TEST_MINI');

    await createTestBookingWithPastTraining(user.id, trainingType.id, 3);

    emailService.sendReviewRequestEmail.mockResolvedValue(undefined);

    await runSchedulerOnce();

    expect(emailService.sendReviewRequestEmail).toHaveBeenCalledWith(
      user.email,
      user.first_name,
      expect.objectContaining({ unsubscribeToken: expect.any(String) })
    );

    const token = emailService.sendReviewRequestEmail.mock.calls[0][2].unsubscribeToken;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.userId).toBe(user.id);
  });

  test('should filter out opted-out users but still send to others', async () => {
    const user1 = await createTestUser('test_optout_4a@example.com');
    await pool.query(
      'UPDATE users SET review_email_opt_out = true WHERE id = $1',
      [user1.id]
    );
    const user2 = await createTestUser('test_optout_4b@example.com');
    const trainingType = await createTestTrainingType('TEST_MINI');

    const booking1 = await createTestBookingWithPastTraining(user1.id, trainingType.id, 3);
    const booking2 = await createTestBookingWithPastTraining(user2.id, trainingType.id, 3);

    emailService.sendReviewRequestEmail.mockResolvedValue(undefined);

    await runSchedulerOnce();

    expect(emailService.sendReviewRequestEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendReviewRequestEmail).toHaveBeenCalledWith(
      user2.email,
      user2.first_name,
      expect.objectContaining({ unsubscribeToken: expect.any(String) })
    );

    const result1 = await pool.query(
      'SELECT review_email_sent_at FROM bookings WHERE id = $1',
      [booking1.bookingId]
    );
    const result2 = await pool.query(
      'SELECT review_email_sent_at FROM bookings WHERE id = $1',
      [booking2.bookingId]
    );

    expect(result1.rows[0].review_email_sent_at).toBeNull();
    expect(result2.rows[0].review_email_sent_at).not.toBeNull();
  });

  test('should NOT send email for cancelled training', async () => {
    const user = await createTestUser('test_optout_cancelled@example.com');
    const trainingType = await createTestTrainingType('TEST_MINI');

    const { bookingId, trainingId } = await createTestBookingWithPastTraining(user.id, trainingType.id, 3);

    await pool.query(
      'UPDATE training_availability SET cancelled = true WHERE id = $1',
      [trainingId]
    );

    emailService.sendReviewRequestEmail.mockResolvedValue(undefined);

    await runSchedulerOnce();

    expect(emailService.sendReviewRequestEmail).not.toHaveBeenCalled();

    const result = await pool.query(
      'SELECT review_email_sent_at FROM bookings WHERE id = $1',
      [bookingId]
    );
    expect(result.rows[0].review_email_sent_at).toBeNull();
  });

  test('should NOT change opt_out for a different user than in token', async () => {
    const user1 = await createTestUser('test_optout_iso_a@example.com');
    const user2 = await createTestUser('test_optout_iso_b@example.com');

    const token = jwt.sign(
      { userId: user1.id },
      process.env.JWT_SECRET,
      { expiresIn: '90d' }
    );

    const res = await request(app)
      .get('/api/review/unsubscribe')
      .query({ token });

    expect(res.status).toBe(200);

    const result1 = await pool.query(
      'SELECT review_email_opt_out FROM users WHERE id = $1',
      [user1.id]
    );
    const result2 = await pool.query(
      'SELECT review_email_opt_out FROM users WHERE id = $1',
      [user2.id]
    );

    expect(result1.rows[0].review_email_opt_out).toBe(true);
    expect(result2.rows[0].review_email_opt_out).toBe(false);
  });
});

// ─────────────────────────────────────────────
// SKUPINA 2: Unsubscribe endpoint
// ─────────────────────────────────────────────

describe('Review Email Opt-out — Unsubscribe endpoint', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await cleanupTestData();
  });

  test('GET /api/review/unsubscribe - valid token sets opt_out = true', async () => {
    const user = await createTestUser('test_optout_5@example.com');

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '90d' }
    );

    const res = await request(app)
      .get('/api/review/unsubscribe')
      .query({ token });

    expect(res.status).toBe(200);
    expect(res.text).toContain('Ďakujeme');

    const result = await pool.query(
      'SELECT review_email_opt_out FROM users WHERE id = $1',
      [user.id]
    );
    expect(result.rows[0].review_email_opt_out).toBe(true);
  });

  test('GET /api/review/unsubscribe - missing token returns 400', async () => {
    const res = await request(app).get('/api/review/unsubscribe');

    expect(res.status).toBe(400);
    expect(res.text).toContain('Neplatný');
  });

  test('GET /api/review/unsubscribe - invalid token returns 400', async () => {
    const res = await request(app)
      .get('/api/review/unsubscribe')
      .query({ token: 'totally_invalid_string' });

    expect(res.status).toBe(400);
    expect(res.text).toMatch(/neplatný|vypršal/i);
  });

  test('GET /api/review/unsubscribe - expired token returns 400', async () => {
    const expiredToken = jwt.sign(
      { userId: 1 },
      process.env.JWT_SECRET,
      { expiresIn: '1ms' }
    );
    await new Promise((resolve) => setTimeout(resolve, 10));

    const res = await request(app)
      .get('/api/review/unsubscribe')
      .query({ token: expiredToken });

    expect(res.status).toBe(400);
  });

  test('GET /api/review/unsubscribe - idempotent (calling twice is safe)', async () => {
    const user = await createTestUser('test_optout_9@example.com');

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '90d' }
    );

    const res1 = await request(app)
      .get('/api/review/unsubscribe')
      .query({ token });
    const res2 = await request(app)
      .get('/api/review/unsubscribe')
      .query({ token });

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    const result = await pool.query(
      'SELECT review_email_opt_out FROM users WHERE id = $1',
      [user.id]
    );
    expect(result.rows[0].review_email_opt_out).toBe(true);
  });

  test('GET /api/review/unsubscribe - returns HTML not JSON on success', async () => {
    const user = await createTestUser('test_optout_html@example.com');

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '90d' }
    );

    const res = await request(app)
      .get('/api/review/unsubscribe')
      .query({ token });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('<html');
  });
});

// ─────────────────────────────────────────────
// SKUPINA 3: Full end-to-end flow
// ─────────────────────────────────────────────

describe('Review Email Opt-out — Full E2E flow', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await pool.end();
  });

  test('full flow: scheduler sends email, user clicks unsubscribe, no more emails', async () => {
    const user = await createTestUser('test_optout_10@example.com');
    const trainingType = await createTestTrainingType('TEST_MINI');

    const booking1 = await createTestBookingWithPastTraining(user.id, trainingType.id, 3);

    emailService.sendReviewRequestEmail.mockResolvedValue(undefined);

    await runSchedulerOnce();

    expect(emailService.sendReviewRequestEmail).toHaveBeenCalledTimes(1);

    const sentResult = await pool.query(
      'SELECT review_email_sent_at FROM bookings WHERE id = $1',
      [booking1.bookingId]
    );
    expect(sentResult.rows[0].review_email_sent_at).not.toBeNull();

    const callArgs = emailService.sendReviewRequestEmail.mock.calls[0][2];
    const token = callArgs.unsubscribeToken;

    const unsubRes = await request(app)
      .get('/api/review/unsubscribe')
      .query({ token });
    expect(unsubRes.status).toBe(200);

    const optOutResult = await pool.query(
      'SELECT review_email_opt_out FROM users WHERE id = $1',
      [user.id]
    );
    expect(optOutResult.rows[0].review_email_opt_out).toBe(true);

    // Druhý booking pre toho istého používateľa (nový, review_email_sent_at = NULL)
    const booking2 = await createTestBookingWithPastTraining(user.id, trainingType.id, 3);

    await runSchedulerOnce();

    expect(emailService.sendReviewRequestEmail).toHaveBeenCalledTimes(1);

    const secondResult = await pool.query(
      'SELECT review_email_sent_at FROM bookings WHERE id = $1',
      [booking2.bookingId]
    );
    expect(secondResult.rows[0].review_email_sent_at).toBeNull();
  });

  test('user with multiple past bookings receives emails for each, then opts out', async () => {
    const user = await createTestUser('test_optout_multi@example.com');
    const trainingType = await createTestTrainingType('TEST_MINI');

    const b1 = await createTestBookingWithPastTraining(user.id, trainingType.id, 3);
    const b2 = await createTestBookingWithPastTraining(user.id, trainingType.id, 3);
    const b3 = await createTestBookingWithPastTraining(user.id, trainingType.id, 3);

    emailService.sendReviewRequestEmail.mockResolvedValue(undefined);

    await runSchedulerOnce();

    expect(emailService.sendReviewRequestEmail).toHaveBeenCalledTimes(3);

    for (const booking of [b1, b2, b3]) {
      const result = await pool.query(
        'SELECT review_email_sent_at FROM bookings WHERE id = $1',
        [booking.bookingId]
      );
      expect(result.rows[0].review_email_sent_at).not.toBeNull();
    }

    const token = emailService.sendReviewRequestEmail.mock.calls[0][2].unsubscribeToken;

    const unsubRes = await request(app)
      .get('/api/review/unsubscribe')
      .query({ token });
    expect(unsubRes.status).toBe(200);

    const optOutResult = await pool.query(
      'SELECT review_email_opt_out FROM users WHERE id = $1',
      [user.id]
    );
    expect(optOutResult.rows[0].review_email_opt_out).toBe(true);

    jest.clearAllMocks();

    const b4 = await createTestBookingWithPastTraining(user.id, trainingType.id, 3);

    await runSchedulerOnce();

    expect(emailService.sendReviewRequestEmail).not.toHaveBeenCalled();

    const result4 = await pool.query(
      'SELECT review_email_sent_at FROM bookings WHERE id = $1',
      [b4.bookingId]
    );
    expect(result4.rows[0].review_email_sent_at).toBeNull();
  });
});
