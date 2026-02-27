// tests/booking.test.js
// Integračné testy pre logiku permanentiek

const request = require('supertest');
const express = require('express');
const { 
  cleanupTestData, 
  createTestUser, 
  createTestSeasonTicket, 
  createTestTraining,
  createTestTrainingType,
  getSeasonTicketById,
  getSeasonTicketUsageCount,
  pool 
} = require('./setup');

// Vytvorenie testovacej Express aplikácie
const app = express();
app.use(express.json());

// Jednoduchý endpoint pre testovanie permanentiek
app.post('/api/use-season-ticket', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { 
      userId, 
      seasonTicketId, 
      trainingId, 
      childrenCount = 1 
    } = req.body;

    // 1. Kontrola permanentky
    const ticketResult = await client.query(
      'SELECT * FROM season_tickets WHERE id = $1 AND user_id = $2',
      [seasonTicketId, userId]
    );

    if (ticketResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Season ticket not found' });
    }

    const ticket = ticketResult.rows[0];

    // 2. Kontrola expirácie
    if (new Date(ticket.expiry_date) < new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Season ticket has expired' });
    }

    // 3. Kontrola počtu vstupov
    if (ticket.entries_remaining < childrenCount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: `Not enough entries. Needed: ${childrenCount}, Available: ${ticket.entries_remaining}` 
      });
    }

    // 4. Kontrola tréningu
    const trainingResult = await client.query(
      'SELECT * FROM training_availability WHERE id = $1',
      [trainingId]
    );

    if (trainingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Training session not found' });
    }

    const training = trainingResult.rows[0];

    // 5. Vytvorenie rezervácie
    const bookingResult = await client.query(
      `INSERT INTO bookings (
        user_id, training_id, number_of_children, 
        booking_type, active, booked_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [userId, trainingId, childrenCount, 'season_ticket', true, new Date()]
    );

    // 6. Zníženie počtu vstupov
    const newRemaining = ticket.entries_remaining - childrenCount;
    await client.query(
      'UPDATE season_tickets SET entries_remaining = $1 WHERE id = $2',
      [newRemaining, seasonTicketId]
    );

    // 7. Záznam použitia permanentky
    await client.query(
      `INSERT INTO season_ticket_usage (
        season_ticket_id, booking_id, used_date
      ) VALUES ($1, $2, $3)`,
      [seasonTicketId, bookingResult.rows[0].id, new Date()]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      booking: bookingResult.rows[0],
      remainingEntries: newRemaining
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error using season ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Endpoint pre získanie permanentiek
app.get('/api/season-tickets/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, p.name as product_name, p.code as product_code
       FROM season_tickets s
       LEFT JOIN season_ticket_products p ON s.season_ticket_product_id = p.id
       WHERE s.user_id = $1
       ORDER BY s.purchase_date DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching season tickets:', error);
    res.status(500).json({ error: 'Failed to fetch season tickets' });
  }
});

// Testovacie dáta
let testUser;
let testTraining;

describe('Integračné testy - Permanentky', () => {
  
  // Pred všetkými testami
  beforeAll(async () => {
    await cleanupTestData();
    testUser = await createTestUser('test_season_ticket@example.com');
    testTraining = await createTestTraining();
  });

  // Po každom teste
  afterEach(async () => {
    // Vyčistenie testovacích dát vytvorených počas testu
    await cleanupTestData();
    // Znovuvytvorenie základných testovacích dát
    testUser = await createTestUser('test_season_ticket@example.com');
    testTraining = await createTestTraining();
  });

  // Po všetkých testoch
  afterAll(async () => {
    await cleanupTestData();
    await pool.end();
  });

  describe('POST /api/use-season-ticket', () => {
    
    test('malo by úspešne použiť permanentku a znížiť počet vstupov', async () => {
      // Arrange
      const seasonTicket = await createTestSeasonTicket(testUser.id, 5, 5);
      const initialRemaining = seasonTicket.entries_remaining;
      
      // Act
      const response = await request(app)
        .post('/api/use-season-ticket')
        .send({
          userId: testUser.id,
          seasonTicketId: seasonTicket.id,
          trainingTypeId: testTraining.training_type_id,
          trainingId: testTraining.id,
          trainingType: testTraining.training_type,
          selectedDate: new Date(testTraining.training_date).toISOString().split('T')[0],
          selectedTime: '10:00',
          childrenCount: 1,
          childrenAge: '5',
          photoConsent: true,
          mobile: '+421 900 123 456',
          note: 'Test rezervácie',
          accompanyingPerson: false
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.booking).toBeDefined();
      expect(response.body.remainingEntries).toBe(initialRemaining - 1);

      // Overenie v databáze
      const updatedTicket = await getSeasonTicketById(seasonTicket.id);
      expect(updatedTicket.entries_remaining).toBe(initialRemaining - 1);

      // Overenie záznamu použitia
      const usageCount = await getSeasonTicketUsageCount(seasonTicket.id);
      expect(usageCount).toBe(1);
    });

    test('malo by zamietnuť rezerváciu pri nulovom zostatku vstupov', async () => {
      // Arrange - vytvorenie permanentky s 0 vstupmi
      const seasonTicket = await createTestSeasonTicket(testUser.id, 5, 0);
      
      // Act
      const response = await request(app)
        .post('/api/use-season-ticket')
        .send({
          userId: testUser.id,
          seasonTicketId: seasonTicket.id,
          trainingTypeId: testTraining.training_type_id,
          trainingId: testTraining.id,
          trainingType: testTraining.training_type,
          selectedDate: new Date(testTraining.training_date).toISOString().split('T')[0],
          selectedTime: '10:00',
          childrenCount: 1,
          childrenAge: '5',
          photoConsent: true,
          mobile: '+421 900 123 456',
          note: 'Test rezervácie',
          accompanyingPerson: false
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Not enough entries');

      // Overenie že stav permanentky sa nezmenil
      const ticket = await getSeasonTicketById(seasonTicket.id);
      expect(ticket.entries_remaining).toBe(0);
    });

    test('malo by zamietnuť rezerváciu keď počet detí presahuje zostatok', async () => {
      // Arrange - vytvorenie permanentky s 1 vstupom
      const seasonTicket = await createTestSeasonTicket(testUser.id, 5, 1);
      
      // Act - pokus o rezerváciu pre 2 deti
      const response = await request(app)
        .post('/api/use-season-ticket')
        .send({
          userId: testUser.id,
          seasonTicketId: seasonTicket.id,
          trainingTypeId: testTraining.training_type_id,
          trainingId: testTraining.id,
          trainingType: testTraining.training_type,
          selectedDate: new Date(testTraining.training_date).toISOString().split('T')[0],
          selectedTime: '10:00',
          childrenCount: 2, // Viac ako dostupné vstupy
          childrenAge: '5, 7',
          photoConsent: true,
          mobile: '+421 900 123 456',
          note: 'Test rezervácie',
          accompanyingPerson: false
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Not enough entries');

      // Overenie že stav permanentky sa nezmenil
      const ticket = await getSeasonTicketById(seasonTicket.id);
      expect(ticket.entries_remaining).toBe(1);
    });

    test('malo by zamietnuť rezerváciu pre expirovanú permanentku', async () => {
      // Arrange - vytvorenie produktu a expirovanej permanentky
      const { createTestSeasonTicketProduct } = require('./setup');
      const product = await createTestSeasonTicketProduct();
      
      const expiredTicket = await pool.query(
        `INSERT INTO season_tickets (
          user_id, season_ticket_product_id, entries_total, entries_remaining, 
          purchase_date, expiry_date, stripe_payment_id, amount_paid
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          testUser.id,
          product.id,
          5,
          5,
          new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000), // pred 12 mesiacmi
          new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),  // expirovala pred 6 mesiacmi
          `test_payment_expired_${Date.now()}`,
          50.00
        ]
      );
      const seasonTicket = expiredTicket.rows[0];
      
      // Act
      const response = await request(app)
        .post('/api/use-season-ticket')
        .send({
          userId: testUser.id,
          seasonTicketId: seasonTicket.id,
          trainingTypeId: testTraining.training_type_id,
          trainingId: testTraining.id,
          trainingType: testTraining.training_type,
          selectedDate: new Date(testTraining.training_date).toISOString().split('T')[0],
          selectedTime: '10:00',
          childrenCount: 1,
          childrenAge: '5',
          photoConsent: true,
          mobile: '+421 900 123 456',
          note: 'Test rezervácie',
          accompanyingPerson: false
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('expired');
    });

    test('malo by úspešne použiť permanentku pre viac detí naraz', async () => {
      // Arrange - vytvorenie permanentky s 5 vstupmi
      const seasonTicket = await createTestSeasonTicket(testUser.id, 5, 5);
      
      // Act - rezervácia pre 3 deti
      const response = await request(app)
        .post('/api/use-season-ticket')
        .send({
          userId: testUser.id,
          seasonTicketId: seasonTicket.id,
          trainingTypeId: testTraining.training_type_id,
          trainingId: testTraining.id,
          trainingType: testTraining.training_type,
          selectedDate: new Date(testTraining.training_date).toISOString().split('T')[0],
          selectedTime: '10:00',
          childrenCount: 3,
          childrenAge: '4, 5, 6',
          photoConsent: true,
          mobile: '+421 900 123 456',
          note: 'Test rezervácie pre 3 deti',
          accompanyingPerson: false
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.remainingEntries).toBe(2); // 5 - 3 = 2

      // Overenie v databáze
      const updatedTicket = await getSeasonTicketById(seasonTicket.id);
      expect(updatedTicket.entries_remaining).toBe(2);
    });

    test('malo by vrátiť 404 pre neexistujúcu permanentku', async () => {
      // Act
      const response = await request(app)
        .post('/api/use-season-ticket')
        .send({
          userId: testUser.id,
          seasonTicketId: 999999, // Neexistujúce ID
          trainingTypeId: testTraining.training_type_id,
          trainingId: testTraining.id,
          trainingType: testTraining.training_type,
          selectedDate: new Date(testTraining.training_date).toISOString().split('T')[0],
          selectedTime: '10:00',
          childrenCount: 1,
          childrenAge: '5',
          photoConsent: true,
          mobile: '+421 900 123 456',
          note: 'Test rezervácie',
          accompanyingPerson: false
        });

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    test('malo by vrátiť 400 pre neexistujúci tréning', async () => {
      // Arrange
      const seasonTicket = await createTestSeasonTicket(testUser.id, 5, 5);
      
      // Act
      const response = await request(app)
        .post('/api/use-season-ticket')
        .send({
          userId: testUser.id,
          seasonTicketId: seasonTicket.id,
          trainingTypeId: 999999, // Neexistujúce ID
          trainingId: 999999,
          trainingType: 'NEEXISTUJUCI_TRENING',
          selectedDate: '2026-01-01',
          selectedTime: '10:00',
          childrenCount: 1,
          childrenAge: '5',
          photoConsent: true,
          mobile: '+421 900 123 456',
          note: 'Test rezervácie',
          accompanyingPerson: false
        });

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/season-tickets/:userId', () => {
    
    test('malo by vrátiť zoznam platných permanentiek používateľa', async () => {
      // Arrange
      await createTestSeasonTicket(testUser.id, 10, 8);
      await createTestSeasonTicket(testUser.id, 5, 3);
      
      // Act
      const response = await request(app)
        .get(`/api/season-tickets/${testUser.id}`)
        .set('Cookie', ['connect.sid=test_session_cookie']);

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      
      // Overenie štruktúry odpovede
      const ticket = response.body[0];
      expect(ticket).toHaveProperty('id');
      expect(ticket).toHaveProperty('entries_total');
      expect(ticket).toHaveProperty('entries_remaining');
      expect(ticket).toHaveProperty('expiry_date');
    });
  });
});

// Spustenie testov
if (require.main === module) {
  console.log('Spúšťam integračné testy...');
  console.log('Uistite sa, že testovacia databáza je dostupná.');
}
