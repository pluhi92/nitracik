/**
 * e2e_gift_card_new_endpoints.test.js
 *
 * E2E testy pre nové endpointy implementované v aktuálnom sprintu:
 *
 * 1. POST /api/gift-cards/lookup  — manuálne vyhľadanie poukazu v profile
 * 2. GET  /api/gift-cards/:code/pdf — stiahnutie PDF poukazu
 *
 * Testy pokrývajú:
 * - Pozitívne scenáre (správne vstupy, očakávané odpovede)
 * - Negatívne scenáre (neexistujúci kód, prázdny vstup, rôzne formáty kódu)
 * - Edge cases (kódy s pomlčkami vs. bez, rôzne statusy poukazov)
 *
 * ⚠️  Email service a pdfGenerator sú mockované — žiadne reálne emaily ani PDF.
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

// Mock pdfGenerator — vracia validný PDF buffer (Uint8Array ako Puppeteer)
jest.mock('../utils/pdfGenerator', () => ({
  generateGiftCardPDF: jest.fn().mockResolvedValue(
    Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n%%EOF', 'ascii')
  ),
}));

const { app } = require('../server');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function testGcCode(suffix) {
  return `TESTGC${suffix.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)}`;
}

async function createVerifiedUser(email, role = 'user') {
  const hash = await bcrypt.hash('TestPass123!', 10);
  const r = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password, address, mobile, verified, role)
     VALUES ('Test','GC',$1,$2,'Testova 1, Nitra','+421900000001',true,$3)
     ON CONFLICT (email) DO UPDATE SET password=$2, verified=true, role=$3
     RETURNING *`,
    [email, hash, role]
  );
  return r.rows[0];
}

async function loginAs(email) {
  const agent = request.agent(app);
  const r = await agent.post('/api/login').send({ email, password: 'TestPass123!' });
  if (r.status !== 200) throw new Error(`Login failed for ${email}: ${JSON.stringify(r.body)}`);
  return agent;
}

async function createGiftCardInDb({
  code,
  amount = 30,
  balance = 30,
  status = 'active',
  buyerEmail = 'test_gc_buyer@example.com',
  recipientName = 'Test Recipient',
  recipientEmail = null,
  message = null,
  expiresAt = null,
  stripeSessionId = null,
}) {
  const expires  = expiresAt  || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const sessionId = stripeSessionId || `test_gc_session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const r = await pool.query(
    `INSERT INTO gift_card
      (code, amount, balance, status, "buyerEmail", "recipientName", "recipientEmail",
       message, "expiresAt", "stripeSessionId", "createdAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
     ON CONFLICT (code) DO UPDATE SET balance=$3, status=$4
     RETURNING *`,
    [code, amount, balance, status, buyerEmail, recipientName, recipientEmail, message, expires, sessionId]
  );
  return r.rows[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE
// ─────────────────────────────────────────────────────────────────────────────

let giftCardTableExists = false;

describe('E2E – Nové Gift Card endpointy (lookup + PDF download)', () => {

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
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. POST /api/gift-cards/lookup
  // ───────────────────────────────────────────────────────────────────────────

  describe('POST /api/gift-cards/lookup', () => {

    describe('Pozitívne scenáre', () => {

      test('POSITIVE: aktívny poukaz — vráti správne dáta', async () => {
        if (!giftCardTableExists) return;
        const code = testGcCode('LKP001');
        await createGiftCardInDb({
          code,
          amount: 50,
          balance: 50,
          buyerEmail: 'test_gc_lkp001@example.com',
          recipientName: 'Jana Nováková',
          message: 'Pre teba s láskou',
        });

        const res = await request(app)
          .post('/api/gift-cards/lookup')
          .send({ code });

        expect(res.status).toBe(200);
        expect(res.body.code).toBe(code);
        expect(parseFloat(res.body.amount)).toBe(50);
        expect(parseFloat(res.body.balance)).toBe(50);
        expect(res.body.status).toBe('active');
        expect(res.body.recipientName).toBe('Jana Nováková');
        expect(res.body.expiresAt).toBeDefined();
        // buyerEmail nesmie byť v response — bezpečnosť
        expect(res.body.buyerEmail).toBeUndefined();
      });

      test('POSITIVE: kód s pomlčkami (napr. ABCD-1234-EFGH) — nájde poukaz', async () => {
        if (!giftCardTableExists) return;
        const rawCode = testGcCode('LKP002');
        await createGiftCardInDb({
          code: rawCode,
          amount: 30,
          balance: 20,
          buyerEmail: 'test_gc_lkp002@example.com',
        });

        // Pošleme kód s pomlčkami — endpoint musí normalizovať
        const dashedCode = rawCode.replace(/(.{4})/g, '$1-').replace(/-$/, '');

        const res = await request(app)
          .post('/api/gift-cards/lookup')
          .send({ code: dashedCode });

        expect(res.status).toBe(200);
        expect(res.body.code).toBe(rawCode);
        expect(parseFloat(res.body.balance)).toBe(20);
      });

      test('POSITIVE: kód malými písmenami — nájde poukaz (case-insensitive)', async () => {
        if (!giftCardTableExists) return;
        const code = testGcCode('LKP003');
        await createGiftCardInDb({
          code,
          amount: 15,
          balance: 15,
          buyerEmail: 'test_gc_lkp003@example.com',
        });

        const res = await request(app)
          .post('/api/gift-cards/lookup')
          .send({ code: code.toLowerCase() });

        expect(res.status).toBe(200);
        expect(res.body.code).toBe(code);
      });

      test('POSITIVE: čiastočne vyčerpaný poukaz — zobrazí aktuálny zostatok', async () => {
        if (!giftCardTableExists) return;
        const code = testGcCode('LKP004');
        await createGiftCardInDb({
          code,
          amount: 100,
          balance: 35,
          buyerEmail: 'test_gc_lkp004@example.com',
        });

        const res = await request(app)
          .post('/api/gift-cards/lookup')
          .send({ code });

        expect(res.status).toBe(200);
        expect(parseFloat(res.body.amount)).toBe(100);
        expect(parseFloat(res.body.balance)).toBe(35);
        expect(res.body.status).toBe('active');
      });

      test('POSITIVE: použitý poukaz (status=used) — stále ho vráti (user vidí históriu)', async () => {
        if (!giftCardTableExists) return;
        const code = testGcCode('LKP005');
        await createGiftCardInDb({
          code,
          amount: 30,
          balance: 0,
          status: 'used',
          buyerEmail: 'test_gc_lkp005@example.com',
        });

        const res = await request(app)
          .post('/api/gift-cards/lookup')
          .send({ code });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('used');
        expect(parseFloat(res.body.balance)).toBe(0);
      });

      test('POSITIVE: expirovaný poukaz — stále ho vráti (user vidí históriu)', async () => {
        if (!giftCardTableExists) return;
        const code = testGcCode('LKP006');
        await createGiftCardInDb({
          code,
          amount: 50,
          balance: 50,
          buyerEmail: 'test_gc_lkp006@example.com',
          expiresAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // pred týždňom
        });

        const res = await request(app)
          .post('/api/gift-cards/lookup')
          .send({ code });

        expect(res.status).toBe(200);
        expect(res.body.code).toBe(code);
        // Endpoint len vráti dáta — nevaliduje expiráciu (to robí /validate-gift-card)
      });

      test('POSITIVE: kód s medzerami okolo — normalize whitespace', async () => {
        if (!giftCardTableExists) return;
        const code = testGcCode('LKP007');
        await createGiftCardInDb({
          code,
          amount: 30,
          balance: 30,
          buyerEmail: 'test_gc_lkp007@example.com',
        });

        const res = await request(app)
          .post('/api/gift-cards/lookup')
          .send({ code: `  ${code}  ` });

        expect(res.status).toBe(200);
        expect(res.body.code).toBe(code);
      });
    });

    describe('Negatívne scenáre', () => {

      test('NEGATIVE: neexistujúci kód → 404', async () => {
        if (!giftCardTableExists) return;
        const res = await request(app)
          .post('/api/gift-cards/lookup')
          .send({ code: 'TESTGCNONEXIST' });

        expect(res.status).toBe(404);
        expect(res.body.error).toBeDefined();
      });

      test('NEGATIVE: prázdny kód → 400', async () => {
        if (!giftCardTableExists) return;
        const res = await request(app)
          .post('/api/gift-cards/lookup')
          .send({ code: '' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
      });

      test('NEGATIVE: chýbajúce pole code → 400', async () => {
        if (!giftCardTableExists) return;
        const res = await request(app)
          .post('/api/gift-cards/lookup')
          .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
      });

      test('NEGATIVE: kód len z medzier → 400', async () => {
        if (!giftCardTableExists) return;
        const res = await request(app)
          .post('/api/gift-cards/lookup')
          .send({ code: '     ' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
      });

      test('NEGATIVE: náhodný dlhý string → 404', async () => {
        if (!giftCardTableExists) return;
        const res = await request(app)
          .post('/api/gift-cards/lookup')
          .send({ code: 'XXXXXXXXXXXXXXXXXXXXXXXXXXX' });

        expect(res.status).toBe(404);
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. GET /api/gift-cards/:code/pdf
  // ───────────────────────────────────────────────────────────────────────────

  describe('GET /api/gift-cards/:code/pdf', () => {

    beforeEach(() => {
      // Reset Stripe mock pred každým testom
      mockStripe.checkout.sessions.retrieve.mockResolvedValue({
        id: `test_pdf_session_${Date.now()}`,
        payment_status: 'paid',
        metadata: {
          type: 'gift_card',
          amount: '30',
          buyerName: 'Ján Kupujúci',
          buyerEmail: 'test_gc_pdfbuyer@example.com',
          recipientName: 'Test Recipient',
          recipientEmail: '',
          message: '',
        },
      });
    });

    describe('Pozitívne scenáre', () => {

      test('POSITIVE: vráti PDF buffer s correct Content-Type', async () => {
        if (!giftCardTableExists) return;
        const code = testGcCode('PDF001');
        await createGiftCardInDb({
          code,
          amount: 30,
          balance: 30,
          buyerEmail: 'test_gc_pdf001@example.com',
          recipientName: 'Mária Testová',
        });

        const res = await request(app)
          .get(`/api/gift-cards/${code}/pdf`)
          .buffer(true)
          .parse((res, callback) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => callback(null, Buffer.concat(chunks)));
          });

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('application/pdf');
        expect(res.headers['content-disposition']).toContain('attachment');
        expect(res.headers['content-disposition']).toContain('darcekovy-poukaz-nitracik.pdf');
        expect(res.body).toBeInstanceOf(Buffer);
        expect(res.body.length).toBeGreaterThan(0);
      });

      test('POSITIVE: generateGiftCardPDF bol zavolaný so správnymi parametrami', async () => {
        if (!giftCardTableExists) return;
        const { generateGiftCardPDF } = require('../utils/pdfGenerator');
        generateGiftCardPDF.mockClear();

        const code = testGcCode('PDF002');
        const gc = await createGiftCardInDb({
          code,
          amount: 50,
          balance: 50,
          buyerEmail: 'test_gc_pdf002@example.com',
          recipientName: 'Peter Novák',
          message: 'Darček pre teba',
        });

        await request(app)
          .get(`/api/gift-cards/${code}/pdf`)
          .buffer(true);

        expect(generateGiftCardPDF).toHaveBeenCalledTimes(1);
        const callArgs = generateGiftCardPDF.mock.calls[0][0];
        expect(callArgs.code).toBe(code);
        expect(parseFloat(callArgs.amount)).toBe(50);
        expect(callArgs.recipientName).toBe('Peter Novák');
        expect(callArgs.message).toBe('Darček pre teba');
      });

      test('POSITIVE: kód s pomlčkami v URL — nájde poukaz', async () => {
        if (!giftCardTableExists) return;
        const rawCode = testGcCode('PDF003');
        await createGiftCardInDb({
          code: rawCode,
          amount: 30,
          balance: 30,
          buyerEmail: 'test_gc_pdf003@example.com',
        });

        const dashedCode = rawCode.replace(/(.{4})/g, '$1-').replace(/-$/, '');

        const res = await request(app)
          .get(`/api/gift-cards/${dashedCode}/pdf`)
          .buffer(true);

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('application/pdf');
      });

      test('POSITIVE: použitý poukaz — PDF stále dostupné', async () => {
        if (!giftCardTableExists) return;
        const code = testGcCode('PDF004');
        await createGiftCardInDb({
          code,
          amount: 30,
          balance: 0,
          status: 'used',
          buyerEmail: 'test_gc_pdf004@example.com',
        });

        const res = await request(app)
          .get(`/api/gift-cards/${code}/pdf`)
          .buffer(true);

        // PDF endpoint nevyžaduje aktívny status — len kód musí existovať
        expect(res.status).toBe(200);
      });

      test('POSITIVE: PDF failure je non-fatal — vráti 500 ale nepadne server', async () => {
        if (!giftCardTableExists) return;
        const { generateGiftCardPDF } = require('../utils/pdfGenerator');
        generateGiftCardPDF.mockRejectedValueOnce(new Error('Puppeteer crash'));

        const code = testGcCode('PDF005');
        await createGiftCardInDb({
          code,
          amount: 30,
          balance: 30,
          buyerEmail: 'test_gc_pdf005@example.com',
        });

        const res = await request(app)
          .get(`/api/gift-cards/${code}/pdf`);

        // Server musí vrátiť 500 s chybou — nie crashnúť
        expect(res.status).toBe(500);
        expect(res.body.error).toBeDefined();

        // Overíme že server stále funguje
        const healthRes = await request(app).get('/api/gift-cards/lookup').send({ code: 'TEST' });
        // Ak server beží, dostaneme nejakú odpoveď (nie network error)
        expect(healthRes.status).toBeDefined();
      });
    });

    describe('Negatívne scenáre', () => {

      test('NEGATIVE: neexistujúci kód → 404', async () => {
        if (!giftCardTableExists) return;
        const res = await request(app)
          .get('/api/gift-cards/TESTGCNONEXIST/pdf');

        expect(res.status).toBe(404);
        expect(res.body.error).toBeDefined();
      });

      test('NEGATIVE: prázdny kód v URL → 400 alebo 404', async () => {
        if (!giftCardTableExists) return;
        // Express router nepovolí prázdny :code parameter — vráti 404 z routera
        const res = await request(app)
          .get('/api/gift-cards//pdf');

        expect([400, 404]).toContain(res.status);
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Integrácia: lookup → zobrazenie → PDF download flow
  // ───────────────────────────────────────────────────────────────────────────

  describe('Integračný flow: lookup → PDF', () => {

    test('POSITIVE: user vyhľadá poukaz cez lookup a stiahne PDF', async () => {
      if (!giftCardTableExists) return;
      const { generateGiftCardPDF } = require('../utils/pdfGenerator');
      generateGiftCardPDF.mockClear();

      const code = testGcCode('FLOW01');
      await createGiftCardInDb({
        code,
        amount: 100,
        balance: 75,
        buyerEmail: 'test_gc_flow001@example.com',
        recipientName: 'Zuzka Krásna',
        message: 'Veľa šťastia!',
      });

      // Krok 1: user zadá kód v profile — lookup
      const lookupRes = await request(app)
        .post('/api/gift-cards/lookup')
        .send({ code });

      expect(lookupRes.status).toBe(200);
      expect(lookupRes.body.code).toBe(code);
      expect(parseFloat(lookupRes.body.balance)).toBe(75);

      // Krok 2: user klikne "Stiahnuť PDF" — download
      const pdfRes = await request(app)
        .get(`/api/gift-cards/${code}/pdf`)
        .buffer(true);

      expect(pdfRes.status).toBe(200);
      expect(pdfRes.headers['content-type']).toContain('application/pdf');
      expect(generateGiftCardPDF).toHaveBeenCalledTimes(1);
    });

    test('POSITIVE: lookup vráti createdAt a expiresAt v ISO formáte', async () => {
      if (!giftCardTableExists) return;
      const code = testGcCode('FLOW02');
      const expiresAt = new Date(Date.now() + 200 * 24 * 60 * 60 * 1000);
      await createGiftCardInDb({
        code,
        amount: 30,
        balance: 30,
        buyerEmail: 'test_gc_flow002@example.com',
        expiresAt,
      });

      const res = await request(app)
        .post('/api/gift-cards/lookup')
        .send({ code });

      expect(res.status).toBe(200);
      expect(res.body.expiresAt).toBeDefined();
      expect(new Date(res.body.expiresAt).getTime()).toBeGreaterThan(Date.now());
      expect(res.body.createdAt).toBeDefined();
    });

    test('NEGATIVE: lookup → PDF na neexistujúci kód → oboje vrátia chybu konzistentne', async () => {
      if (!giftCardTableExists) return;
      const fakeCode = 'TESTGCFAKE99';

      const lookupRes = await request(app)
        .post('/api/gift-cards/lookup')
        .send({ code: fakeCode });
      expect(lookupRes.status).toBe(404);

      const pdfRes = await request(app)
        .get(`/api/gift-cards/${fakeCode}/pdf`);
      expect(pdfRes.status).toBe(404);
    });
  });
});