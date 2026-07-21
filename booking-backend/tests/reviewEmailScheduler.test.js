const {
  pool,
  cleanupTestData,
  createTestUser,
  createTestTrainingType,
  createTestTraining,
} = require('./setup');
const emailService = require('../services/emailService');

jest.mock('../services/emailService');

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
  AND (ta.training_date + (tt.duration_minutes * INTERVAL '1 minute') + INTERVAL '1 hour') <= NOW()
    `);

    for (const row of result.rows) {
      try {
        await emailService.sendReviewRequestEmail(row.email, row.first_name, {
          trainingType: row.training_type,
          trainingDate: row.training_date,
        });

        await client.query(
          'UPDATE bookings SET review_email_sent_at = NOW() WHERE id = $1',
          [row.booking_id]
        );

        console.log(`✅ [REVIEW EMAIL] Sent to: ${row.email}, booking: ${row.booking_id}`);
      } catch (err) {
        console.error(`❌ [REVIEW EMAIL] Failed for booking ${row.booking_id}:`, err.message);
      }
    }
  } finally {
    client.release();
  }
}

describe('Review email scheduler integration', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await pool.end();
  });

  test('should send review email for booking where training ended more than 1 hour ago', async () => {
    const user = await createTestUser('test_review_1@example.com');
    const trainingType = await createTestTrainingType('TEST_MINI');

    const { bookingId } = await createTestBookingWithPastTraining(user.id, trainingType.id, 3);

    emailService.sendReviewRequestEmail.mockResolvedValue(undefined);

    await runSchedulerOnce();

    expect(emailService.sendReviewRequestEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendReviewRequestEmail).toHaveBeenCalledWith(
      user.email,
      user.first_name,
      expect.objectContaining({ trainingType: 'TEST_MINI' })
    );

    const statusResult = await pool.query(
      'SELECT review_email_sent_at FROM bookings WHERE id = $1',
      [bookingId]
    );

    expect(statusResult.rows[0].review_email_sent_at).not.toBeNull();
  });

  test('should NOT send review email for booking where training ended less than 1 hour ago', async () => {
    const user = await createTestUser('test_review_2@example.com');
    const trainingType = await createTestTrainingType('TEST_MINI');

    const { bookingId } = await createTestBookingWithPastTraining(user.id, trainingType.id, 1.5);

    emailService.sendReviewRequestEmail.mockResolvedValue(undefined);

    await runSchedulerOnce();

    expect(emailService.sendReviewRequestEmail).not.toHaveBeenCalled();

    const statusResult = await pool.query(
      'SELECT review_email_sent_at FROM bookings WHERE id = $1',
      [bookingId]
    );

    expect(statusResult.rows[0].review_email_sent_at).toBeNull();
  });

  test('should NOT send review email if already sent (review_email_sent_at IS NOT NULL)', async () => {
    const user = await createTestUser('test_review_3@example.com');
    const trainingType = await createTestTrainingType('TEST_MINI');

    const { bookingId } = await createTestBookingWithPastTraining(user.id, trainingType.id, 3);

    await pool.query(
      'UPDATE bookings SET review_email_sent_at = NOW() WHERE id = $1',
      [bookingId]
    );

    emailService.sendReviewRequestEmail.mockResolvedValue(undefined);

    await runSchedulerOnce();

    expect(emailService.sendReviewRequestEmail).not.toHaveBeenCalled();
  });

  test('should NOT send review email for inactive booking (active = false)', async () => {
    const user = await createTestUser('test_review_4@example.com');
    const trainingType = await createTestTrainingType('TEST_MINI');

    const { bookingId } = await createTestBookingWithPastTraining(user.id, trainingType.id, 3);

    await pool.query(
      'UPDATE bookings SET active = false WHERE id = $1',
      [bookingId]
    );

    emailService.sendReviewRequestEmail.mockResolvedValue(undefined);

    await runSchedulerOnce();

    expect(emailService.sendReviewRequestEmail).not.toHaveBeenCalled();
  });

  test('should send emails to multiple bookings and mark all as sent', async () => {
    const user1 = await createTestUser('test_review_5a@example.com');
    const user2 = await createTestUser('test_review_5b@example.com');
    const trainingType = await createTestTrainingType('TEST_MINI');

    const booking1 = await createTestBookingWithPastTraining(user1.id, trainingType.id, 3);
    const booking2 = await createTestBookingWithPastTraining(user2.id, trainingType.id, 3);

    emailService.sendReviewRequestEmail.mockResolvedValue(undefined);

    await runSchedulerOnce();

    expect(emailService.sendReviewRequestEmail).toHaveBeenCalledTimes(2);

    const statusResult = await pool.query(
      'SELECT id, review_email_sent_at FROM bookings WHERE id = ANY($1::int[]) ORDER BY id ASC',
      [[booking1.bookingId, booking2.bookingId]]
    );

    expect(statusResult.rows).toHaveLength(2);
    expect(statusResult.rows[0].review_email_sent_at).not.toBeNull();
    expect(statusResult.rows[1].review_email_sent_at).not.toBeNull();
  });

  test('should send review email exactly 1 hour after training end (boundary case)', async () => {
    const user = await createTestUser('test_review_6@example.com');
    const trainingType = await createTestTrainingType('TEST_MINI');

    const { bookingId } = await createTestBookingWithPastTraining(user.id, trainingType.id, 2);

    emailService.sendReviewRequestEmail.mockResolvedValue(undefined);

    await runSchedulerOnce();

    expect(emailService.sendReviewRequestEmail).toHaveBeenCalledTimes(1);

    const statusResult = await pool.query(
      'SELECT review_email_sent_at FROM bookings WHERE id = $1',
      [bookingId]
    );

    expect(statusResult.rows[0].review_email_sent_at).not.toBeNull();
  });

  test('should keep review_email_sent_at NULL when email sending fails', async () => {
    const user = await createTestUser('test_review_7@example.com');
    const trainingType = await createTestTrainingType('TEST_MINI');

    const { bookingId } = await createTestBookingWithPastTraining(user.id, trainingType.id, 3);

    emailService.sendReviewRequestEmail.mockRejectedValue(new Error('SMTP fail'));

    await runSchedulerOnce();

    expect(emailService.sendReviewRequestEmail).toHaveBeenCalledTimes(1);

    const statusResult = await pool.query(
      'SELECT review_email_sent_at FROM bookings WHERE id = $1',
      [bookingId]
    );

    expect(statusResult.rows[0].review_email_sent_at).toBeNull();
  });

  test('should continue processing other bookings when one send fails', async () => {
    const user1 = await createTestUser('test_review_8a@example.com');
    const user2 = await createTestUser('test_review_8b@example.com');
    const trainingType = await createTestTrainingType('TEST_MINI');

    const booking1 = await createTestBookingWithPastTraining(user1.id, trainingType.id, 3);
    const booking2 = await createTestBookingWithPastTraining(user2.id, trainingType.id, 3);

    emailService.sendReviewRequestEmail.mockImplementation(async (email) => {
      if (email === user1.email) {
        throw new Error('SMTP fail');
      }
    });

    await runSchedulerOnce();

    expect(emailService.sendReviewRequestEmail).toHaveBeenCalledTimes(2);

    const statusResult = await pool.query(
      'SELECT id, review_email_sent_at FROM bookings WHERE id = ANY($1::int[]) ORDER BY id ASC',
      [[booking1.bookingId, booking2.bookingId]]
    );

    const first = statusResult.rows.find((row) => row.id === booking1.bookingId);
    const second = statusResult.rows.find((row) => row.id === booking2.bookingId);

    expect(first.review_email_sent_at).toBeNull();
    expect(second.review_email_sent_at).not.toBeNull();
  });

  test('should send review email only to users who actually had a booking', async () => {
    const participatingUser = await createTestUser('test_review_9_participating@example.com');
    const nonParticipatingUser = await createTestUser('test_review_9_non_participating@example.com');
    const trainingType = await createTestTrainingType('TEST_MINI');

    const { bookingId } = await createTestBookingWithPastTraining(participatingUser.id, trainingType.id, 3);

    emailService.sendReviewRequestEmail.mockResolvedValue(undefined);

    await runSchedulerOnce();

    expect(emailService.sendReviewRequestEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendReviewRequestEmail).toHaveBeenCalledWith(
      participatingUser.email,
      participatingUser.first_name,
      expect.objectContaining({ trainingType: 'TEST_MINI' })
    );

    const calledEmails = emailService.sendReviewRequestEmail.mock.calls.map((call) => call[0]);
    expect(calledEmails).not.toContain(nonParticipatingUser.email);

    const statusResult = await pool.query(
      'SELECT review_email_sent_at FROM bookings WHERE id = $1',
      [bookingId]
    );

    expect(statusResult.rows[0].review_email_sent_at).not.toBeNull();
  });
});
