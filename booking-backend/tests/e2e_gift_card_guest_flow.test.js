/**
 * e2e_gift_card_guest_flow.test.js
 *
 * E2E testy pre kompletný flow neregistrovaného kupujúceho:
 *
 * 1. Guest zakúpi DP v hodnotách 15, 30, 50, 100 € — úspešná platba
 * 2. Guest — neúspešná platba → upozornenie emailom
 * 3. Guest sa zaregistruje s rovnakým emailom → nevidí DP v profile (správne)
 * 4. Zaregistrovaný user pridá DP kód manuálne → vidí DP v profile
 *
 * ⚠️  Email service a pdfGenerator sú mockované — žiadne reálne emaily.
 */

const request = require('supertest');
const bcrypt  = require('bcryptjs');
const { cleanupTestData, pool } = require('./setup');

// ─────────────────────────────────────────────────────────────────────────────
// MOCKS
// ─────────────────────────────────────────────────────────────────────────────

const mockStripe = {
  checkout: { sessions: { create: jest.fn(), retrieve: jest.fn() } },
  webhooks: { constructEvent: jest.fn() },
  paymentIntents: { retrieve: jest.fn() },
  refunds: { create: jest.fn() },
};
jest.mock('stripe', () => jest.fn(() => mockStripe));

jest.mock('../services/emailService', () => ({
  sendVerificationEmail:                 jest.fn().mockResolvedValue(true),
  sendUserBookingEmail:                  jest.fn().mockResolvedValue(true),
  sendAdultBookingEmail:                 jest.fn().mockResolvedValue(true),
  sendAdminBookingEmail:                 jest.fn().mockResolvedValue(true),
  sendAdminNewBookingNotification:       jest.fn().mockResolvedValue(true),
  sendAdminGiftCardPurchaseNotification: jest.fn().mockResolvedValue(true),
  sendSeasonTicketConfirmation:          jest.fn().mockResolvedValue(true),
  sendAdminSeasonTicketPurchase:         jest.fn().mockResolvedValue(true),
  sendAdminSeasonTicketUsage:            jest.fn().mockResolvedValue(true),
  sendCancellationEmails:                jest.fn().mockResolvedValue(true),
  sendMassCancellationEmail:             jest.fn().mockResolvedValue(true),
  sendMassCancellationCredit:            jest.fn().mockResolvedValue(true),
  sendMassCancellationSeasonTicket:      jest.fn().mockResolvedValue(true),
  sendRefundConfirmationEmail:           jest.fn().mockResolvedValue(true),
  sendAdminCreditUsage:                  jest.fn().mockResolvedValue(true),
  sendContactFormEmails:                 jest.fn().mockResolvedValue(true),
  sendAccountDeletedEmail:               jest.fn().mockResolvedValue(true),
  sendAdminAccountDeleteNotification:    jest.fn().mockResolvedValue(true),
  sendPaymentFailedEmail:                jest.fn().mockResolvedValue(true),
  sendReviewRequestEmail:                jest.fn().mockResolvedValue(true),
  sendBulkAdminEmail:                    jest.fn().mockResolvedValue(true),
  sendGiftCardEmail:                     jest.fn().mockResolvedValue(true),
}));

jest.mock('../utils/pdfGenerator', () => ({
  generateGiftCardPDF: jest.fn().mockResolvedValue(
    Buffer.from('%PDF-1.4\nmock pdf', 'ascii')
  ),
}));

const { app } = require('../server');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function testGcCode(suffix) {
  return `TESTGC${suffix.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)}`;
}

async function getGiftCardByCode(code) {
  const r = await pool.query('SELECT * FROM gift_card WHERE code = $1', [code]);
  return r.rows[0] || null;
}

async function getGiftCardsByBuyerEmail(email) {
  const r = await pool.query(
    'SELECT * FROM gift_card WHERE "buyerEmail" = $1 ORDER BY "createdAt" DESC',
    [email]
  );
  return r.rows;
}

// Vytvorí Stripe session mock pre úspešnú platbu DP
function mockSuccessfulGcSession({ sessionId, amount, buyerEmail, recipientName, recipientEmail = '', message = '', buyerName = '' }) {
  mockStripe.checkout.sessions.create.mockResolvedValueOnce({
    id: sessionId,
    payment_status: 'unpaid',
    metadata: {},
  });
  mockStripe.checkout.sessions.retrieve.mockResolvedValueOnce({
    id: sessionId,
    payment_status: 'paid',
    metadata: {
      type: 'gift_card',
      amount: String(amount),
      buyerEmail,
      buyerName,
      recipientName,
      recipientEmail,
      message,
    },
  });
}

// Simuluje celý guest purchase flow: session → success endpoint
async function guestPurchaseGiftCard({ amount, buyerEmail, recipientName, recipientEmail = '', message = '', buyerName = '' }) {
  const sessionId = `test_gc_guest_session_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  mockSuccessfulGcSession({ sessionId, amount, buyerEmail, recipientName, recipientEmail, message, buyerName });

  // Krok 1: vytvor Stripe session (guest — bez auth)
  const sessionRes = await request(app)
    .post('/api/create-gift-card-session')
    .send({ amount, buyerEmail, recipientName, recipientEmail, message, buyerName, honeypot: '' });

  if (sessionRes.status !== 200) {
    throw new Error(`Session creation failed: ${JSON.stringify(sessionRes.body)}`);
  }

  // Krok 2: Stripe callback — potvrdenie platby
  const successRes = await request(app)
    .get(`/api/gift-card-success?session_id=${sessionId}`);

  return { sessionRes, successRes, sessionId };
}

// Zaregistruje nového usera
async function registerUser({ email, firstName = 'Test', lastName = 'User', password = 'TestPass123!', address = 'Testova 1, 94901 Nitra' }) {
  const res = await request(app).post('/api/register').send({
    first_name: firstName,
    last_name: lastName,
    email,
    password,
    address,
  });
  return res;
}

// Prihlási usera a vráti agent so session
async function loginAs(email, password = 'TestPass123!') {
  const agent = request.agent(app);
  const r = await agent.post('/api/login').send({ email, password });
  if (r.status !== 200) throw new Error(`Login failed for ${email}: ${JSON.stringify(r.body)}`);
  return agent;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE
// ─────────────────────────────────────────────────────────────────────────────

let giftCardTableExists = false;

describe('E2E – Guest Gift Card Purchase Flow', () => {

  beforeAll(async () => {
    const check = await pool.query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables
         WHERE table_schema='public' AND table_name='gift_card'
       ) AS exists`
    );
    giftCardTableExists = check.rows[0].exists;
    if (!giftCardTableExists) {
      console.warn('⚠️  Tabuľka gift_card neexistuje — testy preskočené');
    }
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await pool.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // ČASŤ 1: Guest zakúpi DP — úspešná platba (všetky hodnoty)
  // ───────────────────────────────────────────────────────────────────────────

  describe('Časť 1 – Guest nákup DP (úspešná platba)', () => {

    test.each([15, 30, 50, 100])(
      'POSITIVE: guest zakúpi DP v hodnote %d€ → kód v DB + email kupujúcemu',
      async (amount) => {
        if (!giftCardTableExists) return;
        const emailService = require('../services/emailService');
        const buyerEmail = `test_gc_guest_${amount}eur@example.com`;

        const { successRes } = await guestPurchaseGiftCard({
          amount,
          buyerEmail,
          recipientName: 'Testovací Obdarovaný',
          buyerName: 'Testovací Kupujúci',
        });

        // 1. Success endpoint vráti 200 s kódom
        expect(successRes.status).toBe(200);
        expect(successRes.body.code).toBeDefined();
        expect(successRes.body.code).toHaveLength(12);
        expect(parseFloat(successRes.body.amount)).toBe(amount);
        expect(parseFloat(successRes.body.balance)).toBe(amount);

        // 2. Poukaz existuje v DB ako aktívny
        const gc = await getGiftCardByCode(successRes.body.code);
        expect(gc).not.toBeNull();
        expect(gc.status).toBe('active');
        expect(parseFloat(gc.amount)).toBe(amount);
        expect(parseFloat(gc.balance)).toBe(amount);
        expect(gc.buyerEmail).toBe(buyerEmail);

        // 3. Email odoslaný kupujúcemu (isBuyer: true)
        expect(emailService.sendGiftCardEmail).toHaveBeenCalledWith(
          buyerEmail,
          expect.objectContaining({
            isBuyer: true,
            amount,
            balance: amount,
          })
        );

        // 4. Admin bol upozornený
        expect(emailService.sendAdminGiftCardPurchaseNotification).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            buyerEmail,
            amount,
          })
        );
      }
    );

    test('POSITIVE: guest zakúpi DP s menom obdarovaného a venovaním → uložené v DB', async () => {
      if (!giftCardTableExists) return;
      const buyerEmail = 'test_gc_guest_full@example.com';

      const { successRes } = await guestPurchaseGiftCard({
        amount: 50,
        buyerEmail,
        recipientName: 'Maťko Testovský',
        recipientEmail: 'test_gc_recipient_full@example.com',
        message: 'Veľa šťastia na narodeniny!',
        buyerName: 'Jana Testovská',
      });

      expect(successRes.status).toBe(200);

      const gc = await getGiftCardByCode(successRes.body.code);
      expect(gc.recipientName).toBe('Maťko Testovský');
      expect(gc.message).toBe('Veľa šťastia na narodeniny!');
    });

    test('POSITIVE: guest zakúpi DP s odlišným emailom obdarovaného → 2 emaily odoslané', async () => {
      if (!giftCardTableExists) return;
      const emailService = require('../services/emailService');
      const buyerEmail    = 'test_gc_guest_buyer2@example.com';
      const recipientEmail = 'test_gc_guest_recip2@example.com';

      const { successRes } = await guestPurchaseGiftCard({
        amount: 30,
        buyerEmail,
        recipientName: 'Iný Obdarovaný',
        recipientEmail,
        buyerName: 'Darujúci Kupujúci',
      });

      expect(successRes.status).toBe(200);

      // Musia byť 2 volania sendGiftCardEmail
      expect(emailService.sendGiftCardEmail).toHaveBeenCalledTimes(2);

      const calls = emailService.sendGiftCardEmail.mock.calls;
      const buyerCall     = calls.find(c => c[1].isBuyer === true);
      const recipientCall = calls.find(c => c[1].isBuyer === false);

      expect(buyerCall).toBeDefined();
      expect(buyerCall[0]).toBe(buyerEmail);

      expect(recipientCall).toBeDefined();
      expect(recipientCall[0]).toBe(recipientEmail);
    });

    test('POSITIVE: idempotencia — rovnaké session_id zavolané 2× → vráti rovnaký kód, nevytvorí duplikát', async () => {
      if (!giftCardTableExists) return;
      const sessionId  = `test_gc_guest_idemp_${Date.now()}`;
      const buyerEmail = 'test_gc_guest_idemp@example.com';

      // Oba retrieve calls vrátia rovnaké dáta
      mockStripe.checkout.sessions.retrieve
        .mockResolvedValue({
          id: sessionId,
          payment_status: 'paid',
          metadata: {
            type: 'gift_card', amount: '30',
            buyerEmail, buyerName: '',
            recipientName: 'Idempotent Test', recipientEmail: '', message: '',
          },
        });

      const res1 = await request(app).get(`/api/gift-card-success?session_id=${sessionId}`);
      const res2 = await request(app).get(`/api/gift-card-success?session_id=${sessionId}`);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.code).toBe(res2.body.code); // rovnaký kód

      // V DB je len 1 záznam pre tento session
      const r = await pool.query(
        'SELECT COUNT(*) as count FROM gift_card WHERE "stripeSessionId" = $1',
        [sessionId]
      );
      expect(parseInt(r.rows[0].count)).toBe(1);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // ČASŤ 2: Neúspešná platba
  // ───────────────────────────────────────────────────────────────────────────

  describe('Časť 2 – Guest nákup DP (neúspešná platba)', () => {

    test('NEGATIVE: Stripe vráti payment_status=unpaid → 400, žiadny kód, žiadny email', async () => {
      if (!giftCardTableExists) return;
      const emailService = require('../services/emailService');
      const sessionId  = `test_gc_guest_fail_${Date.now()}`;
      const buyerEmail = 'test_gc_guest_fail001@example.com';

      mockStripe.checkout.sessions.retrieve.mockResolvedValueOnce({
        id: sessionId,
        payment_status: 'unpaid',
        metadata: {
          type: 'gift_card', amount: '30',
          buyerEmail, buyerName: '',
          recipientName: 'Test', recipientEmail: '', message: '',
        },
      });

      const res = await request(app)
        .get(`/api/gift-card-success?session_id=${sessionId}`);

      // Endpoint musí odmietnuť neplatené session
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();

      // Žiadny poukaz v DB
      const rows = await pool.query(
        'SELECT * FROM gift_card WHERE "stripeSessionId" = $1', [sessionId]
      );
      expect(rows.rows.length).toBe(0);

      // Žiadny email
      expect(emailService.sendGiftCardEmail).not.toHaveBeenCalled();
    });

    test('NEGATIVE: chýbajúce session_id → 400', async () => {
      if (!giftCardTableExists) return;
      const res = await request(app).get('/api/gift-card-success');
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test('NEGATIVE: Stripe vráti payment_status=expired → 400, žiadny kód', async () => {
      if (!giftCardTableExists) return;
      const sessionId  = `test_gc_guest_exp_${Date.now()}`;
      const buyerEmail = 'test_gc_guest_exp001@example.com';

      mockStripe.checkout.sessions.retrieve.mockResolvedValueOnce({
        id: sessionId,
        payment_status: 'expired',
        metadata: {
          type: 'gift_card', amount: '50',
          buyerEmail, buyerName: '',
          recipientName: 'Test', recipientEmail: '', message: '',
        },
      });

      const res = await request(app)
        .get(`/api/gift-card-success?session_id=${sessionId}`);

      expect(res.status).toBe(400);

      const rows = await pool.query(
        'SELECT * FROM gift_card WHERE "stripeSessionId" = $1', [sessionId]
      );
      expect(rows.rows.length).toBe(0);
    });

    test('NEGATIVE: email pri neúspešnej platbe nie je odoslaný (platba neprebehla)', async () => {
      if (!giftCardTableExists) return;
      const emailService = require('../services/emailService');
      const sessionId  = `test_gc_guest_noemail_${Date.now()}`;

      mockStripe.checkout.sessions.retrieve.mockResolvedValueOnce({
        id: sessionId,
        payment_status: 'unpaid',
        metadata: {
          type: 'gift_card', amount: '15',
          buyerEmail: 'test_gc_guest_noemail@example.com',
          buyerName: '', recipientName: 'Test', recipientEmail: '', message: '',
        },
      });

      await request(app).get(`/api/gift-card-success?session_id=${sessionId}`);

      // Žiadny gift card email — platba neprebehla
      expect(emailService.sendGiftCardEmail).not.toHaveBeenCalled();
      expect(emailService.sendAdminGiftCardPurchaseNotification).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // ČASŤ 3: Guest sa zaregistruje → nevidí DP automaticky v profile
  //          (GET /api/gift-cards/user/:id vracia len manuálne uložené poukazy)
  // ───────────────────────────────────────────────────────────────────────────

  describe('Časť 3 – Registrácia s rovnakým emailom → DP nie je automaticky v profile', () => {

    test('POSITIVE: user sa zaregistruje s emailom kde nakúpil DP → GET /api/gift-cards/user/:id vracia prázdne pole', async () => {
      if (!giftCardTableExists) return;
      const buyerEmail = 'test_gc_guest_reg001@example.com';
      const password   = 'TestPass123!';

      // Krok 1: guest nakúpi DP
      const { successRes } = await guestPurchaseGiftCard({
        amount: 30,
        buyerEmail,
        recipientName: 'Obdarovaný',
        buyerName: 'Kupujúci',
      });
      expect(successRes.status).toBe(200);
      const gcCode = successRes.body.code;

      // Krok 2: zaregistruje sa s rovnakým emailom
      const hash = await bcrypt.hash(password, 10);
      const userRes = await pool.query(
        `INSERT INTO users (first_name, last_name, email, password, address, verified, role)
         VALUES ('Test','GCReg',$1,$2,'Testova 1, Nitra',true,'user')
         ON CONFLICT (email) DO UPDATE SET password=$2, verified=true
         RETURNING *`,
        [buyerEmail, hash]
      );
      const user = userRes.rows[0];

      // Krok 3: prihlási sa
      const agent = await loginAs(buyerEmail, password);

      // Krok 4: GET /api/gift-cards/user/:id — vracia len manuálne uložené poukazy
      const gcRes = await agent.get(`/api/gift-cards/user/${user.id}`);

      // Musí vrátiť prázdne pole — DP nie je automaticky priradený,
      // pretože endpoint používa INNER JOIN na user_saved_gift_cards
      expect(gcRes.status).toBe(200);
      expect(Array.isArray(gcRes.body)).toBe(true);
      expect(gcRes.body.length).toBe(0);

      // Kód poukazu existuje v DB (nebol vymazaný)
      const gc = await getGiftCardByCode(gcCode);
      expect(gc).not.toBeNull();
      expect(gc.status).toBe('active');
    });

    test('POSITIVE: registrovaný user nemá v profile žiadne DP ak žiadne nepridal manuálne', async () => {
      if (!giftCardTableExists) return;
      const email    = 'test_gc_newreg_nocard@example.com';
      const password = 'TestPass123!';

      // Vytvorí usera bez žiadneho DP
      const hash = await bcrypt.hash(password, 10);
      const userRes = await pool.query(
        `INSERT INTO users (first_name, last_name, email, password, address, verified, role)
         VALUES ('Test','NoCard',$1,$2,'Testova 1, Nitra',true,'user')
         ON CONFLICT (email) DO UPDATE SET password=$2, verified=true
         RETURNING *`,
        [email, hash]
      );
      const user = userRes.rows[0];
      const agent = await loginAs(email, password);

      // GET user gift cards → prázdne pole
      const gcRes = await agent.get(`/api/gift-cards/user/${user.id}`);
      expect(gcRes.status).toBe(200);
      expect(Array.isArray(gcRes.body)).toBe(true);
      expect(gcRes.body.length).toBe(0);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // ČASŤ 4: User uloží DP manuálne cez /save → vidí ho v profile
  // ───────────────────────────────────────────────────────────────────────────

  describe('Časť 4 – Manuálne uloženie DP do profilu cez /save', () => {

    test('POSITIVE: kompletný flow — guest kúpi DP → zaregistruje sa → uloží kód → vidí DP v profile', async () => {
      if (!giftCardTableExists) return;
      const buyerEmail = 'test_gc_fullflow001@example.com';
      const password   = 'TestPass123!';

      // Krok 1: guest nakúpi DP za 50€
      const { successRes } = await guestPurchaseGiftCard({
        amount: 50,
        buyerEmail,
        recipientName: 'Full Flow Test',
        buyerName: 'Full Flow Buyer',
      });
      expect(successRes.status).toBe(200);
      const gcCode = successRes.body.code;
      expect(gcCode).toHaveLength(12);

      // Krok 2: zaregistruje sa s rovnakým emailom
      const hash = await bcrypt.hash(password, 10);
      const userRes = await pool.query(
        `INSERT INTO users (first_name, last_name, email, password, address, verified, role)
         VALUES ('Full','Flow',$1,$2,'Testova 1, Nitra',true,'user')
         ON CONFLICT (email) DO UPDATE SET password=$2, verified=true
         RETURNING *`,
        [buyerEmail, hash]
      );
      const user = userRes.rows[0];

      // Krok 3: prihlási sa
      const agent = await loginAs(buyerEmail, password);

      // Krok 4: uloží DP kód cez /save endpoint
      const saveRes = await agent
        .post('/api/gift-cards/save')
        .send({ code: gcCode });

      expect(saveRes.status).toBe(200);
      expect(saveRes.body.code).toBe(gcCode);
      expect(parseFloat(saveRes.body.amount)).toBe(50);
      expect(parseFloat(saveRes.body.balance)).toBe(50);
      expect(saveRes.body.status).toBe('active');
      expect(saveRes.body.alreadySaved).toBe(false);
      expect(saveRes.body.expiresAt).toBeDefined();
      expect(saveRes.body.recipientName).toBe('Full Flow Test');

      // Krok 5: GET /api/gift-cards/user/:id — vráti uložený poukaz
      const gcRes = await agent.get(`/api/gift-cards/user/${user.id}`);
      expect(gcRes.status).toBe(200);
      expect(Array.isArray(gcRes.body)).toBe(true);
      expect(gcRes.body.length).toBe(1);
      expect(gcRes.body[0].code).toBe(gcCode);
      expect(parseFloat(gcRes.body[0].balance)).toBe(50);
    });

    test('POSITIVE: user uloží DP kód s pomlčkami (z emailu) → /save uspeje', async () => {
      if (!giftCardTableExists) return;
      const buyerEmail = 'test_gc_fullflow002@example.com';
      const password   = 'TestPass123!';

      // Krok 1: guest nakúpi DP
      const { successRes } = await guestPurchaseGiftCard({
        amount: 30,
        buyerEmail,
        recipientName: 'Dashed Code Test',
        buyerName: 'Buyer Dashed',
      });
      expect(successRes.status).toBe(200);
      const rawCode = successRes.body.code;

      // Simuluje formát kódu z emailu (s pomlčkami)
      const dashedCode = rawCode.replace(/(.{4})/g, '$1-').replace(/-$/, '');

      // Krok 2: registruj a prihlás
      const hash = await bcrypt.hash(password, 10);
      const userRes = await pool.query(
        `INSERT INTO users (first_name, last_name, email, password, address, verified, role)
         VALUES ('Test','Dashed',$1,$2,'Testova 1, Nitra',true,'user')
         ON CONFLICT (email) DO UPDATE SET password=$2, verified=true
         RETURNING *`,
        [buyerEmail, hash]
      );
      const user = userRes.rows[0];
      const agent = await loginAs(buyerEmail, password);

      // Krok 3: uloží kód s pomlčkami cez /save
      const saveRes = await agent
        .post('/api/gift-cards/save')
        .send({ code: dashedCode });

      expect(saveRes.status).toBe(200);
      expect(saveRes.body.code).toBe(rawCode);
      expect(parseFloat(saveRes.body.balance)).toBe(30);
      expect(saveRes.body.alreadySaved).toBe(false);

      // Overenie cez GET
      const gcRes = await agent.get(`/api/gift-cards/user/${user.id}`);
      expect(gcRes.body.length).toBe(1);
      expect(gcRes.body[0].code).toBe(rawCode);
    });

    test('POSITIVE: user uloží DP dvakrát → druhý /save vráti alreadySaved=true (idempotencia)', async () => {
      if (!giftCardTableExists) return;
      const buyerEmail = 'test_gc_fullflow003@example.com';
      const password   = 'TestPass123!';

      const { successRes } = await guestPurchaseGiftCard({
        amount: 15,
        buyerEmail,
        recipientName: 'Double Save Test',
        buyerName: 'Buyer Double',
      });
      const gcCode = successRes.body.code;

      const hash = await bcrypt.hash(password, 10);
      const userRes = await pool.query(
        `INSERT INTO users (first_name, last_name, email, password, address, verified, role)
         VALUES ('Test','Double',$1,$2,'Testova 1, Nitra',true,'user')
         ON CONFLICT (email) DO UPDATE SET password=$2, verified=true
         RETURNING *`,
        [buyerEmail, hash]
      );
      const user = userRes.rows[0];
      const agent = await loginAs(buyerEmail, password);

      // Prvý save
      const save1 = await agent.post('/api/gift-cards/save').send({ code: gcCode });
      expect(save1.status).toBe(200);
      expect(save1.body.alreadySaved).toBe(false);

      // Druhý save — idempotentný
      const save2 = await agent.post('/api/gift-cards/save').send({ code: gcCode });
      expect(save2.status).toBe(200);
      expect(save2.body.alreadySaved).toBe(true);
      expect(save2.body.code).toBe(save1.body.code);
      expect(save2.body.balance).toBe(save1.body.balance);

      // V user_saved_gift_cards je len 1 záznam
      const countRes = await pool.query(
        'SELECT COUNT(*) as count FROM user_saved_gift_cards WHERE user_id = $1 AND gift_card_id = $2',
        [user.id, save1.body.id]
      );
      expect(parseInt(countRes.rows[0].count)).toBe(1);

      // GET vráti len 1 poukaz (nie duplicitne)
      const gcRes = await agent.get(`/api/gift-cards/user/${user.id}`);
      expect(gcRes.body.length).toBe(1);
    });

    test('POSITIVE: user (obdarovaný) uloží DP ktorý mu kúpil niekto iný → vidí ho v profile', async () => {
      if (!giftCardTableExists) return;
      const recipientEmail = 'test_gc_recipient_reg@example.com';
      const password       = 'TestPass123!';

      // Iný guest (kupujúci) zakúpi DP pre tohto usera
      const { successRes } = await guestPurchaseGiftCard({
        amount: 100,
        buyerEmail: 'test_gc_other_buyer@example.com',
        recipientName: 'Recipient Registered',
        recipientEmail,
        buyerName: 'Other Buyer',
      });
      expect(successRes.status).toBe(200);
      const gcCode = successRes.body.code;

      // Obdarovaný sa zaregistruje
      const hash = await bcrypt.hash(password, 10);
      const userRes = await pool.query(
        `INSERT INTO users (first_name, last_name, email, password, address, verified, role)
         VALUES ('Recipient','Registered',$1,$2,'Testova 1, Nitra',true,'user')
         ON CONFLICT (email) DO UPDATE SET password=$2, verified=true
         RETURNING *`,
        [recipientEmail, hash]
      );
      const user = userRes.rows[0];
      const agent = await loginAs(recipientEmail, password);

      // Obdarovaný uloží kód ktorý dostal v emaili
      const saveRes = await agent
        .post('/api/gift-cards/save')
        .send({ code: gcCode });

      expect(saveRes.status).toBe(200);
      expect(saveRes.body.code).toBe(gcCode);
      expect(parseFloat(saveRes.body.amount)).toBe(100);
      expect(parseFloat(saveRes.body.balance)).toBe(100);
      expect(saveRes.body.status).toBe('active');
      expect(saveRes.body.alreadySaved).toBe(false);

      // Overenie cez GET
      const gcRes = await agent.get(`/api/gift-cards/user/${user.id}`);
      expect(gcRes.body.length).toBe(1);
      expect(gcRes.body[0].code).toBe(gcCode);
    });

    test('NEGATIVE: user zadá neplatný kód → /save vráti 404', async () => {
      if (!giftCardTableExists) return;
      const email    = 'test_gc_invalid_save@example.com';
      const password = 'TestPass123!';

      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        `INSERT INTO users (first_name, last_name, email, password, address, verified, role)
         VALUES ('Test','Invalid',$1,$2,'Testova 1, Nitra',true,'user')
         ON CONFLICT (email) DO UPDATE SET password=$2, verified=true`,
        [email, hash]
      );
      const agent = await loginAs(email, password);

      const saveRes = await agent
        .post('/api/gift-cards/save')
        .send({ code: 'UPLNEZIAKOD123' });

      expect(saveRes.status).toBe(404);
      expect(saveRes.body.error).toBeDefined();
    });

    test('NEGATIVE: user zadá prázdny kód → /save vráti 400', async () => {
      if (!giftCardTableExists) return;
      const email    = 'test_gc_empty_save@example.com';
      const password = 'TestPass123!';

      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        `INSERT INTO users (first_name, last_name, email, password, address, verified, role)
         VALUES ('Test','Empty',$1,$2,'Testova 1, Nitra',true,'user')
         ON CONFLICT (email) DO UPDATE SET password=$2, verified=true`,
        [email, hash]
      );
      const agent = await loginAs(email, password);

      const saveRes = await agent
        .post('/api/gift-cards/save')
        .send({ code: '' });

      expect(saveRes.status).toBe(400);
    });

    test('NEGATIVE: neautentifikovaný user nemôže použiť /save → 401', async () => {
      if (!giftCardTableExists) return;
      const saveRes = await request(app)
        .post('/api/gift-cards/save')
        .send({ code: 'NEJAKYKOD123' });

      expect(saveRes.status).toBe(401);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // ČASŤ 5: /save edge cases — vyčerpaný, expirovaný, konflikt s iným userom
  // ───────────────────────────────────────────────────────────────────────────

  describe('Časť 5 – /save edge cases', () => {

    test('NEGATIVE: user sa pokúsi uložiť vyčerpaný poukaz (balance=0) → 400', async () => {
      if (!giftCardTableExists) return;
      const email    = 'test_gc_save_used@example.com';
      const password = 'TestPass123!';

      // Vytvoríme poukaz s balance=0 priamo v DB
      const usedCode = `TESTGC_USED_${Date.now()}`.slice(0, 16);
      await pool.query(
        `INSERT INTO gift_card (code, amount, balance, status, "buyerEmail", "recipientName", "expiresAt", "createdAt")
         VALUES ($1, 50, 0, 'used', 'test_gc_save_used_buyer@example.com', 'Used Card', NOW() + INTERVAL '30 days', NOW())`,
        [usedCode]
      );

      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        `INSERT INTO users (first_name, last_name, email, password, address, verified, role)
         VALUES ('Test','UsedSave',$1,$2,'Testova 1, Nitra',true,'user')
         ON CONFLICT (email) DO UPDATE SET password=$2, verified=true`,
        [email, hash]
      );
      const agent = await loginAs(email, password);

      const saveRes = await agent
        .post('/api/gift-cards/save')
        .send({ code: usedCode });

      expect(saveRes.status).toBe(400);
      expect(saveRes.body.error).toBeDefined();
      expect(saveRes.body.status).toBe('used');
    });

    test('NEGATIVE: user sa pokúsi uložiť expirovaný poukaz → 400', async () => {
      if (!giftCardTableExists) return;
      const email    = 'test_gc_save_expired@example.com';
      const password = 'TestPass123!';

      // Vytvoríme expirovaný poukaz priamo v DB
      const expiredCode = `TESTGC_EXP_${Date.now()}`.slice(0, 16);
      await pool.query(
        `INSERT INTO gift_card (code, amount, balance, status, "buyerEmail", "recipientName", "expiresAt", "createdAt")
         VALUES ($1, 30, 30, 'active', 'test_gc_save_exp_buyer@example.com', 'Expired Card', NOW() - INTERVAL '1 day', NOW() - INTERVAL '31 days')`,
        [expiredCode]
      );

      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        `INSERT INTO users (first_name, last_name, email, password, address, verified, role)
         VALUES ('Test','ExpSave',$1,$2,'Testova 1, Nitra',true,'user')
         ON CONFLICT (email) DO UPDATE SET password=$2, verified=true`,
        [email, hash]
      );
      const agent = await loginAs(email, password);

      const saveRes = await agent
        .post('/api/gift-cards/save')
        .send({ code: expiredCode });

      expect(saveRes.status).toBe(400);
      expect(saveRes.body.error).toBeDefined();
      expect(saveRes.body.status).toBe('expired');
    });

    test('NEGATIVE: user A uloží poukaz → user B sa pokúsi uložiť ten istý → 409', async () => {
      if (!giftCardTableExists) return;
      const emailA    = 'test_gc_save_conflict_a@example.com';
      const emailB    = 'test_gc_save_conflict_b@example.com';
      const password  = 'TestPass123!';

      // Krok 1: guest nakúpi DP
      const { successRes } = await guestPurchaseGiftCard({
        amount: 30,
        buyerEmail: 'test_gc_save_conflict_buyer@example.com',
        recipientName: 'Conflict Test',
        buyerName: 'Buyer',
      });
      expect(successRes.status).toBe(200);
      const gcCode = successRes.body.code;

      // Krok 2: vytvoríme userov A a B
      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        `INSERT INTO users (first_name, last_name, email, password, address, verified, role)
         VALUES ('User','A',$1,$2,'Testova 1, Nitra',true,'user')
         ON CONFLICT (email) DO UPDATE SET password=$2, verified=true`,
        [emailA, hash]
      );
      await pool.query(
        `INSERT INTO users (first_name, last_name, email, password, address, verified, role)
         VALUES ('User','B',$1,$2,'Testova 1, Nitra',true,'user')
         ON CONFLICT (email) DO UPDATE SET password=$2, verified=true`,
        [emailB, hash]
      );

      // Krok 3: user A úspešne uloží poukaz
      const agentA = await loginAs(emailA, password);
      const saveA = await agentA.post('/api/gift-cards/save').send({ code: gcCode });
      expect(saveA.status).toBe(200);
      expect(saveA.body.alreadySaved).toBe(false);

      // Krok 4: user B sa pokúsi uložiť ten istý poukaz → 409
      const agentB = await loginAs(emailB, password);
      const saveB = await agentB.post('/api/gift-cards/save').send({ code: gcCode });
      expect(saveB.status).toBe(409);
      expect(saveB.body.error).toBeDefined();

      // Krok 5: user A stále vidí poukaz vo svojom profile
      const gcResA = await agentA.get(`/api/gift-cards/user/${(await pool.query('SELECT id FROM users WHERE email = $1', [emailA])).rows[0].id}`);
      expect(gcResA.body.length).toBe(1);

      // Krok 6: user B nemá poukaz v profile
      const gcResB = await agentB.get(`/api/gift-cards/user/${(await pool.query('SELECT id FROM users WHERE email = $1', [emailB])).rows[0].id}`);
      expect(gcResB.body.length).toBe(0);
    });
  });
});