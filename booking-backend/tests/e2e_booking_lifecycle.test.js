// tests/e2e_booking_lifecycle.test.js
// E2E testy pre kompletný životný cyklus rezervácie pre dospelých

const request = require('supertest');
const express = require('express');
const { 
  cleanupTestData, 
  createTestUser, 
  createTestTrainingType,
  createTestTraining,
  pool 
} = require('./setup');

// Mock pre Stripe - dynamicky generovaný
let mockSessionId = 'test_session_' + Date.now();
let mockPaymentIntentId = 'test_payment_intent_' + Date.now();

const createMockStripeSession = (overrides = {}) => ({
  id: mockSessionId,
  payment_status: 'paid',
  payment_intent: mockPaymentIntentId,
  created: Math.floor(Date.now() / 1000),
  metadata: {},
  customer_details: {
    email: 'test@example.com'
  },
  ...overrides
});

const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn().mockImplementation(() => {
        // Generujeme nové ID pri každom volaní
        mockSessionId = 'test_session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        mockPaymentIntentId = 'test_payment_intent_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        return Promise.resolve(createMockStripeSession({ id: mockSessionId, payment_intent: mockPaymentIntentId }));
      })
    }
  },
  refunds: {
    create: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        id: 'test_refund_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        status: 'succeeded'
      });
    })
  },
  webhooks: {
    constructEvent: jest.fn().mockImplementation((payload, sig, secret) => {
      const parsedPayload = JSON.parse(payload);
      return {
        type: parsedPayload.type || 'checkout.session.completed',
        data: { 
          object: {
            ...createMockStripeSession(),
            ...parsedPayload.data?.object
          }
        }
      };
    })
  }
};

// Mock email service
jest.mock('../services/emailService', () => ({
  sendAdultBookingEmail: jest.fn().mockResolvedValue(true),
  sendAdminNewBookingNotification: jest.fn().mockResolvedValue(true),
  sendCancellationEmails: jest.fn().mockResolvedValue(true),
  sendMassCancellationEmail: jest.fn().mockResolvedValue(true),
  sendMassCancellationCredit: jest.fn().mockResolvedValue(true),
  sendMassCancellationSeasonTicket: jest.fn().mockResolvedValue(true),
  sendRefundConfirmationEmail: jest.fn().mockResolvedValue(true)
}));

// Mock Stripe modul
jest.mock('stripe', () => {
  return jest.fn(() => mockStripe);
});

// Vytvorenie testovacej Express aplikácie
const app = express();
app.use(express.json());

// Session middleware mock
app.use((req, res, next) => {
  req.session = {
    userId: req.headers['x-test-user-id'] || null,
    role: req.headers['x-test-user-role'] || 'user'
  };
  next();
});

// Middleware pre autentifikáciu
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.session.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
};

// ============================================
// ENDPOINTY PRE TESTOVANIE
// ============================================

// 1. Vytvorenie rezervácie s platbou pre dospelého
app.post('/api/create-adult-payment-session', isAuthenticated, async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId, trainingId, mobile, note } = req.body;

    if (!trainingId) {
      return res.status(400).json({ error: 'Nebol vybratý konkrétny termín.' });
    }

    await client.query('BEGIN');

    // Získanie info o tréningu a cene
    const trainingResult = await client.query(
      `SELECT ta.id, ta.max_participants, ta.training_date,
              tt.name as type_name,
              tp.price as base_price
       FROM training_availability ta
       JOIN training_types tt ON ta.training_type_id = tt.id
       JOIN training_prices tp ON tp.training_type_id = tt.id AND tp.child_count = 1
       WHERE ta.id = $1`,
      [trainingId]
    );

    if (trainingResult.rows.length === 0) {
      throw new Error('Pre tento termín sa nenašiel záznam alebo platná cena.');
    }

    const training = trainingResult.rows[0];
    const calculatedPrice = parseFloat(training.base_price);

    // Kontrola kapacity
    const bookingsResult = await client.query(
      `SELECT COALESCE(SUM(number_of_children), 0) + COALESCE(SUM(number_of_adults), 0) AS booked_count
       FROM bookings WHERE training_id = $1 AND active = true`,
      [training.id]
    );
    const bookedCount = parseInt(bookingsResult.rows[0].booked_count, 10);
    if (bookedCount + 1 > training.max_participants) {
      throw new Error('Kapacita tréningu bola práve naplnená.');
    }

    // Vytvorenie dočasného booking záznamu (active = false)
    const bookingResult = await client.query(
      `INSERT INTO bookings (
        user_id, training_id, number_of_adults, amount_paid,
        payment_time, session_id, booked_at, mobile, note, active, booking_type, age_group
      ) VALUES ($1, $2, 1, NULL, NULL, NULL, NOW(), $3, $4, false, 'paid', 'adult')
      RETURNING id`,
      [userId, training.id, mobile || '', note || '']
    );
    const bookingId = bookingResult.rows[0].id;

    // Vytvorenie Stripe session (mock)
    const session = await mockStripe.checkout.sessions.create({
      metadata: {
        userId: userId.toString(),
        trainingId: training.id.toString(),
        type: 'adult_training_session',
        totalPrice: calculatedPrice.toString()
      }
    });

    // Aktualizácia booking záznamu so session_id
    await client.query(
      `UPDATE bookings SET session_id = $1 WHERE id = $2`,
      [session.id, bookingId]
    );

    await client.query('COMMIT');
    res.json({ sessionId: session.id, bookingId });

  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// 2. Webhook pre potvrdenie platby
app.post('/stripe-webhook', express.json(), async (req, res) => {
  try {
    const event = req.body;

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      if (session.payment_status !== 'paid') {
        return res.json({ received: true });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        if (session.metadata?.type === 'adult_training_session') {
          const { totalPrice } = session.metadata;

          // Aktualizácia bookingu na active = true
          const updateResult = await client.query(
            `UPDATE bookings 
             SET amount_paid = $1, 
                 payment_time = $2, 
                 payment_intent_id = $3, 
                 session_id = NULL,
                 active = true
             WHERE session_id = $4 
             RETURNING *`,
            [parseFloat(totalPrice), new Date(session.created * 1000), session.payment_intent, session.id]
          );

          if (updateResult.rowCount === 0) {
            throw new Error('No booking found with the provided session ID');
          }
        }

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Webhook error:', error);
      } finally {
        client.release();
      }
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 3. Získanie detailov rezervácie
app.get('/api/bookings/:bookingId', isAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, ta.training_date, ta.training_type, ta.cancelled
       FROM bookings b
       JOIN training_availability ta ON b.training_id = ta.id
       WHERE b.id = $1 AND b.user_id = $2`,
      [req.params.bookingId, req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Zrušenie rezervácie používateľom
app.delete('/api/bookings/:bookingId', isAuthenticated, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const bookingId = req.params.bookingId;
    const { requestCredit } = req.body;

    // Získanie info o rezervácii
    const bookingResult = await client.query(
      `SELECT b.*, ta.training_date, ta.training_type
       FROM bookings b
       JOIN training_availability ta ON b.training_id = ta.id
       WHERE b.id = $1 AND b.user_id = $2`,
      [bookingId, req.session.userId]
    );

    if (bookingResult.rows.length === 0) {
      throw new Error('Booking not found or unauthorized');
    }

    const booking = bookingResult.rows[0];

    // Kontrola 10-hodinového pravidla
    const trainingDateTime = new Date(booking.training_date);
    const hoursDifference = (trainingDateTime - new Date()) / (1000 * 60 * 60);

    if (hoursDifference <= 10) {
      throw new Error('Cancellation is not allowed within 10 hours of the session');
    }

    let refundData = null;

    // Spracovanie refundácie alebo kreditu
    if (booking.booking_type === 'credit' || booking.credit_id) {
      // Vrátenie kreditu
      if (booking.credit_id) {
        await client.query(
          "UPDATE credits SET status = 'active', used_at = NULL WHERE id = $1",
          [booking.credit_id]
        );
      }
      refundData = { type: 'credit_returned' };
    } else if (booking.amount_paid > 0) {
      // Platba kartou - refund alebo kredit
      if (requestCredit) {
        // Vytvorenie kreditného záznamu
        await client.query(
          `INSERT INTO credits (
            user_id, session_id, child_count, training_type, original_date, 
            reason, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, 'User requested credit on cancellation', 'active', NOW())`,
          [booking.user_id, booking.training_id, 1, booking.training_type, booking.training_date]
        );
        refundData = { type: 'credit_issued' };
      } else {
        // Stripe refund (mock)
        const refund = await mockStripe.refunds.create({
          payment_intent: booking.payment_intent_id
        });
        refundData = refund;

        await client.query(
          'INSERT INTO refunds (booking_id, refund_id, amount, status, reason, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
          [bookingId, refund.id, booking.amount_paid, refund.status, 'Cancellation by customer']
        );
      }
    }

    // Zmazanie rezervácie
    await client.query('DELETE FROM bookings WHERE id = $1', [bookingId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Booking canceled successfully',
      refundProcessed: !!refundData?.id || ['credit_returned', 'credit_issued'].includes(refundData?.type),
      creditIssued: refundData?.type === 'credit_issued'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// 5. Admin zrušenie termínu
app.post('/api/admin/cancel-session', isAdmin, async (req, res) => {
  const { trainingId, reason } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Označenie session ako zrušená
    await client.query(
      'UPDATE training_availability SET cancelled = TRUE WHERE id = $1',
      [trainingId]
    );

    // Získanie všetkých bookingov
    const bookingsRes = await client.query(
      `SELECT b.*, u.email, u.first_name
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.training_id = $1`,
      [trainingId]
    );

    const bookings = bookingsRes.rows;
    const notifications = [];

    // Spracovanie bookingov
    for (const booking of bookings) {
      if (booking.booking_type === 'credit' || booking.credit_id) {
        // Vrátenie kreditu
        if (booking.credit_id) {
          await client.query(
            "UPDATE credits SET status = 'active', used_at = NULL WHERE id = $1",
            [booking.credit_id]
          );
        }
        notifications.push({ type: 'credit', email: booking.email, firstName: booking.first_name });
      } else if (booking.amount_paid > 0) {
        // Notifikácia o možnosti refundácie
        notifications.push({ type: 'refund_option', email: booking.email, bookingId: booking.id });
      }

      // Zmazanie bookingu
      await client.query('DELETE FROM bookings WHERE id = $1', [booking.id]);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Session cancelled. Processed ${bookings.length} bookings.`,
      canceledBookings: bookings.length,
      notificationsSent: notifications.length
    });

  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// 6. Získanie zoznamu kreditov používateľa
app.get('/api/credits/:userId', isAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM credits WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// TESTY
// ============================================

describe('E2E Testy - Životný cyklus rezervácie pre dospelých', () => {
  let testUser;
  let testAdmin;
  let testTraining;
  let createdBookingId;

  beforeAll(async () => {
    await cleanupTestData();
    testUser = await createTestUser('test_adult_user@example.com');
    testAdmin = await createTestUser('test_admin@example.com');
    // Nastavenie admin role
    await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [testAdmin.id]);
    
    // Vytvorenie tréningového typu pre dospelých
    const trainingType = await createTestTrainingType('TEST_ADULT_TRAINING', 'adults');
    testTraining = await createTestTraining(trainingType.id, 10);
    
    // Pridanie ceny pre tréning
    await pool.query(
      `INSERT INTO training_prices (training_type_id, child_count, price)
       VALUES ($1, 1, 15.00)
       ON CONFLICT (training_type_id, child_count) DO UPDATE SET price = 15.00`,
      [trainingType.id]
    );
  });

  afterEach(async () => {
    // Vyčistenie bookingov medzi testami - najprv refunds, potom bookings
    await pool.query(`DELETE FROM refunds WHERE booking_id IN (
      SELECT id FROM bookings WHERE user_id = $1
    )`, [testUser.id]);
    await pool.query(`DELETE FROM bookings WHERE user_id = $1`, [testUser.id]);
    await pool.query(`DELETE FROM credits WHERE user_id = $1`, [testUser.id]);
  });

  afterAll(async () => {
    await cleanupTestData();
    await pool.end();
  });

  describe('1. Rezervácia a Platba', () => {
    test('malo by úspešne vytvoriť rezerváciu s platbou pre dospelého', async () => {
      // Act - Vytvorenie platobnej session
      const response = await request(app)
        .post('/api/create-adult-payment-session')
        .set('x-test-user-id', testUser.id)
        .send({
          userId: testUser.id,
          trainingId: testTraining.id,
          mobile: '+421 900 123 456',
          note: 'Test rezervácie pre dospelého'
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.bookingId).toBeDefined();
      expect(response.body.sessionId).toBeDefined();

      createdBookingId = response.body.bookingId;

      // Overenie v DB - rezervácia by mala byť inactive (čaká sa na platbu)
      const bookingResult = await pool.query(
        'SELECT * FROM bookings WHERE id = $1',
        [createdBookingId]
      );
      expect(bookingResult.rows.length).toBe(1);
      expect(bookingResult.rows[0].active).toBe(false);
      expect(bookingResult.rows[0].age_group).toBe('adult');
      expect(bookingResult.rows[0].number_of_adults).toBe(1);
    });

    test('malo by zamietnuť rezerváciu bez vybraného termínu', async () => {
      const response = await request(app)
        .post('/api/create-adult-payment-session')
        .set('x-test-user-id', testUser.id)
        .send({
          userId: testUser.id,
          trainingId: null,
          mobile: '+421 900 123 456'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Nebol vybratý konkrétny termín');
    });

    test('malo by zamietnuť rezerváciu pre neautentifikovaného používateľa', async () => {
      const response = await request(app)
        .post('/api/create-adult-payment-session')
        .send({
          userId: testUser.id,
          trainingId: testTraining.id,
          mobile: '+421 900 123 456'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('2. Overenie stavu rezervácie', () => {
    beforeEach(async () => {
      // Vytvorenie bookingu pre testy
      const createResponse = await request(app)
        .post('/api/create-adult-payment-session')
        .set('x-test-user-id', testUser.id)
        .send({
          userId: testUser.id,
          trainingId: testTraining.id,
          mobile: '+421 900 123 456'
        });
      createdBookingId = createResponse.body.bookingId;
    });

    test('malo by potvrdiť rezerváciu po úspešnej platbe (webhook)', async () => {
      // Najprv získame session_id z DB
      const bookingCheck = await pool.query(
        'SELECT session_id FROM bookings WHERE id = $1',
        [createdBookingId]
      );
      const sessionId = bookingCheck.rows[0]?.session_id;
      
      // Ak session_id nie je v DB, test nemôže pokračovať
      if (!sessionId) {
        throw new Error('Session ID not found in database');
      }
      
      const paymentIntentId = 'test_payment_intent_webhook_' + Date.now();

      // Simulácia webhooku od Stripe
      const webhookPayload = JSON.stringify({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId,
            payment_status: 'paid',
            payment_intent: paymentIntentId,
            created: Math.floor(Date.now() / 1000),
            metadata: {
              type: 'adult_training_session',
              userId: testUser.id.toString(),
              trainingId: testTraining.id.toString(),
              totalPrice: '15.00'
            }
          }
        }
      });

      const response = await request(app)
        .post('/stripe-webhook')
        .set('Content-Type', 'application/json')
        .send(webhookPayload);

      expect(response.status).toBe(200);

      // Overenie v DB
      const bookingResult = await pool.query(
        'SELECT * FROM bookings WHERE id = $1',
        [createdBookingId]
      );
      expect(bookingResult.rows[0].active).toBe(true);
      expect(parseFloat(bookingResult.rows[0].amount_paid)).toBe(15.00);
      expect(bookingResult.rows[0].payment_intent_id).toBe(paymentIntentId);
    });

    test('malo by vrátiť detaily rezervácie', async () => {
      // Najprv aktivujeme booking
      await pool.query(
        `UPDATE bookings SET active = true, amount_paid = 15.00 WHERE id = $1`,
        [createdBookingId]
      );

      const response = await request(app)
        .get(`/api/bookings/${createdBookingId}`)
        .set('x-test-user-id', testUser.id);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(createdBookingId);
      expect(response.body.active).toBe(true);
      expect(response.body.age_group).toBe('adult');
      expect(response.body.training_type).toBeDefined();
    });
  });

  describe('3. Zrušenie rezervácie používateľom', () => {
    beforeEach(async () => {
      // Vytvorenie a aktivácia bookingu
      const result = await pool.query(
        `INSERT INTO bookings (
          user_id, training_id, number_of_adults, amount_paid,
          payment_intent_id, active, booking_type, age_group, booked_at
        ) VALUES ($1, $2, 1, 15.00, 'test_payment_intent', true, 'paid', 'adult', NOW())
        RETURNING id`,
        [testUser.id, testTraining.id]
      );
      createdBookingId = result.rows[0].id;

      // Nastavenie tréningu na budúci dátum (viac ako 10 hodín)
      await pool.query(
        `UPDATE training_availability SET training_date = NOW() + INTERVAL '2 days' WHERE id = $1`,
        [testTraining.id]
      );
    });

    test('malo by zrušiť rezerváciu a vytvoriť Stripe refund', async () => {
      // Najprv overíme že booking existuje
      const beforeResult = await pool.query(
        'SELECT * FROM bookings WHERE id = $1',
        [createdBookingId]
      );
      expect(beforeResult.rows.length).toBe(1);
      const paymentIntentId = beforeResult.rows[0].payment_intent_id;

      const response = await request(app)
        .delete(`/api/bookings/${createdBookingId}`)
        .set('x-test-user-id', testUser.id)
        .send({ requestCredit: false });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.refundProcessed).toBe(true);
      expect(response.body.creditIssued).toBe(false);

      // Overenie že rezervácia bola zmazaná
      const bookingResult = await pool.query(
        'SELECT * FROM bookings WHERE id = $1',
        [createdBookingId]
      );
      expect(bookingResult.rows.length).toBe(0);

      // Overenie že Stripe refund bol zavolaný s správnym payment_intent
      expect(mockStripe.refunds.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_intent: paymentIntentId
        })
      );
    });

    test('malo by zrušiť rezerváciu a vytvoriť kredit namiesto refundu', async () => {
      const response = await request(app)
        .delete(`/api/bookings/${createdBookingId}`)
        .set('x-test-user-id', testUser.id)
        .send({ requestCredit: true });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.creditIssued).toBe(true);

      // Overenie že kredit bol vytvorený
      const creditResult = await pool.query(
        'SELECT * FROM credits WHERE user_id = $1',
        [testUser.id]
      );
      expect(creditResult.rows.length).toBe(1);
      expect(creditResult.rows[0].status).toBe('active');
    });

    test('malo by zamietnuť zrušenie rezervácie menej ako 10 hodín pred tréningom', async () => {
      // Nastavenie tréningu na blízky dátum
      await pool.query(
        `UPDATE training_availability SET training_date = NOW() + INTERVAL '5 hours' WHERE id = $1`,
        [testTraining.id]
      );

      const response = await request(app)
        .delete(`/api/bookings/${createdBookingId}`)
        .set('x-test-user-id', testUser.id)
        .send({ requestCredit: false });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Cancellation is not allowed within 10 hours');
    });

    test('malo by zamietnuť zrušenie cudzej rezervácie', async () => {
      const otherUser = await createTestUser('test_other@example.com');
      
      const response = await request(app)
        .delete(`/api/bookings/${createdBookingId}`)
        .set('x-test-user-id', otherUser.id)
        .send({ requestCredit: false });

      expect(response.status).toBe(500);
    });
  });

  describe('4. Zrušenie termínu Adminom', () => {
    let adminTraining;

    beforeEach(async () => {
      // Vytvorenie tréningu pre admin testy
      const trainingType = await createTestTrainingType('TEST_ADMIN_TRAINING', 'adults');
      adminTraining = await createTestTraining(trainingType.id, 10);
      
      await pool.query(
        `INSERT INTO training_prices (training_type_id, child_count, price)
         VALUES ($1, 1, 15.00)
         ON CONFLICT (training_type_id, child_count) DO UPDATE SET price = 15.00`,
        [trainingType.id]
      );

      // Vytvorenie niekoľkých bookingov
      for (let i = 0; i < 3; i++) {
        const user = await createTestUser(`test_user_${i}@example.com`);
        await pool.query(
          `INSERT INTO bookings (
            user_id, training_id, number_of_adults, amount_paid,
            payment_intent_id, active, booking_type, age_group, booked_at
          ) VALUES ($1, $2, 1, 15.00, 'test_payment_${i}', true, 'paid', 'adult', NOW())`,
          [user.id, adminTraining.id]
        );
      }

      // Vytvorenie bookingu s kreditom
      const creditUser = await createTestUser('test_credit_user@example.com');
      const creditResult = await pool.query(
        `INSERT INTO credits (user_id, session_id, child_count, training_type, original_date, status, created_at)
         VALUES ($1, $2, 1, 'TEST_ADMIN_TRAINING', NOW(), 'used', NOW())
         RETURNING id`,
        [creditUser.id, adminTraining.id]
      );
      
      await pool.query(
        `INSERT INTO bookings (
          user_id, training_id, number_of_adults, credit_id, active, booking_type, age_group, booked_at
        ) VALUES ($1, $2, 1, $3, true, 'credit', 'adult', NOW())`,
        [creditUser.id, adminTraining.id, creditResult.rows[0].id]
      );
    });

    test('malo by zrušiť termín a spracovať všetky rezervácie', async () => {
      const response = await request(app)
        .post('/api/admin/cancel-session')
        .set('x-test-user-id', testAdmin.id)
        .set('x-test-user-role', 'admin')
        .send({
          trainingId: adminTraining.id,
          reason: 'Test zrušenia termínu adminom'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.canceledBookings).toBe(4); // 3 paid + 1 credit
      expect(response.body.notificationsSent).toBe(4);
    });

    test('malo by vrátiť kredit používateľovi pri zrušení termínu', async () => {
      await request(app)
        .post('/api/admin/cancel-session')
        .set('x-test-user-id', testAdmin.id)
        .set('x-test-user-role', 'admin')
        .send({
          trainingId: adminTraining.id,
          reason: 'Test vrátenia kreditu'
        });

      // Overenie že kredit bol vrátený
      const creditResult = await pool.query(
        `SELECT * FROM credits WHERE session_id = $1 AND status = 'active'`,
        [adminTraining.id]
      );
      expect(creditResult.rows.length).toBeGreaterThanOrEqual(1);
    });

    test('malo by zamietnuť zrušenie termínu neautorizovaným používateľom', async () => {
      const response = await request(app)
        .post('/api/admin/cancel-session')
        .set('x-test-user-id', testUser.id)
        .set('x-test-user-role', 'user')
        .send({
          trainingId: adminTraining.id,
          reason: 'Neautorizovaný pokus'
        });

      expect(response.status).toBe(403);
    });

    test('malo by označiť termín ako zrušený v DB', async () => {
      await request(app)
        .post('/api/admin/cancel-session')
        .set('x-test-user-id', testAdmin.id)
        .set('x-test-user-role', 'admin')
        .send({
          trainingId: adminTraining.id,
          reason: 'Test označenia ako zrušené'
        });

      const trainingResult = await pool.query(
        'SELECT cancelled FROM training_availability WHERE id = $1',
        [adminTraining.id]
      );
      expect(trainingResult.rows[0].cancelled).toBe(true);
    });
  });
});
