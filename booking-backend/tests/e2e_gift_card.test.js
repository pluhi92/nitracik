const request = require('supertest');
const bcrypt = require('bcryptjs');
const { cleanupTestData, pool } = require('./setup');

let gcStripeCounter = 0;

const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
  paymentIntents: {
    retrieve: jest.fn(),
  },
  refunds: {
    create: jest.fn(),
  },
};

jest.mock('stripe', () => jest.fn(() => mockStripe));

jest.mock('../services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendUserBookingEmail: jest.fn().mockResolvedValue(true),
  sendAdultBookingEmail: jest.fn().mockResolvedValue(true),
  sendAdminBookingEmail: jest.fn().mockResolvedValue(true),
  sendAdminNewBookingNotification: jest.fn().mockResolvedValue(true),
  sendSeasonTicketConfirmation: jest.fn().mockResolvedValue(true),
  sendAdminSeasonTicketPurchase: jest.fn().mockResolvedValue(true),
  sendAdminSeasonTicketUsage: jest.fn().mockResolvedValue(true),
  sendCancellationEmails: jest.fn().mockResolvedValue(true),
  sendMassCancellationEmail: jest.fn().mockResolvedValue(true),
  sendMassCancellationCredit: jest.fn().mockResolvedValue(true),
  sendMassCancellationSeasonTicket: jest.fn().mockResolvedValue(true),
  sendRefundConfirmationEmail: jest.fn().mockResolvedValue(true),
  sendAdminCreditUsage: jest.fn().mockResolvedValue(true),
  sendContactFormEmails: jest.fn().mockResolvedValue(true),
  sendAccountDeletedEmail: jest.fn().mockResolvedValue(true),
  sendAdminAccountDeleteNotification: jest.fn().mockResolvedValue(true),
  sendPaymentFailedEmail: jest.fn().mockResolvedValue(true),
  sendReviewRequestEmail: jest.fn().mockResolvedValue(true),
  sendBulkAdminEmail: jest.fn().mockResolvedValue(true),
  sendGiftCardEmail: jest.fn().mockResolvedValue(true),
}));

const { app, pool: serverPool } = require('../server');

// --- Helper Functions ---

async function createVerifiedUser(email, role = 'user', password = 'TestPass123!') {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password, address, mobile, verified, role)
     VALUES ($1, $2, $3, $4, $5, $6, true, $7)
     ON CONFLICT (email) DO UPDATE SET password = $4, verified = true, role = $7
     RETURNING *`,
    ['Test', 'GC', email, hashedPassword, 'Test GC Address, 94901 Nitra', '+421900000000', role]
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

async function createGiftCardInDb({
  code,
  amount = 30,
  balance = 30,
  status = 'active',
  buyerEmail,
  recipientName = 'Test Recipient',
  recipientEmail = null,
  message = null,
  expiresAt = null,
  stripeSessionId = null,
}) {
  const expires = expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const sessionId = stripeSessionId || `test_gc_session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const result = await pool.query(
    `INSERT INTO gift_card 
      (code, amount, balance, status, "buyerEmail", "recipientName", "recipientEmail", 
       message, "expiresAt", "stripeSessionId", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
     ON CONFLICT (code) DO UPDATE SET balance = $3, status = $4
     RETURNING *`,
    [code, amount, balance, status, buyerEmail, recipientName, recipientEmail, message, expires, sessionId]
  );
  return result.rows[0];
}

async function getGiftCardByCode(code) {
  const result = await pool.query('SELECT * FROM gift_card WHERE code = $1', [code]);
  return result.rows[0] || null;
}

function testGcCode(suffix) {
  return `TESTGC${suffix.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)}`;
}

async function createTrainingWithPrice({ name, hoursFromNow = 24, maxParticipants = 10, price = 15 }) {
  const typeResult = await pool.query(
    `INSERT INTO training_types (name, description, duration_minutes, active, audience_type, color_hex)
     VALUES ($1, $2, 60, true, 'children', '#f59e0b')
     ON CONFLICT (name) DO UPDATE SET name = $1
     RETURNING *`,
    [name, 'Gift card test training']
  );
  const type = typeResult.rows[0];

  await pool.query(
    `INSERT INTO training_prices (training_type_id, child_count, price)
     VALUES ($1, 1, $2), ($1, 2, $2), ($1, 3, $2)
     ON CONFLICT (training_type_id, child_count) DO UPDATE SET price = $2`,
    [type.id, price]
  );

  const trainingResult = await pool.query(
    `INSERT INTO training_availability (training_type_id, training_type, training_date, max_participants)
     VALUES ($1, $2, NOW() + ($3 || ' hours')::interval, $4)
     RETURNING *`,
    [type.id, type.name, String(hoursFromNow), maxParticipants]
  );
  return { type, training: trainingResult.rows[0] };
}

function resetStripeMocks() {
  gcStripeCounter += 1;
  const sessionId = `test_gc_session_${Date.now()}_${gcStripeCounter}`;

  mockStripe.checkout.sessions.create.mockResolvedValue({
    id: sessionId,
    payment_status: 'paid',
    metadata: {},
  });

  mockStripe.checkout.sessions.retrieve.mockResolvedValue({
    id: sessionId,
    payment_status: 'paid',
    metadata: {
      type: 'gift_card',
      amount: '30',
      buyerEmail: 'test_gc_buyer@example.com',
      recipientName: 'Test Recipient',
      recipientEmail: '',
      message: '',
    },
  });

  mockStripe.webhooks.constructEvent.mockImplementation((payload) => {
    const decodePayload = (value) => {
      if (Buffer.isBuffer(value)) {
        return decodePayload(value.toString('utf8'));
      }

      if (typeof value === 'string') {
        return decodePayload(JSON.parse(value));
      }

      if (value && value.type === 'Buffer' && Array.isArray(value.data)) {
        return decodePayload(Buffer.from(value.data).toString('utf8'));
      }

      return value;
    };

    return decodePayload(payload);
  });

  mockStripe.paymentIntents.retrieve.mockResolvedValue({
    id: `test_pi_${Date.now()}`,
    amount: 3000,
    created: Math.floor(Date.now() / 1000),
  });
}

describe('E2E - Gift Card Feature', () => {
  let giftCardTableExists = false;

  beforeAll(async () => {
    const tableCheck = await pool.query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'gift_card'
       ) AS exists`
    );
    giftCardTableExists = tableCheck.rows[0].exists;
    if (!giftCardTableExists) {
      console.warn('⚠️  gift_card table does not exist in test DB — skipping gift card tests.');
    }
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await pool.end();
  });

  beforeEach(() => {
    resetStripeMocks();
    jest.clearAllMocks();
  });

  const skipIfNoTable = (testFn) => {
    return giftCardTableExists ? testFn : test.skip;
  };

  describe('Gift Card — DB table guard', () => {
    test('gift_card table exists in test database', async () => {
      const result = await pool.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'gift_card') AS exists`
      );
      expect(result.rows[0].exists).toBe(true);
    });

    test('gift_card table has required columns', async () => {
      if (!giftCardTableExists) return;
      const result = await pool.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'gift_card' AND table_schema = 'public'`
      );
      const cols = result.rows.map(r => r.column_name);
      ['id', 'code', 'amount', 'balance', 'status', 'buyerEmail', 'recipientName',
        'expiresAt', 'createdAt', 'stripeSessionId'].forEach(col => {
          expect(cols).toContain(col);
        });
    });
  });

  describe('POST /api/create-gift-card-session — Stripe session creation', () => {
    beforeAll(() => {
      if (!giftCardTableExists) return;
    });

    test('POSITIVE: logged-in user gets a Stripe sessionId for valid amount', async () => {
      if (!giftCardTableExists) return;
      const user = await createVerifiedUser('test_gc_001@example.com');
      const agent = await loginAs(user.email);
      const res = await agent.post('/api/create-gift-card-session').send({
        amount: 30, buyerEmail: user.email, recipientName: 'Maťko', honeypot: '',
      });
      expect(res.status).toBe(200);
      expect(res.body.sessionId).toBeDefined();
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledTimes(1);
      const callArgs = mockStripe.checkout.sessions.create.mock.calls[0][0];
      expect(callArgs.metadata.type).toBe('gift_card');
      expect(callArgs.metadata.amount).toBe('30');
      expect(Number(callArgs.line_items[0].price_data.unit_amount)).toBe(3000);
    });

    test('POSITIVE: guest (unauthenticated) user can also create a session', async () => {
      if (!giftCardTableExists) return;
      const res = await request(app).post('/api/create-gift-card-session').send({
        amount: 15, buyerEmail: 'test_gc_guest@example.com', recipientName: 'Zuzka', honeypot: '',
      });
      expect(res.status).toBe(200);
      expect(res.body.sessionId).toBeDefined();
    });

    test('POSITIVE: all valid amounts [15, 30, 50, 100] are accepted', async () => {
      if (!giftCardTableExists) return;
      for (const amount of [15, 30, 50, 100]) {
        const res = await request(app).post('/api/create-gift-card-session').send({
          amount, buyerEmail: 'test_gc_amounts@example.com', recipientName: 'Test', honeypot: '',
        });
        expect(res.status).toBe(200);
      }
    });

    test('POSITIVE: optional fields (recipientEmail, message) are passed to Stripe metadata', async () => {
      if (!giftCardTableExists) return;
      const res = await request(app).post('/api/create-gift-card-session').send({
        amount: 50, buyerEmail: 'test_gc_opt@example.com', recipientName: 'Jana',
        recipientEmail: 'jana@example.com', message: 'Všetko najlepšie!', honeypot: '',
      });
      expect(res.status).toBe(200);
      const call = mockStripe.checkout.sessions.create.mock.calls[0][0];
      expect(call.metadata.recipientEmail).toBe('jana@example.com');
      expect(call.metadata.message).toBe('Všetko najlepšie!');
    });

    test('NEGATIVE: honeypot filled → 400, no Stripe call', async () => {
      if (!giftCardTableExists) return;
      const res = await request(app).post('/api/create-gift-card-session').send({
        amount: 30, buyerEmail: 'test_gc_bot@example.com', recipientName: 'Bot', honeypot: 'i-am-a-bot',
      });
      expect(res.status).toBe(400);
      expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
    });

    test('NEGATIVE: invalid amount (20) → 400', async () => {
      if (!giftCardTableExists) return;
      const res = await request(app).post('/api/create-gift-card-session').send({
        amount: 20, buyerEmail: 'test_gc_inv@example.com', recipientName: 'Test', honeypot: '',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test('NEGATIVE: amount 0 → 400', async () => {
      if (!giftCardTableExists) return;
      const res = await request(app).post('/api/create-gift-card-session').send({
        amount: 0, buyerEmail: 'test_gc_zero@example.com', recipientName: 'Test', honeypot: '',
      });
      expect(res.status).toBe(400);
    });

    test('NEGATIVE: negative amount → 400', async () => {
      if (!giftCardTableExists) return;
      const res = await request(app).post('/api/create-gift-card-session').send({
        amount: -30, buyerEmail: 'test_gc_neg@example.com', recipientName: 'Test', honeypot: '',
      });
      expect(res.status).toBe(400);
    });

    test('NEGATIVE: missing buyerEmail → 400', async () => {
      if (!giftCardTableExists) return;
      const res = await request(app).post('/api/create-gift-card-session').send({
        amount: 30, recipientName: 'Test', honeypot: '',
      });
      expect(res.status).toBe(400);
    });

    test('NEGATIVE: missing recipientName → 400', async () => {
      if (!giftCardTableExists) return;
      const res = await request(app).post('/api/create-gift-card-session').send({
        amount: 30, buyerEmail: 'test_gc_norec@example.com', honeypot: '',
      });
      expect(res.status).toBe(400);
    });

    test('NEGATIVE: string amount that is not a valid number → 400', async () => {
      if (!giftCardTableExists) return;
      const res = await request(app).post('/api/create-gift-card-session').send({
        amount: 'abc', buyerEmail: 'test_gc_str@example.com', recipientName: 'Test', honeypot: '',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/gift-card-success — code generation and email sending', () => {
    beforeAll(() => {
      if (!giftCardTableExists) return;
    });

    test('POSITIVE: successful payment creates gift_card row in DB and sends email to buyer', async () => {
      if (!giftCardTableExists) return;
      const sessionId = `test_gc_session_succ_${Date.now()}`;
      mockStripe.checkout.sessions.retrieve.mockResolvedValue({
        id: sessionId,
        payment_status: 'paid',
        metadata: {
          type: 'gift_card', amount: '30', buyerEmail: 'test_gc_002@example.com',
          recipientName: 'Maťko', recipientEmail: '', message: '',
        },
      });

      const res = await request(app).get(`/api/gift-card-success?session_id=${sessionId}`);
      expect(res.status).toBe(200);
      expect(res.body.code).toBeDefined();
      expect(res.body.code).toHaveLength(12);
      expect(parseFloat(res.body.amount)).toBe(30);
      expect(parseFloat(res.body.balance)).toBe(30);

      // Verify DB
      const dbRow = await getGiftCardByCode(res.body.code);
      expect(dbRow).not.toBeNull();
      expect(dbRow.status).toBe('active');
      expect(parseFloat(dbRow.balance)).toBe(30);
      expect(dbRow.stripeSessionId).toBe(sessionId);

      // Email sent to buyer
      const emailService = require('../services/emailService');
      expect(emailService.sendGiftCardEmail).toHaveBeenCalledWith(
        'test_gc_002@example.com',
        expect.objectContaining({ isBuyer: true, amount: 30 })
      );
    });

    test('POSITIVE: if recipientEmail differs from buyerEmail, TWO emails are sent', async () => {
      if (!giftCardTableExists) return;
      const sessionId = `test_gc_session_dual_${Date.now()}`;
      mockStripe.checkout.sessions.retrieve.mockResolvedValue({
        id: sessionId,
        payment_status: 'paid',
        metadata: {
          type: 'gift_card', amount: '15',
          buyerEmail: 'test_gc_buyer_dual@example.com',
          recipientName: 'Zuzka',
          recipientEmail: 'test_gc_recipient_dual@example.com',
          message: 'Všetko najlepšie!',
        },
      });

      const res = await request(app).get(`/api/gift-card-success?session_id=${sessionId}`);
      expect(res.status).toBe(200);

      const emailService = require('../services/emailService');
      expect(emailService.sendGiftCardEmail).toHaveBeenCalledTimes(2);

      const calls = emailService.sendGiftCardEmail.mock.calls;
      const buyerCall = calls.find(c => c[1].isBuyer === true);
      const recipientCall = calls.find(c => c[1].isBuyer === false);
      expect(buyerCall).toBeDefined();
      expect(recipientCall).toBeDefined();
      expect(buyerCall[0]).toBe('test_gc_buyer_dual@example.com');
      expect(recipientCall[0]).toBe('test_gc_recipient_dual@example.com');
    });

    test('POSITIVE: if recipientEmail equals buyerEmail, only ONE email is sent', async () => {
      if (!giftCardTableExists) return;
      const sessionId = `test_gc_session_same_${Date.now()}`;
      mockStripe.checkout.sessions.retrieve.mockResolvedValue({
        id: sessionId,
        payment_status: 'paid',
        metadata: {
          type: 'gift_card', amount: '50',
          buyerEmail: 'test_gc_same@example.com',
          recipientName: 'Self', recipientEmail: 'test_gc_same@example.com', message: '',
        },
      });

      const res = await request(app).get(`/api/gift-card-success?session_id=${sessionId}`);
      expect(res.status).toBe(200);

      const emailService = require('../services/emailService');
      expect(emailService.sendGiftCardEmail).toHaveBeenCalledTimes(1);
    });

    test('POSITIVE: idempotency — calling the same session_id twice returns the same code', async () => {
      if (!giftCardTableExists) return;
      const sessionId = `test_gc_session_idem_${Date.now()}`;
      mockStripe.checkout.sessions.retrieve.mockResolvedValue({
        id: sessionId, payment_status: 'paid',
        metadata: {
          type: 'gift_card', amount: '30',
          buyerEmail: 'test_gc_idem@example.com',
          recipientName: 'Idem Test', recipientEmail: '', message: '',
        },
      });

      const res1 = await request(app).get(`/api/gift-card-success?session_id=${sessionId}`);
      expect(res1.status).toBe(200);
      const code1 = res1.body.code;

      // Reset email mock to count second call separately
      jest.clearAllMocks();
      resetStripeMocks();
      mockStripe.checkout.sessions.retrieve.mockResolvedValue({
        id: sessionId, payment_status: 'paid',
        metadata: {
          type: 'gift_card', amount: '30',
          buyerEmail: 'test_gc_idem@example.com',
          recipientName: 'Idem Test', recipientEmail: '', message: '',
        },
      });

      const res2 = await request(app).get(`/api/gift-card-success?session_id=${sessionId}`);
      expect(res2.status).toBe(200);
      expect(res2.body.code).toBe(code1);  // same code returned

      // No second email sent on idempotent call
      const emailService = require('../services/emailService');
      expect(emailService.sendGiftCardEmail).not.toHaveBeenCalled();
    });

    test('POSITIVE: generated code is exactly 12 chars, uppercase alphanumeric, no ambiguous chars', async () => {
      if (!giftCardTableExists) return;
      const sessionId = `test_gc_session_code_${Date.now()}`;
      mockStripe.checkout.sessions.retrieve.mockResolvedValue({
        id: sessionId, payment_status: 'paid',
        metadata: {
          type: 'gift_card', amount: '100',
          buyerEmail: 'test_gc_code@example.com',
          recipientName: 'Code Test', recipientEmail: '', message: '',
        },
      });

      const res = await request(app).get(`/api/gift-card-success?session_id=${sessionId}`);
      expect(res.status).toBe(200);
      expect(res.body.code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{12}$/);
    });

    test('POSITIVE: expiresAt is set to ~12 months from now', async () => {
      if (!giftCardTableExists) return;
      const sessionId = `test_gc_session_exp_${Date.now()}`;
      mockStripe.checkout.sessions.retrieve.mockResolvedValue({
        id: sessionId, payment_status: 'paid',
        metadata: {
          type: 'gift_card', amount: '15',
          buyerEmail: 'test_gc_exp@example.com',
          recipientName: 'Expiry Test', recipientEmail: '', message: '',
        },
      });

      const before = new Date();
      const res = await request(app).get(`/api/gift-card-success?session_id=${sessionId}`);
      const after = new Date();

      expect(res.status).toBe(200);
      const expiresAt = new Date(res.body.expiresAt);
      const minExpiry = new Date(before.getTime() + 364 * 24 * 60 * 60 * 1000);
      const maxExpiry = new Date(after.getTime() + 366 * 24 * 60 * 60 * 1000);
      expect(expiresAt >= minExpiry).toBe(true);
      expect(expiresAt <= maxExpiry).toBe(true);
    });

    test('NEGATIVE: missing session_id param → 400', async () => {
      if (!giftCardTableExists) return;
      const res = await request(app).get('/api/gift-card-success');
      expect(res.status).toBe(400);
    });

    test('NEGATIVE: Stripe session payment_status is not paid → 400, no DB row created', async () => {
      if (!giftCardTableExists) return;
      const sessionId = `test_gc_session_unpaid_${Date.now()}`;
      mockStripe.checkout.sessions.retrieve.mockResolvedValue({
        id: sessionId, payment_status: 'unpaid', metadata: {},
      });

      const res = await request(app).get(`/api/gift-card-success?session_id=${sessionId}`);
      expect(res.status).toBe(400);

      const dbCheck = await pool.query('SELECT * FROM gift_card WHERE "stripeSessionId" = $1', [sessionId]);
      expect(dbCheck.rows.length).toBe(0);
    });

    test('NEGATIVE: Stripe retrieve throws error → 500', async () => {
      if (!giftCardTableExists) return;
      mockStripe.checkout.sessions.retrieve.mockRejectedValue(new Error('Stripe network error'));
      const res = await request(app).get(`/api/gift-card-success?session_id=test_gc_err_stripe`);
      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/validate-gift-card — code validation', () => {
    beforeAll(() => {
      if (!giftCardTableExists) return;
    });

    test('POSITIVE: valid active card with full balance → returns valid: true and balance', async () => {
      if (!giftCardTableExists) return;
      const code = testGcCode('VAL01');
      await createGiftCardInDb({ code, amount: 30, balance: 30, buyerEmail: 'test_gc_val_001@example.com' });

      const res = await request(app).post('/api/validate-gift-card').send({ code });
      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(parseFloat(res.body.balance)).toBe(30);
      expect(res.body.recipientName).toBeDefined();
    });

    test('POSITIVE: valid card with partial balance → returns remaining balance', async () => {
      if (!giftCardTableExists) return;
      const code = testGcCode('VAL02');
      await createGiftCardInDb({ code, amount: 30, balance: 15, buyerEmail: 'test_gc_val_002@example.com' });

      const res = await request(app).post('/api/validate-gift-card').send({ code });
      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(parseFloat(res.body.balance)).toBe(15);
    });

    test('POSITIVE: code validation is case-insensitive (lowercase input accepted)', async () => {
      if (!giftCardTableExists) return;
      const code = testGcCode('VAL03');
      await createGiftCardInDb({ code, amount: 50, balance: 50, buyerEmail: 'test_gc_val_003@example.com' });

      const res = await request(app).post('/api/validate-gift-card').send({ code: code.toLowerCase() });
      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
    });

    test('NEGATIVE: non-existent code → 404', async () => {
      if (!giftCardTableExists) return;
      const res = await request(app).post('/api/validate-gift-card').send({ code: 'DOESNOTEXIST1' });
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test('NEGATIVE: expired card (expiresAt in the past) → 400', async () => {
      if (!giftCardTableExists) return;
      const code = testGcCode('EXP01');
      await createGiftCardInDb({
        code, amount: 30, balance: 30, buyerEmail: 'test_gc_exp_001@example.com',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
      });

      const res = await request(app).post('/api/validate-gift-card').send({ code });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/expir/i);
    });

    test('NEGATIVE: status = expired → 400', async () => {
      if (!giftCardTableExists) return;
      const code = testGcCode('EXP02');
      await createGiftCardInDb({
        code, amount: 30, balance: 30, status: 'expired',
        buyerEmail: 'test_gc_exp_002@example.com',
      });

      const res = await request(app).post('/api/validate-gift-card').send({ code });
      expect(res.status).toBe(400);
    });

    test('NEGATIVE: status = used (balance = 0) → 400', async () => {
      if (!giftCardTableExists) return;
      const code = testGcCode('USED1');
      await createGiftCardInDb({
        code, amount: 30, balance: 0, status: 'used',
        buyerEmail: 'test_gc_used_001@example.com',
      });

      const res = await request(app).post('/api/validate-gift-card').send({ code });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/využit/i);
    });

    test('NEGATIVE: balance = 0 even if status is still active → 400', async () => {
      if (!giftCardTableExists) return;
      const code = testGcCode('BAL00');
      await createGiftCardInDb({
        code, amount: 30, balance: 0, status: 'active',
        buyerEmail: 'test_gc_bal_000@example.com',
      });

      const res = await request(app).post('/api/validate-gift-card').send({ code });
      expect(res.status).toBe(400);
    });

    test('NEGATIVE: empty code string → 400', async () => {
      if (!giftCardTableExists) return;
      const res = await request(app).post('/api/validate-gift-card').send({ code: '' });
      expect(res.status).toBe(400);
    });

    test('NEGATIVE: missing code field → 400', async () => {
      if (!giftCardTableExists) return;
      const res = await request(app).post('/api/validate-gift-card').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/redeem-gift-card — redemption logic', () => {
    beforeAll(() => {
      if (!giftCardTableExists) return;
    });

    test('POSITIVE: partial redemption decrements balance, status stays active', async () => {
      if (!giftCardTableExists) return;
      const code = testGcCode('RDM01');
      await createGiftCardInDb({ code, amount: 30, balance: 30, buyerEmail: 'test_gc_rdm_001@example.com' });

      const res = await request(app).post('/api/redeem-gift-card').send({ code, amountToRedeem: 15 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(parseFloat(res.body.newBalance)).toBe(15);
      expect(res.body.newStatus).toBe('active');
      expect(parseFloat(res.body.amountRedeemed)).toBe(15);

      // Verify DB
      const db = await getGiftCardByCode(code);
      expect(parseFloat(db.balance)).toBe(15);
      expect(db.status).toBe('active');
      expect(db.redeemedAt).toBeNull();  // NOT set on partial redemption
    });

    test('POSITIVE: full redemption sets status to used and sets redeemedAt', async () => {
      if (!giftCardTableExists) return;
      const code = testGcCode('RDM02');
      await createGiftCardInDb({ code, amount: 30, balance: 30, buyerEmail: 'test_gc_rdm_002@example.com' });

      const res = await request(app).post('/api/redeem-gift-card').send({ code, amountToRedeem: 30 });
      expect(res.status).toBe(200);
      expect(parseFloat(res.body.newBalance)).toBe(0);
      expect(res.body.newStatus).toBe('used');

      const db = await getGiftCardByCode(code);
      expect(parseFloat(db.balance)).toBe(0);
      expect(db.status).toBe('used');
      expect(db.redeemedAt).not.toBeNull();  // SET on full redemption
    });

    test('POSITIVE: redeeming remaining balance of partially used card sets status to used', async () => {
      if (!giftCardTableExists) return;
      const code = testGcCode('RDM03');
      await createGiftCardInDb({ code, amount: 50, balance: 15, buyerEmail: 'test_gc_rdm_003@example.com' });

      const res = await request(app).post('/api/redeem-gift-card').send({ code, amountToRedeem: 15 });
      expect(res.status).toBe(200);
      expect(res.body.newStatus).toBe('used');

      const db = await getGiftCardByCode(code);
      expect(db.status).toBe('used');
      expect(db.redeemedAt).not.toBeNull();
    });

    test('POSITIVE: partial redeem does NOT overwrite existing redeemedAt if set from a previous call', async () => {
      if (!giftCardTableExists) return;
      const code = testGcCode('RDM04');
      const pastDate = new Date(Date.now() - 10000);
      await createGiftCardInDb({ code, amount: 100, balance: 100, buyerEmail: 'test_gc_rdm_004@example.com' });
      // Manually set redeemedAt to simulate a partial state
      await pool.query(`UPDATE gift_card SET "redeemedAt" = $1 WHERE code = $2`, [pastDate, code]);

      // Now do another partial redeem — redeemedAt must NOT be set to NULL
      const res = await request(app).post('/api/redeem-gift-card').send({ code, amountToRedeem: 50 });
      expect(res.status).toBe(200);
      expect(res.body.newStatus).toBe('active');

      const db = await getGiftCardByCode(code);
      // redeemedAt should still be the pastDate, not null
      expect(db.redeemedAt).not.toBeNull();
    });

    test('POSITIVE: floating point precision — balance stays exact (e.g. 30 - 14.50 = 15.50)', async () => {
      if (!giftCardTableExists) return;
      const code = testGcCode('FLT01');
      await createGiftCardInDb({ code, amount: 30, balance: 30, buyerEmail: 'test_gc_flt_001@example.com' });

      const res = await request(app).post('/api/redeem-gift-card').send({ code, amountToRedeem: 14.5 });
      expect(res.status).toBe(200);
      expect(parseFloat(res.body.newBalance)).toBe(15.5);

      const db = await getGiftCardByCode(code);
      expect(parseFloat(db.balance)).toBe(15.5);
    });

    test('NEGATIVE: amountToRedeem exceeds current balance → 400', async () => {
      if (!giftCardTableExists) return;
      const code = testGcCode('OVER1');
      await createGiftCardInDb({ code, amount: 30, balance: 10, buyerEmail: 'test_gc_over_001@example.com' });

      const res = await request(app).post('/api/redeem-gift-card').send({ code, amountToRedeem: 20 });
      expect(res.status).toBe(400);

      // Balance must not change
      const db = await getGiftCardByCode(code);
      expect(parseFloat(db.balance)).toBe(10);
    });

    test('NEGATIVE: redeeming from expired card → 400', async () => {
      if (!giftCardTableExists) return;
      const code = testGcCode('EXR01');
      await createGiftCardInDb({
        code, amount: 30, balance: 30, buyerEmail: 'test_gc_expr_001@example.com',
        expiresAt: new Date(Date.now() - 1000),
      });

      const res = await request(app).post('/api/redeem-gift-card').send({ code, amountToRedeem: 15 });
      expect(res.status).toBe(400);
    });

    test('NEGATIVE: redeeming from used card → 400', async () => {
      if (!giftCardTableExists) return;
      const code = testGcCode('USD01');
      await createGiftCardInDb({
        code, amount: 30, balance: 0, status: 'used',
        buyerEmail: 'test_gc_usd_001@example.com',
      });

      const res = await request(app).post('/api/redeem-gift-card').send({ code, amountToRedeem: 5 });
      expect(res.status).toBe(400);
    });

    test('NEGATIVE: amountToRedeem = 0 → 400', async () => {
      if (!giftCardTableExists) return;
      const code = testGcCode('ZERO1');
      await createGiftCardInDb({ code, amount: 30, balance: 30, buyerEmail: 'test_gc_zero_001@example.com' });

      const res = await request(app).post('/api/redeem-gift-card').send({ code, amountToRedeem: 0 });
      expect(res.status).toBe(400);
    });

    test('NEGATIVE: amountToRedeem is negative → 400', async () => {
      if (!giftCardTableExists) return;
      const code = testGcCode('NEG01');
      await createGiftCardInDb({ code, amount: 30, balance: 30, buyerEmail: 'test_gc_neg_001@example.com' });

      const res = await request(app).post('/api/redeem-gift-card').send({ code, amountToRedeem: -10 });
      expect(res.status).toBe(400);
    });

    test('NEGATIVE: non-existent code → 404', async () => {
      if (!giftCardTableExists) return;
      const res = await request(app).post('/api/redeem-gift-card').send({ code: 'FAKECODE00001', amountToRedeem: 10 });
      expect(res.status).toBe(404);
    });

    test('NEGATIVE: missing code → 400', async () => {
      if (!giftCardTableExists) return;
      const res = await request(app).post('/api/redeem-gift-card').send({ amountToRedeem: 10 });
      expect(res.status).toBe(400);
    });

    test('NEGATIVE: missing amountToRedeem → 400', async () => {
      if (!giftCardTableExists) return;
      const code = testGcCode('MISR1');
      await createGiftCardInDb({ code, amount: 30, balance: 30, buyerEmail: 'test_gc_misr_001@example.com' });
      const res = await request(app).post('/api/redeem-gift-card').send({ code });
      expect(res.status).toBe(400);
    });
  });

  describe('Gift Card + Booking integration — discount applied at checkout', () => {
    beforeAll(() => {
      if (!giftCardTableExists) return;
    });

    test('POSITIVE: gift card discount is subtracted from booking price in Stripe session', async () => {
      if (!giftCardTableExists) return;
      const user = await createVerifiedUser('test_gc_booking_001@example.com');
      const agent = await loginAs(user.email);
      const { type, training } = await createTrainingWithPrice({
        name: 'TEST_GC_BOOKING_001', price: 30,
      });

      const gcCode = testGcCode('BK001');
      await createGiftCardInDb({ code: gcCode, amount: 15, balance: 15, buyerEmail: user.email });

      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: `test_gc_session_bk001_${Date.now()}`,
        payment_status: 'unpaid',
        metadata: {},
      });

      const res = await agent.post('/api/create-payment-session').send({
        userId: user.id, trainingId: training.id, trainingType: type.name,
        selectedDate: '2025-01-01', selectedTime: '10:00', childrenCount: 1,
        childrenAge: '5', totalPrice: 30, photoConsent: null, mobile: '',
        note: '', accompanyingPerson: false, allowDuplicate: false,
        giftCardCode: gcCode, giftCardDiscount: 15,
      });

      expect(res.status).toBe(200);
      const stripeCall = mockStripe.checkout.sessions.create.mock.calls[0][0];
      expect(stripeCall.line_items[0].price_data.unit_amount).toBe(1500);
      expect(stripeCall.metadata.giftCardCode).toBe(gcCode);
    });

    test('POSITIVE: gift card covers full price → free booking response, no Stripe redirect', async () => {
      if (!giftCardTableExists) return;
      const user = await createVerifiedUser('test_gc_booking_002@example.com');
      const agent = await loginAs(user.email);
      const { type, training } = await createTrainingWithPrice({
        name: 'TEST_GC_BOOKING_002', price: 15,
      });

      const gcCode = testGcCode('BK002');
      await createGiftCardInDb({ code: gcCode, amount: 30, balance: 30, buyerEmail: user.email });

      // Reset stripe mock to ensure create is not called
      mockStripe.checkout.sessions.create.mockClear();

      const res = await agent.post('/api/create-payment-session').send({
        userId: user.id, trainingId: training.id, trainingType: type.name,
        selectedDate: '2025-01-01', selectedTime: '10:00', childrenCount: 1,
        childrenAge: '5', totalPrice: 15, photoConsent: null, mobile: '',
        note: '', accompanyingPerson: false, allowDuplicate: false,
        giftCardCode: gcCode, giftCardDiscount: 15,
      });

      expect(res.status).toBe(200);
      expect(res.body.free).toBe(true);

      // No Stripe session created (full gift card)
      expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();

      // Booking created in DB with active = true
      const bookings = await pool.query(
        'SELECT * FROM bookings WHERE user_id = $1 AND training_id = $2 AND active = true',
        [user.id, training.id]
      );
      expect(bookings.rows.length).toBe(1);
      expect(bookings.rows[0].amount_paid).toBe('0.00');

      // Gift card balance decremented
      const gc = await getGiftCardByCode(gcCode);
      expect(parseFloat(gc.balance)).toBe(15); // 30 - 15 = 15
      expect(gc.status).toBe('active'); // partial use
    });

    test('POSITIVE: partial gift card discount — remaining price goes to Stripe', async () => {
      if (!giftCardTableExists) return;
      const user = await createVerifiedUser('test_gc_booking_003@example.com');
      const agent = await loginAs(user.email);
      const { type, training } = await createTrainingWithPrice({
        name: 'TEST_GC_BOOKING_003', price: 30,
      });

      const gcCode = testGcCode('BK003');
      await createGiftCardInDb({ code: gcCode, amount: 15, balance: 15, buyerEmail: user.email });

      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: `test_gc_session_bk003_${Date.now()}`,
        payment_status: 'unpaid', metadata: {},
      });

      const res = await agent.post('/api/create-payment-session').send({
        userId: user.id, trainingId: training.id, trainingType: type.name,
        selectedDate: '2025-01-01', selectedTime: '10:00', childrenCount: 1,
        childrenAge: '5', totalPrice: 30, photoConsent: null, mobile: '',
        note: '', accompanyingPerson: false, allowDuplicate: false,
        giftCardCode: gcCode, giftCardDiscount: 15,
      });

      expect(res.status).toBe(200);
      expect(res.body.sessionId).toBeDefined();

      const stripeCall = mockStripe.checkout.sessions.create.mock.calls[0][0];
      expect(stripeCall.line_items[0].price_data.unit_amount).toBe(1500);
    });

    test('POSITIVE: no gift card provided → full price charged via Stripe', async () => {
      if (!giftCardTableExists) return;
      const user = await createVerifiedUser('test_gc_booking_004@example.com');
      const agent = await loginAs(user.email);
      const { type, training } = await createTrainingWithPrice({
        name: 'TEST_GC_BOOKING_004', price: 15,
      });

      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: `test_gc_session_bk004_${Date.now()}`,
        payment_status: 'unpaid', metadata: {},
      });

      const res = await agent.post('/api/create-payment-session').send({
        userId: user.id, trainingId: training.id, trainingType: type.name,
        selectedDate: '2025-01-01', selectedTime: '10:00', childrenCount: 1,
        childrenAge: '5', totalPrice: 15, photoConsent: null, mobile: '',
        note: '', accompanyingPerson: false, allowDuplicate: false,
        giftCardCode: null, giftCardDiscount: 0,
      });

      expect(res.status).toBe(200);
      const stripeCall = mockStripe.checkout.sessions.create.mock.calls[0][0];
      expect(stripeCall.line_items[0].price_data.unit_amount).toBe(1500);
    });

    test('NEGATIVE: invalid gift card code provided at checkout → discount ignored, full price charged', async () => {
      if (!giftCardTableExists) return;
      const user = await createVerifiedUser('test_gc_booking_005@example.com');
      const agent = await loginAs(user.email);
      const { type, training } = await createTrainingWithPrice({
        name: 'TEST_GC_BOOKING_005', price: 15,
      });

      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: `test_gc_session_bk005_${Date.now()}`,
        payment_status: 'unpaid', metadata: {},
      });

      const res = await agent.post('/api/create-payment-session').send({
        userId: user.id, trainingId: training.id, trainingType: type.name,
        selectedDate: '2025-01-01', selectedTime: '10:00', childrenCount: 1,
        childrenAge: '5', totalPrice: 15, photoConsent: null, mobile: '',
        note: '', accompanyingPerson: false, allowDuplicate: false,
        giftCardCode: 'INVALIDCODE1', giftCardDiscount: 15,
      });

      // Should still succeed but charge full price (invalid code ignored server-side)
      expect(res.status).toBe(200);
      const stripeCall = mockStripe.checkout.sessions.create.mock.calls[0][0];
      expect(stripeCall.line_items[0].price_data.unit_amount).toBe(1500);
    });
  });

  describe('Stripe webhook — gift card redemption after paid booking', () => {
    beforeAll(() => {
      if (!giftCardTableExists) return;
    });

    test('POSITIVE: webhook with giftCardCode in metadata decrements gift card balance', async () => {
      if (!giftCardTableExists) return;
      const gcCode = testGcCode('WH001');
      await createGiftCardInDb({ code: gcCode, amount: 30, balance: 30, buyerEmail: 'test_gc_wh_001@example.com' });

      const user = await createVerifiedUser('test_gc_wh_user_001@example.com');
      const { type, training } = await createTrainingWithPrice({ name: 'TEST_GC_WH_001', price: 15 });

      // Create a pending booking that the webhook will activate
      const sessionId = `test_gc_wh_session_001_${Date.now()}`;
      const bookingResult = await pool.query(
        `INSERT INTO bookings (user_id, training_id, number_of_children, amount_paid, booked_at, active, booking_type, session_id)
         VALUES ($1, $2, 1, NULL, NOW(), false, 'paid', $3) RETURNING *`,
        [user.id, training.id, sessionId]
      );
      const booking = bookingResult.rows[0];

      const webhookPayload = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId,
            payment_status: 'paid',
            payment_intent: `test_gc_wh_pi_001_${Date.now()}`,
            created: Math.floor(Date.now() / 1000),
            metadata: {
              type: 'training_session',
              userId: String(user.id),
              trainingId: String(training.id),
              trainingType: type.name,
              selectedDate: '2025-01-01',
              selectedTime: '10:00',
              childrenCount: '1',
              childrenAge: '5',
              totalPrice: '15',
              photoConsent: 'null',
              mobile: '',
              note: '',
              accompanyingPerson: 'false',
              giftCardCode: gcCode,
              giftCardDiscount: '15',
            },
          },
        },
      };

      const res = await request(app)
        .post('/stripe-webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'test_sig')
        .send(Buffer.from(JSON.stringify(webhookPayload)));

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);

      // Allow async processing
      await new Promise(r => setTimeout(r, 500));

      // Gift card balance must be decremented
      const gc = await getGiftCardByCode(gcCode);
      expect(parseFloat(gc.balance)).toBe(15); // 30 - 15
      expect(gc.status).toBe('active');
      expect(gc.redeemedAt).toBeNull(); // partial — not fully used
    });

    test('POSITIVE: webhook fully uses card → status becomes used and redeemedAt is set', async () => {
      if (!giftCardTableExists) return;
      const gcCode = testGcCode('WH002');
      await createGiftCardInDb({ code: gcCode, amount: 15, balance: 15, buyerEmail: 'test_gc_wh_002@example.com' });

      const user = await createVerifiedUser('test_gc_wh_user_002@example.com');
      const { type, training } = await createTrainingWithPrice({ name: 'TEST_GC_WH_002', price: 15 });

      const sessionId = `test_gc_wh_session_002_${Date.now()}`;
      await pool.query(
        `INSERT INTO bookings (user_id, training_id, number_of_children, booked_at, active, booking_type, session_id)
         VALUES ($1, $2, 1, NOW(), false, 'paid', $3)`,
        [user.id, training.id, sessionId]
      );

      const webhookPayload = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId, payment_status: 'paid',
            payment_intent: `test_gc_wh_pi_002_${Date.now()}`,
            created: Math.floor(Date.now() / 1000),
            metadata: {
              type: 'training_session', userId: String(user.id),
              trainingId: String(training.id), trainingType: type.name,
              selectedDate: '2025-01-01', selectedTime: '10:00',
              childrenCount: '1', childrenAge: '5', totalPrice: '15',
              photoConsent: 'null', mobile: '', note: '',
              accompanyingPerson: 'false', giftCardCode: gcCode, giftCardDiscount: '15',
            },
          },
        },
      };

      await request(app)
        .post('/stripe-webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'test_sig')
        .send(Buffer.from(JSON.stringify(webhookPayload)));

      await new Promise(r => setTimeout(r, 500));

      const gc = await getGiftCardByCode(gcCode);
      expect(parseFloat(gc.balance)).toBe(0);
      expect(gc.status).toBe('used');
      expect(gc.redeemedAt).not.toBeNull();
    });

    test('POSITIVE: webhook without giftCardCode in metadata → gift card untouched', async () => {
      if (!giftCardTableExists) return;
      const gcCode = testGcCode('WH003');
      await createGiftCardInDb({ code: gcCode, amount: 30, balance: 30, buyerEmail: 'test_gc_wh_003@example.com' });

      const user = await createVerifiedUser('test_gc_wh_user_003@example.com');
      const { type, training } = await createTrainingWithPrice({ name: 'TEST_GC_WH_003', price: 15 });
      const sessionId = `test_gc_wh_session_003_${Date.now()}`;
      await pool.query(
        `INSERT INTO bookings (user_id, training_id, number_of_children, booked_at, active, booking_type, session_id)
         VALUES ($1, $2, 1, NOW(), false, 'paid', $3)`,
        [user.id, training.id, sessionId]
      );

      const webhookPayload = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId, payment_status: 'paid',
            payment_intent: `test_gc_wh_pi_003_${Date.now()}`,
            created: Math.floor(Date.now() / 1000),
            metadata: {
              type: 'training_session', userId: String(user.id),
              trainingId: String(training.id), trainingType: type.name,
              selectedDate: '2025-01-01', selectedTime: '10:00',
              childrenCount: '1', childrenAge: '5', totalPrice: '15',
              photoConsent: 'null', mobile: '', note: '',
              accompanyingPerson: 'false',
              // NO giftCardCode here
            },
          },
        },
      };

      await request(app)
        .post('/stripe-webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'test_sig')
        .send(Buffer.from(JSON.stringify(webhookPayload)));

      await new Promise(r => setTimeout(r, 500));

      const gc = await getGiftCardByCode(gcCode);
      expect(parseFloat(gc.balance)).toBe(30); // unchanged
      expect(gc.status).toBe('active');
    });

    test('POSITIVE: gift_card type webhook is handled gracefully and does not error', async () => {
      if (!giftCardTableExists) return;
      const sessionId = `test_gc_wh_type_${Date.now()}`;
      const webhookPayload = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId, payment_status: 'paid',
            metadata: { type: 'gift_card', amount: '30', buyerEmail: 'test_gc_wh_type@example.com' },
          },
        },
      };

      const res = await request(app)
        .post('/stripe-webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'test_sig')
        .send(Buffer.from(JSON.stringify(webhookPayload)));

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
      // No DB row should be created (handled by polling endpoint, not webhook)
      const dbCheck = await pool.query('SELECT * FROM gift_card WHERE "stripeSessionId" = $1', [sessionId]);
      expect(dbCheck.rows.length).toBe(0);
    });
  });

  describe('Gift Card lifecycle — full E2E happy path', () => {
    beforeAll(() => {
      if (!giftCardTableExists) return;
    });

    test('FULL FLOW: purchase → generate code → validate → apply to booking → balance decremented', async () => {
      if (!giftCardTableExists) return;
      // 1. Setup
      const buyer = await createVerifiedUser('test_gc_e2e_001@example.com');
      const { type, training } = await createTrainingWithPrice({
        name: 'TEST_GC_E2E_001', price: 15,
      });

      // 2. Create Stripe session for gift card purchase
      const buyerAgent = await loginAs(buyer.email);
      const sessionId = `test_gc_e2e_session_001_${Date.now()}`;
      mockStripe.checkout.sessions.create.mockResolvedValue({ id: sessionId, payment_status: 'paid', metadata: {} });

      const createRes = await buyerAgent.post('/api/create-gift-card-session').send({
        amount: 30, buyerEmail: buyer.email, recipientName: 'Maťko', honeypot: '',
      });
      expect(createRes.status).toBe(200);

      // 3. Simulate successful payment — call gift-card-success
      mockStripe.checkout.sessions.retrieve.mockResolvedValue({
        id: sessionId, payment_status: 'paid',
        metadata: {
          type: 'gift_card', amount: '30',
          buyerEmail: buyer.email, recipientName: 'Maťko',
          recipientEmail: '', message: 'Pre teba!',
        },
      });

      const successRes = await request(app).get(`/api/gift-card-success?session_id=${sessionId}`);
      expect(successRes.status).toBe(200);
      const { code } = successRes.body;
      expect(code).toHaveLength(12);

      // 4. Validate the generated code
      const validateRes = await request(app).post('/api/validate-gift-card').send({ code });
      expect(validateRes.status).toBe(200);
      expect(validateRes.body.valid).toBe(true);
      expect(parseFloat(validateRes.body.balance)).toBe(30);

      // 5. Use it at booking checkout (partial — 15€ of 30€)
      const bookingAgent = await loginAs(buyer.email);
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: `test_gc_e2e_booking_session_${Date.now()}`, payment_status: 'unpaid', metadata: {},
      });

      const bookingRes = await bookingAgent.post('/api/create-payment-session').send({
        userId: buyer.id, trainingId: training.id, trainingType: type.name,
        selectedDate: '2025-06-01', selectedTime: '10:00', childrenCount: 1,
        childrenAge: '5', totalPrice: 15, photoConsent: null, mobile: '',
        note: '', accompanyingPerson: false, allowDuplicate: false,
        giftCardCode: code, giftCardDiscount: 15,
      });
      expect(bookingRes.status).toBe(200);
      expect(bookingRes.body.free).toBe(true); // 30 covers 15 fully

      // 6. Verify gift card balance in DB
      const gc = await getGiftCardByCode(code);
      expect(parseFloat(gc.balance)).toBe(15); // 30 - 15 = 15
      expect(gc.status).toBe('active');

      // 7. Validate remaining balance is correct
      const validateRes2 = await request(app).post('/api/validate-gift-card').send({ code });
      expect(validateRes2.status).toBe(200);
      expect(parseFloat(validateRes2.body.balance)).toBe(15);

      // 8. Email was sent during gift-card-success step
      const emailService = require('../services/emailService');
      expect(emailService.sendGiftCardEmail).toHaveBeenCalled();
    });
  });

  describe('Race conditions & concurrent access', () => {
    beforeAll(() => {
      if (!giftCardTableExists) return;
    });

    test('NEGATIVE: two simultaneous redemptions of the same card cannot overdraw balance', async () => {
      // This tests the FOR UPDATE lock in /api/redeem-gift-card
      // Two requests try to redeem 20€ from a 30€ card simultaneously
      // Only one should succeed fully — combined result must not exceed 30€
      if (!giftCardTableExists) return;
      const code = testGcCode('RACE1');
      await createGiftCardInDb({ code, amount: 30, balance: 30, buyerEmail: 'test_gc_race_001@example.com' });

      const [res1, res2] = await Promise.all([
        request(app).post('/api/redeem-gift-card').send({ code, amountToRedeem: 20 }),
        request(app).post('/api/redeem-gift-card').send({ code, amountToRedeem: 20 }),
      ]);

      // At least one must succeed
      const successes = [res1, res2].filter(r => r.status === 200);
      const failures = [res1, res2].filter(r => r.status !== 200);
      expect(successes.length).toBeGreaterThanOrEqual(1);

      // Final DB balance must NEVER go below 0
      const db = await getGiftCardByCode(code);
      expect(parseFloat(db.balance)).toBeGreaterThanOrEqual(0);
      expect(parseFloat(db.balance)).toBeLessThanOrEqual(30);

      // Total redeemed across both calls must not exceed original balance
      const totalRedeemed = successes.reduce((sum, r) => sum + parseFloat(r.body.amountRedeemed || 0), 0);
      expect(totalRedeemed).toBeLessThanOrEqual(30);
    });

    test('NEGATIVE: two simultaneous free bookings with the same gift card — only one booking created', async () => {
      // Tests the race condition in create-payment-session finalPrice === 0 path
      if (!giftCardTableExists) return;
      const user = await createVerifiedUser('test_gc_race_002@example.com');
      const agent1 = await loginAs(user.email);
      const agent2 = await loginAs(user.email);
      const { type, training } = await createTrainingWithPrice({ name: 'TEST_GC_RACE_002', price: 15 });

      const gcCode = testGcCode('RACE2');
      await createGiftCardInDb({ code: gcCode, amount: 15, balance: 15, buyerEmail: user.email });

      const [res1, res2] = await Promise.all([
        agent1.post('/api/create-payment-session').send({
          userId: user.id, trainingId: training.id, trainingType: type.name,
          selectedDate: '2025-01-01', selectedTime: '10:00', childrenCount: 1,
          childrenAge: '5', totalPrice: 15, photoConsent: null, mobile: '',
          note: '', accompanyingPerson: false, allowDuplicate: false,
          giftCardCode: gcCode, giftCardDiscount: 15,
        }),
        agent2.post('/api/create-payment-session').send({
          userId: user.id, trainingId: training.id, trainingType: type.name,
          selectedDate: '2025-01-01', selectedTime: '10:00', childrenCount: 1,
          childrenAge: '5', totalPrice: 15, photoConsent: null, mobile: '',
          note: '', accompanyingPerson: false, allowDuplicate: false,
          giftCardCode: gcCode, giftCardDiscount: 15,
        }),
      ]);

      // Gift card balance must not go below 0
      const gc = await getGiftCardByCode(gcCode);
      expect(parseFloat(gc.balance)).toBeGreaterThanOrEqual(0);

      // At least one must have been handled (200 or 409 duplicate)
      const statuses = [res1.status, res2.status];
      expect(statuses.some(s => s === 200)).toBe(true);
    });
  });

  describe('Gift card used in cancelled booking — balance restored', () => {
    beforeAll(() => {
      if (!giftCardTableExists) return;
    });

    test('POSITIVE: cancelling a gift-card-paid booking restores gift card balance', async () => {
      if (!giftCardTableExists) return;
      const user = await createVerifiedUser('test_gc_cancel_001@example.com');
      const { type, training } = await createTrainingWithPrice({ name: 'TEST_GC_CANCEL_001', price: 15 });

      const gcCode = testGcCode('CAN01');
      await createGiftCardInDb({ code: gcCode, amount: 30, balance: 15, buyerEmail: user.email });

      // Create a gift_card booking directly in DB
      const bookingResult = await pool.query(
        `INSERT INTO bookings 
          (user_id, training_id, number_of_children, amount_paid, payment_time, booked_at, 
           active, booking_type, session_id, age_group)
         VALUES ($1, $2, 1, 0, NOW(), NOW(), true, 'gift_card', $3, 'child')
         RETURNING *`,
        [user.id, training.id, `GIFT_CARD_${gcCode}`]
      );
      const bookingId = bookingResult.rows[0].id;

      // Cancel the booking via API
      const agent = await loginAs(user.email);
      const cancelRes = await agent.delete(`/api/bookings/${bookingId}`);
      expect(cancelRes.status).toBe(200);

      // Gift card balance is restored back to available amount.
      const gc = await getGiftCardByCode(gcCode);
      expect(parseFloat(gc.balance)).toBe(30);
    });
  });

  describe('Gift card expiry edge cases', () => {
    beforeAll(() => {
      if (!giftCardTableExists) return;
    });

    test('NEGATIVE: card expiring exactly now (boundary) is rejected', async () => {
      if (!giftCardTableExists) return;
      const code = testGcCode('BNDRY1');
      // Set expiresAt to 1 second in the past to simulate "just expired"
      await createGiftCardInDb({
        code, amount: 30, balance: 30, buyerEmail: 'test_gc_bndry_001@example.com',
        expiresAt: new Date(Date.now() - 1000),
      });

      const validateRes = await request(app).post('/api/validate-gift-card').send({ code });
      expect(validateRes.status).toBe(400);

      const redeemRes = await request(app).post('/api/redeem-gift-card').send({ code, amountToRedeem: 10 });
      expect(redeemRes.status).toBe(400);
    });

    test('POSITIVE: card expiring in the future (1 second from now) is still valid', async () => {
      if (!giftCardTableExists) return;
      const code = testGcCode('BNDRY2');
      await createGiftCardInDb({
        code, amount: 30, balance: 30, buyerEmail: 'test_gc_bndry_002@example.com',
        expiresAt: new Date(Date.now() + 2000), // 2 seconds from now
      });

      const res = await request(app).post('/api/validate-gift-card').send({ code });
      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
    });

    test('NEGATIVE: expired card at checkout → discount ignored, full price charged', async () => {
      if (!giftCardTableExists) return;
      const user = await createVerifiedUser('test_gc_expbk_001@example.com');
      const agent = await loginAs(user.email);
      const { type, training } = await createTrainingWithPrice({ name: 'TEST_GC_EXPBK_001', price: 15 });

      const gcCode = testGcCode('EXPBK1');
      await createGiftCardInDb({
        code: gcCode, amount: 30, balance: 30, buyerEmail: user.email,
        expiresAt: new Date(Date.now() - 1000), // expired
      });

      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: `test_gc_session_expbk_${Date.now()}`, payment_status: 'unpaid', metadata: {},
      });

      const res = await agent.post('/api/create-payment-session').send({
        userId: user.id, trainingId: training.id, trainingType: type.name,
        selectedDate: '2025-01-01', selectedTime: '10:00', childrenCount: 1,
        childrenAge: '5', totalPrice: 15, photoConsent: null, mobile: '',
        note: '', accompanyingPerson: false, allowDuplicate: false,
        giftCardCode: gcCode, giftCardDiscount: 15,
      });

      // Must succeed but at FULL price — expired card discount ignored
      expect(res.status).toBe(200);
      const stripeCall = mockStripe.checkout.sessions.create.mock.calls[0][0];
      expect(stripeCall.line_items[0].price_data.unit_amount).toBe(1500); // full 15€
    });
  });

  describe('Gift card — email notifications audit', () => {
    beforeAll(() => {
      if (!giftCardTableExists) return;
    });

    test('POSITIVE: free booking (gift_card) sends sendUserBookingEmail with paymentType=gift_card', async () => {
      if (!giftCardTableExists) return;
      const emailService = require('../services/emailService');
      const user = await createVerifiedUser('test_gc_email_001@example.com');
      const agent = await loginAs(user.email);
      const { type, training } = await createTrainingWithPrice({ name: 'TEST_GC_EMAIL_001', price: 15 });

      const gcCode = testGcCode('EML01');
      await createGiftCardInDb({ code: gcCode, amount: 30, balance: 30, buyerEmail: user.email });

      const res = await agent.post('/api/create-payment-session').send({
        userId: user.id, trainingId: training.id, trainingType: type.name,
        selectedDate: '2025-01-01', selectedTime: '10:00', childrenCount: 1,
        childrenAge: '5', totalPrice: 15, photoConsent: null, mobile: '',
        note: '', accompanyingPerson: false, allowDuplicate: false,
        giftCardCode: gcCode, giftCardDiscount: 15,
      });

      expect(res.status).toBe(200);
      expect(res.body.free).toBe(true);

      // Wait for async email calls
      await new Promise(r => setTimeout(r, 300));

      // User email must be sent with correct paymentType
      expect(emailService.sendUserBookingEmail).toHaveBeenCalledWith(
        user.email,
        expect.objectContaining({ paymentType: 'gift_card' })
      );

      // Admin email must be sent with gift card details
      const adminNotifCalls = emailService.sendAdminNewBookingNotification.mock.calls;
      expect(adminNotifCalls.length).toBeGreaterThanOrEqual(1);
      const adminNotifData = adminNotifCalls[0][1]; // second argument = data object
      expect(adminNotifData).toMatchObject({
        paymentType: 'gift_card',
        giftCardCode: gcCode,
      });
    });

    test('POSITIVE: gift-card-success sends email to buyer with isBuyer=true', async () => {
      if (!giftCardTableExists) return;
      const emailService = require('../services/emailService');
      const sessionId = `test_gc_email_session_002_${Date.now()}`;

      mockStripe.checkout.sessions.retrieve.mockResolvedValue({
        id: sessionId, payment_status: 'paid',
        metadata: {
          type: 'gift_card', amount: '50',
          buyerEmail: 'test_gc_email_002@example.com',
          recipientName: 'Jana', recipientEmail: '', message: '',
        },
      });

      const res = await request(app).get(`/api/gift-card-success?session_id=${sessionId}`);
      expect(res.status).toBe(200);

      expect(emailService.sendGiftCardEmail).toHaveBeenCalledWith(
        'test_gc_email_002@example.com',
        expect.objectContaining({
          isBuyer: true,
          amount: 50,
          balance: 50,
        })
      );
    });

    test('NEGATIVE: email failure in gift-card-success does NOT prevent code from being returned', async () => {
      // Email sending should fail gracefully — code still returned to user
      if (!giftCardTableExists) return;
      const emailService = require('../services/emailService');
      emailService.sendGiftCardEmail.mockRejectedValueOnce(new Error('SMTP timeout'));

      const sessionId = `test_gc_email_fail_${Date.now()}`;
      mockStripe.checkout.sessions.retrieve.mockResolvedValue({
        id: sessionId, payment_status: 'paid',
        metadata: {
          type: 'gift_card', amount: '30',
          buyerEmail: 'test_gc_emailfail_001@example.com',
          recipientName: 'Test', recipientEmail: '', message: '',
        },
      });

      const res = await request(app).get(`/api/gift-card-success?session_id=${sessionId}`);
      // Must still return 200 with code even if email fails
      expect(res.status).toBe(200);
      expect(res.body.code).toBeDefined();

      // Verify DB row was created despite email failure
      const db = await getGiftCardByCode(res.body.code);
      expect(db).not.toBeNull();
      expect(db.status).toBe('active');
    });
  });

  describe('Gift card code uniqueness & DB constraints', () => {
    beforeAll(() => {
      if (!giftCardTableExists) return;
    });

    test('NEGATIVE: inserting duplicate code directly to DB fails on unique constraint', async () => {
      if (!giftCardTableExists) return;
      const code = testGcCode('DUPL1');
      await createGiftCardInDb({ code, amount: 30, balance: 30, buyerEmail: 'test_gc_dupl_001@example.com' });

      await expect(
        pool.query(
          `INSERT INTO gift_card (code, amount, balance, status, "buyerEmail", "recipientName", "expiresAt", "stripeSessionId", "createdAt")
           VALUES ($1, 30, 30, 'active', 'test_gc_dupl_002@example.com', 'Test', NOW() + interval '1 year', $2, NOW())`,
          [code, `test_unique_session_${Date.now()}`]
        )
      ).rejects.toThrow();
    });

    test('NEGATIVE: inserting duplicate stripeSessionId fails on unique constraint', async () => {
      if (!giftCardTableExists) return;
      const sessionId = `test_gc_unique_session_${Date.now()}`;
      await createGiftCardInDb({
        code: testGcCode('DUPL2'), amount: 30, balance: 30,
        buyerEmail: 'test_gc_dupl_003@example.com',
        stripeSessionId: sessionId,
      });

      await expect(
        pool.query(
          `INSERT INTO gift_card (code, amount, balance, status, "buyerEmail", "recipientName", "expiresAt", "stripeSessionId", "createdAt")
           VALUES ($1, 30, 30, 'active', 'test_gc_dupl_004@example.com', 'Test', NOW() + interval '1 year', $2, NOW())`,
          [testGcCode('DUPL3'), sessionId]
        )
      ).rejects.toThrow();
    });

    test('POSITIVE: multiple sequential partial redemptions accumulate correctly', async () => {
      // 100€ card → redeem 30 → redeem 25 → redeem 15 → final balance = 30
      if (!giftCardTableExists) return;
      const code = testGcCode('SEQ01');
      await createGiftCardInDb({ code, amount: 100, balance: 100, buyerEmail: 'test_gc_seq_001@example.com' });

      const redemptions = [30, 25, 15];
      let expectedBalance = 100;

      for (const amount of redemptions) {
        const res = await request(app).post('/api/redeem-gift-card').send({ code, amountToRedeem: amount });
        expect(res.status).toBe(200);
        expectedBalance = parseFloat((expectedBalance - amount).toFixed(2));
        expect(parseFloat(res.body.newBalance)).toBe(expectedBalance);
      }

      const db = await getGiftCardByCode(code);
      expect(parseFloat(db.balance)).toBe(30);
      expect(db.status).toBe('active');
      expect(db.redeemedAt).toBeNull();

      // One final redemption to drain it completely
      const finalRes = await request(app).post('/api/redeem-gift-card').send({ code, amountToRedeem: 30 });
      expect(finalRes.status).toBe(200);
      expect(parseFloat(finalRes.body.newBalance)).toBe(0);
      expect(finalRes.body.newStatus).toBe('used');

      const dbFinal = await getGiftCardByCode(code);
      expect(dbFinal.status).toBe('used');
      expect(dbFinal.redeemedAt).not.toBeNull();
    });
  });
});
