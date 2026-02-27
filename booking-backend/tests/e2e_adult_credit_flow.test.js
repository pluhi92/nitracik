// tests/e2e_adult_credit_flow.test.js
// E2E testy pre životný cyklus kreditu pre dospelých
// 
// ⚠️ DÔLEŽITÉ: Tento test odhaľuje BUG v endpointe /api/bookings/use-credit
// Endpoint nekontroluje zhodu training_type medzi kreditom a novým tréningom!

const request = require('supertest');
const { 
  cleanupTestData, 
  createTestUser, 
  createTestTrainingType,
  createTestTraining,
  pool 
} = require('./setup');

// Import reálnej aplikácie z backendu
const { app, pool: serverPool } = require('../server');

// Import bcrypt pre hashovanie hesla
const bcrypt = require('bcryptjs');

// Mock pre email service - aby sa neodosielali reálne emaily
jest.mock('../services/emailService', () => ({
  sendAdultBookingEmail: jest.fn().mockResolvedValue(true),
  sendAdminNewBookingNotification: jest.fn().mockResolvedValue(true),
  sendCancellationEmails: jest.fn().mockResolvedValue(true),
  sendAdminCreditUsage: jest.fn().mockResolvedValue(true),
  sendUserBookingEmail: jest.fn().mockResolvedValue(true)
}));

// Helper funkcie pre testy
async function createAdultTrainingType(name = 'TEST_ADULT_YOGA') {
  const result = await pool.query(
    `INSERT INTO training_types (name, description, duration_minutes, active, audience_type, color_hex)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (name) DO UPDATE SET name = $1
     RETURNING *`,
    [name, 'Testovací typ tréningu pre dospelých', 60, true, 'adults', '#3b82f6']
  );
  return result.rows[0];
}

async function createTrainingWithPrice(trainingTypeId, maxParticipants = 10) {
  // Vytvorenie tréningu
  const trainingResult = await pool.query(
    `INSERT INTO training_availability (training_type_id, training_type, training_date, max_participants)
     VALUES ($1, (SELECT name FROM training_types WHERE id = $1), $2, $3)
     RETURNING *`,
    [trainingTypeId, new Date(Date.now() + 48 * 60 * 60 * 1000), maxParticipants]
  );
  
  // Pridanie ceny
  await pool.query(
    `INSERT INTO training_prices (training_type_id, child_count, price)
     VALUES ($1, 1, 15.00)
     ON CONFLICT (training_type_id, child_count) DO UPDATE SET price = 15.00`,
    [trainingTypeId]
  );
  
  return trainingResult.rows[0];
}

async function createActiveBooking(userId, trainingId, amount = 15.00) {
  const result = await pool.query(
    `INSERT INTO bookings (
      user_id, training_id, number_of_adults, amount_paid,
      payment_intent_id, active, booking_type, age_group, booked_at
    ) VALUES ($1, $2, 1, $3, 'test_payment_intent', true, 'paid', 'adult', NOW())
    RETURNING *`,
    [userId, trainingId, amount]
  );
  return result.rows[0];
}

async function cancelBookingWithCredit(userId, bookingId) {
  // Simulácia zrušenia rezervácie s vytvorením kreditu
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Získanie info o rezervácii
    const bookingResult = await client.query(
      `SELECT b.*, ta.training_type, ta.training_date
       FROM bookings b
       JOIN training_availability ta ON b.training_id = ta.id
       WHERE b.id = $1 AND b.user_id = $2`,
      [bookingId, userId]
    );
    
    if (bookingResult.rows.length === 0) {
      throw new Error('Booking not found');
    }
    
    const booking = bookingResult.rows[0];
    
    // Vytvorenie kreditu
    const creditResult = await client.query(
      `INSERT INTO credits (
        user_id, session_id, child_count, training_type, original_date,
        reason, status, created_at, accompanying_person
      ) VALUES ($1, $2, $3, $4, $5, 'User requested credit on cancellation', 'active', NOW(), false)
      RETURNING *`,
      [userId, booking.training_id, 1, booking.training_type, booking.training_date]
    );
    
    // Zmazanie rezervácie
    await client.query('DELETE FROM bookings WHERE id = $1', [bookingId]);
    
    await client.query('COMMIT');
    return creditResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

describe('E2E Testy - Životný cyklus kreditu pre dospelých', () => {
  let testUser;
  let trainingTypeA;  // Napr. "Joga pre dospelých"
  let trainingTypeB;  // Napr. "Pilates pre dospelých"
  let trainingA1;     // Prvý termín tréningu A
  let trainingA2;     // Druhý termín tréningu A
  let trainingB1;     // Termín tréningu B (iný typ)

  // Pre testy potrebujeme session cookie
  let agent;

  beforeAll(async () => {
    await cleanupTestData();
    
    // Vytvorenie testovacieho používateľa so známym heslom
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    const userResult = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password, address, verified, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET password = $4
       RETURNING *`,
      ['Test', 'User', 'test_credit_flow@example.com', hashedPassword, 'Test Address 123', true, 'user']
    );
    testUser = userResult.rows[0];
    
    // Vytvorenie dvoch rôznych typov tréningov pre dospelých
    trainingTypeA = await createAdultTrainingType('TEST_ADULT_YOGA');
    trainingTypeB = await createAdultTrainingType('TEST_ADULT_PILATES');
    
    // Vytvorenie tréningov
    trainingA1 = await createTrainingWithPrice(trainingTypeA.id);
    trainingA2 = await createTrainingWithPrice(trainingTypeA.id);
    trainingB1 = await createTrainingWithPrice(trainingTypeB.id);
    
    // Vytvorenie agenta pre zachovanie session
    agent = request.agent(app);
    
    // Prihlásenie používateľa
    const loginResponse = await agent
      .post('/api/login')
      .send({
        email: 'test_credit_flow@example.com',
        password: 'testpassword123'
      });
    
    if (loginResponse.status !== 200) {
      console.error('Login failed:', loginResponse.body);
      throw new Error('Failed to login test user');
    }
  });

  afterEach(async () => {
    // Vyčistenie kreditov a bookingov medzi testami
    await pool.query('DELETE FROM credits WHERE user_id = $1', [testUser.id]);
    await pool.query('DELETE FROM bookings WHERE user_id = $1', [testUser.id]);
  });

  afterAll(async () => {
    await cleanupTestData();
    await pool.end();
  });

  describe('Scenár: Úspešný životný cyklus kreditu', () => {
    test('kompletný flow: vytvorenie rezervácie → zrušenie s kreditom → použitie kreditu na rovnaký typ', async () => {
      // KROK 1: Vytvorenie rezervácie
      const booking = await createActiveBooking(testUser.id, trainingA1.id);
      expect(booking).toBeDefined();
      expect(booking.active).toBe(true);
      
      // KROK 2: Zrušenie rezervácie a vytvorenie kreditu
      const credit = await cancelBookingWithCredit(testUser.id, booking.id);
      expect(credit).toBeDefined();
      expect(credit.status).toBe('active');
      expect(credit.training_type).toBe(trainingTypeA.name);
      
      // Overenie že kredit existuje v DB
      const creditCheck = await pool.query(
        'SELECT * FROM credits WHERE id = $1',
        [credit.id]
      );
      expect(creditCheck.rows.length).toBe(1);
      expect(creditCheck.rows[0].status).toBe('active');
      
      // KROK 3: Použitie kreditu na nový termín ROVNAKÉHO typu
      const useCreditResponse = await agent
        .post('/api/bookings/use-credit')
        .send({
          creditId: credit.id,
          trainingId: trainingA2.id,  // Iný termín, ale ROVNAKÝ typ
          mobile: '+421 900 123 456',
          note: 'Rezervácia pomocou kreditu'
        });
      
      // ✅ TOTO BY MALO PREJSŤ - rovnaký training_type
      expect(useCreditResponse.status).toBe(200);
      expect(useCreditResponse.body.success).toBe(true);
      expect(useCreditResponse.body.bookingId).toBeDefined();
      
      // Overenie že kredit bol označený ako použitý
      const usedCredit = await pool.query(
        'SELECT * FROM credits WHERE id = $1',
        [credit.id]
      );
      expect(usedCredit.rows[0].status).toBe('used');
      
      // Overenie že nová rezervácia bola vytvorená
      const newBooking = await pool.query(
        'SELECT * FROM bookings WHERE id = $1',
        [useCreditResponse.body.bookingId]
      );
      expect(newBooking.rows.length).toBe(1);
      expect(newBooking.rows[0].booking_type).toBe('credit');
      expect(newBooking.rows[0].credit_id).toBe(credit.id);
    });
  });

  describe('Edge-case: Pokus o použitie kreditu na INÝ training_type', () => {
    test('malo by ZAMIENTNUŤ použitie kreditu na tréning s iným training_type', async () => {
      // Vytvorenie rezervácie na tréning A
      const booking = await createActiveBooking(testUser.id, trainingA1.id);
      
      // Zrušenie a vytvorenie kreditu pre tréning A
      const credit = await cancelBookingWithCredit(testUser.id, booking.id);
      expect(credit.training_type).toBe(trainingTypeA.name);
      
      // Pokus o použitie kreditu na tréning B (iný typ)
      const useCreditResponse = await agent
        .post('/api/bookings/use-credit')
        .send({
          creditId: credit.id,
          trainingId: trainingB1.id,  // ⚠️ INÝ typ tréningu!
          mobile: '+421 900 123 456'
        });
      
      // ✅ PO OPRAVE: Toto by malo vrátiť 400
      // Kredit je pre trainingTypeA, ale pokus o použitie na trainingTypeB
      expect(useCreditResponse.status).toBe(400);
      expect(useCreditResponse.body.error).toContain('same training type');
      expect(useCreditResponse.body.error).toContain(credit.training_type);
    });
  });

  describe('Edge-case: Pokus o opätovné použitie už použitého kreditu', () => {
    test('malo by ZAMIENTNUŤ použitie kreditu, ktorý bol už použitý', async () => {
      // Vytvorenie rezervácie
      const booking = await createActiveBooking(testUser.id, trainingA1.id);
      
      // Zrušenie a vytvorenie kreditu
      const credit = await cancelBookingWithCredit(testUser.id, booking.id);
      
      // Prvé použitie kreditu
      const firstUse = await agent
        .post('/api/bookings/use-credit')
        .send({
          creditId: credit.id,
          trainingId: trainingA2.id,
          mobile: '+421 900 123 456'
        });
      
      expect(firstUse.status).toBe(200);
      expect(firstUse.body.success).toBe(true);
      
      // Overenie že kredit je použitý
      const creditAfterUse = await pool.query(
        'SELECT * FROM credits WHERE id = $1',
        [credit.id]
      );
      expect(creditAfterUse.rows[0].status).toBe('used');
      
      // Vytvorenie ďalšieho tréningu pre druhý pokus
      const trainingA3 = await createTrainingWithPrice(trainingTypeA.id);
      
      // Druhý pokus o použitie toho istého kreditu
      const secondUse = await agent
        .post('/api/bookings/use-credit')
        .send({
          creditId: credit.id,
          trainingId: trainingA3.id,
          mobile: '+421 900 123 456'
        });
      
      // Toto by malo zlyhať - kredit je už použitý
      expect(secondUse.status).toBe(404);
      expect(secondUse.body.error).toContain('Credit not found or not usable');
    });
  });

  describe('Overenie stavu kreditov v DB', () => {
    test('kredit by mal mať správne nastavené všetky polia', async () => {
      const booking = await createActiveBooking(testUser.id, trainingA1.id);
      const credit = await cancelBookingWithCredit(testUser.id, booking.id);
      
      const creditFromDb = await pool.query(
        `SELECT c.*, ta.training_date as original_training_date
         FROM credits c
         LEFT JOIN training_availability ta ON c.session_id = ta.id
         WHERE c.id = $1`,
        [credit.id]
      );
      
      expect(creditFromDb.rows[0]).toMatchObject({
        user_id: testUser.id,
        training_type: trainingTypeA.name,
        child_count: 1,
        status: 'active',
        accompanying_person: false
      });
      
      // Overenie že original_date je nastavená
      expect(creditFromDb.rows[0].original_date).toBeDefined();
    });
  });
});

// Informácia o bugu pre developera
describe('🐛 BUG REPORT', () => {
  test('informácia o nájdenom bugu', () => {
    console.log(`
    ============================================================
    BUG REPORT: Endpoint /api/bookings/use-credit
    ============================================================
    
    PROBLÉM:
    Endpoint nekontroluje, či sa training_type kreditu zhoduje
    s training_type nového tréningu.
    
    OČAKÁVANÉ SPRÁVANIE:
    - Kredit vytvorený pre "Joga" by mal ísť použiť LEN na "Joga"
    - Pokus o použitie na "Pilates" by mal vrátiť chybu 400
    
    AKTUÁLNE SPRÁVANIE:
    - Kredit je možné použiť na ľubovoľný tréning bez ohľadu na typ
    
    NÁVRH NA OPRAVU:
    V súbore booking-backend/server.js, v endpointe /api/bookings/use-credit
    pridať kontrolu po získaní credit a training záznamov:
    
    // Pridať po riadku 3584 (const training = trainingResult.rows[0];)
    if (credit.training_type !== training.training_type) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Credit can only be used for the same training type: ' + credit.training_type 
      });
    }
    
    ============================================================
    `);
    expect(true).toBe(true);
  });
});
