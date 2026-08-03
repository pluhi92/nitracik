// tests/e2e_admin_panel_functions.test.js
// E2E testy pre admin panel funkcie — Training Types CRUD operácie
// Pokrýva: vytvorenie, editácia popisu, toggle visibility, delete, chybové stavy

const request = require('supertest');
const express = require('express');
const {
  cleanupTestData,
  createTestUser,
  createTestTrainingType,
  createTestTraining,
  pool
} = require('./setup');

// ============================================
// MOCK EMAIL SERVICE
// ============================================
jest.mock('../services/emailService', () => ({
  sendAdultBookingEmail: jest.fn().mockResolvedValue(true),
  sendAdminNewBookingNotification: jest.fn().mockResolvedValue(true),
  sendCancellationEmails: jest.fn().mockResolvedValue(true),
  sendMassCancellationEmail: jest.fn().mockResolvedValue(true),
  sendMassCancellationCredit: jest.fn().mockResolvedValue(true),
  sendMassCancellationSeasonTicket: jest.fn().mockResolvedValue(true),
  sendRefundConfirmationEmail: jest.fn().mockResolvedValue(true)
}));

// ============================================
// TEST EXPRESS APP
// ============================================
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

// Auth middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) return next();
  res.status(401).json({ error: 'Unauthorized' });
};

const isAdmin = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  if (req.session.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Admin access required' });
  next();
};

// ============================================
// ENDPOINTY PRE TESTOVANIE
// ============================================

// GET /api/training-types — zoznam typov s audience filtrom
app.get('/api/training-types', async (req, res) => {
  try {
    const isAdminRequest = req.query.admin === 'true';
    const audienceType = req.query.audience;

    let query = `
      SELECT t.*,
             COALESCE(json_agg(json_build_object('child_count', p.child_count, 'price', p.price))
               FILTER (WHERE p.id IS NOT NULL), '[]') as prices
      FROM training_types t
      LEFT JOIN training_prices p ON t.id = p.training_type_id
    `;

    const conditions = [];
    if (!isAdminRequest) {
      conditions.push(`t.active = TRUE`);
    }
    if (audienceType) {
      conditions.push(`(t.audience_type = '${audienceType}' OR t.audience_type = 'both')`);
    }
    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    query += ` GROUP BY t.id ORDER BY t.name ASC`;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/training-types — vytvorenie nového typu
app.post('/api/admin/training-types', isAdmin, async (req, res) => {
  const { name, description, durationMinutes, prices, accompanyingPrice, colorHex, audienceType } = req.body;

  // Validácia
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check for duplicate name
    const dupCheck = await client.query(
      'SELECT id FROM training_types WHERE LOWER(name) = LOWER($1)',
      [name.trim()]
    );
    if (dupCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Training type with this name already exists' });
    }

    const typeResult = await client.query(
      `INSERT INTO training_types (name, description, duration_minutes, accompanying_person_price, color_hex, audience_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        name.trim(),
        description || '',
        durationMinutes || 60,
        accompanyingPrice ?? 3.00,
        colorHex || '#3b82f6',
        audienceType || 'children',
      ]
    );
    const typeId = typeResult.rows[0].id;

    if (prices && Array.isArray(prices)) {
      for (const p of prices) {
        if (p.price < 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Price cannot be negative' });
        }
        await client.query(
          `INSERT INTO training_prices (training_type_id, child_count, price) VALUES ($1, $2, $3)`,
          [typeId, p.child_count, p.price]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, id: typeId });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// PUT /api/admin/training-types/:id/toggle — toggle active/inactive
app.put('/api/admin/training-types/:id/toggle', isAdmin, async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;

  try {
    const check = await pool.query('SELECT id FROM training_types WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Training type not found' });
    }

    await pool.query('UPDATE training_types SET active = $1 WHERE id = $2', [active, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// PUT /api/admin/training-types/:id/description — update description
app.put('/api/admin/training-types/:id/description', isAdmin, async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;

  try {
    const check = await pool.query('SELECT id, name FROM training_types WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Training type not found' });
    }

    await pool.query(
      'UPDATE training_types SET description = $1 WHERE id = $2',
      [description ?? '', id]
    );
    res.json({ success: true, name: check.rows[0].name });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update description' });
  }
});

// DELETE /api/admin/training-types/:id — delete type
app.delete('/api/admin/training-types/:id', isAdmin, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check type exists
    const typeCheck = await client.query('SELECT id, name FROM training_types WHERE id = $1', [id]);
    if (typeCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Training type not found' });
    }

    // Check for active bookings
    const bookingCheck = await client.query(
      `SELECT COUNT(*) as cnt
       FROM bookings b
       JOIN training_availability ta ON b.training_id = ta.id
       WHERE ta.training_type_id = $1 AND b.active = true`,
      [id]
    );
    if (parseInt(bookingCheck.rows[0].cnt) > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: `Tento typ má ${bookingCheck.rows[0].cnt} aktívnych rezerváci(í). Najprv zruš rezervácie.`
      });
    }

    // Check for future training sessions
    const sessionCheck = await client.query(
      `SELECT COUNT(*) as cnt
       FROM training_availability
       WHERE training_type_id = $1 AND training_date > NOW()`,
      [id]
    );
    if (parseInt(sessionCheck.rows[0].cnt) > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: `Tento typ má ${sessionCheck.rows[0].cnt} budúc(ich) hodín v rozvrhu. Najprv ich vymaž.`
      });
    }

    // Delete prices
    await client.query('DELETE FROM training_prices WHERE training_type_id = $1', [id]);
    // Delete the type
    await client.query('DELETE FROM training_types WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to delete training type' });
  } finally {
    client.release();
  }
});

// POST /api/set-training — admin nastaví termín (pre test delete s future sessions)
app.post('/api/set-training', isAdmin, async (req, res) => {
  const { trainingType, trainingDate, maxParticipants, theme } = req.body;
  const typeId = parseInt(trainingType, 10);

  try {
    const typeRes = await pool.query(
      'SELECT name, audience_type FROM training_types WHERE id = $1',
      [typeId]
    );
    if (typeRes.rows.length === 0) {
      return res.status(404).json({ error: `Training type ID ${typeId} not found` });
    }

    const typeName = typeRes.rows[0].name;
    const audienceType = typeRes.rows[0].audience_type;
    const themeValue = (audienceType === 'children' && theme && theme.trim()) ? theme.trim() : null;

    const result = await pool.query(
      `INSERT INTO training_availability
       (training_type_id, training_type, training_date, max_participants, theme)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [typeId, typeName, trainingDate, maxParticipants || 10, themeValue]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// TESTY
// ============================================

describe('E2E: Admin Panel — Training Types CRUD', () => {
  let adminUser;
  let regularUser;

  beforeAll(async () => {
    await cleanupTestData();
    // Vytvoríme admin používateľa priamo v DB
    const adminResult = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password, address, verified, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET role = 'admin'
       RETURNING *`,
      ['Admin', 'Test', 'test_admin@example.com', 'hashed_password', 'Admin Address', true, 'admin']
    );
    adminUser = adminResult.rows[0];

    regularUser = await createTestUser('test_regular@example.com');
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  // Helper: admin request headers
  const adminHeaders = () => ({
    'x-test-user-id': String(adminUser.id),
    'x-test-user-role': 'admin'
  });

  const userHeaders = () => ({
    'x-test-user-id': String(regularUser.id),
    'x-test-user-role': 'user'
  });

  // ==========================================
  // 1. AUTORIZÁCIA / PRÍSTUP
  // ==========================================
  describe('Autorizácia a prístup', () => {
    it('1.1 Neprihlásený používateľ — 401 pri admin endpointoch', async () => {
      const res = await request(app)
        .post('/api/admin/training-types')
        .send({ name: 'Test' });
      expect(res.status).toBe(401);
    });

    it('1.2 Bežný používateľ (nie admin) — 403 pri admin endpointoch', async () => {
      const res = await request(app)
        .post('/api/admin/training-types')
        .set(userHeaders())
        .send({ name: 'Test' });
      expect(res.status).toBe(403);
    });

    it('1.3 Admin používateľ — môže pristupovať k admin endpointom', async () => {
      const res = await request(app)
        .get('/api/training-types?admin=true&audience=children')
        .set(adminHeaders());
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ==========================================
  // 2. VYTVORENIE TYPU TRÉNINGU (CREATE)
  // ==========================================
  describe('Vytvorenie typu tréningu', () => {
    const TYPE_NAME = 'TEST_CREATE_TYPE';

    afterEach(async () => {
      await pool.query('DELETE FROM training_prices WHERE training_type_id IN (SELECT id FROM training_types WHERE name = $1)', [TYPE_NAME]);
      await pool.query('DELETE FROM training_types WHERE name = $1', [TYPE_NAME]);
    });

    it('2.1 Vytvorenie detského typu s tiered cenami', async () => {
      const res = await request(app)
        .post('/api/admin/training-types')
        .set(adminHeaders())
        .send({
          name: TYPE_NAME,
          description: 'Testovací detský typ',
          durationMinutes: 60,
          audienceType: 'children',
          colorHex: '#3b82f6',
          prices: [
            { child_count: 1, price: 12 },
            { child_count: 2, price: 22 },
            { child_count: 3, price: 30 }
          ],
          accompanyingPrice: 3
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.id).toBeDefined();

      // Overenie v DB
      const dbCheck = await pool.query(
        'SELECT * FROM training_types WHERE id = $1',
        [res.body.id]
      );
      expect(dbCheck.rows[0].name).toBe(TYPE_NAME);
      expect(dbCheck.rows[0].audience_type).toBe('children');
      expect(dbCheck.rows[0].active).toBe(true); // default active

      // Overenie cien
      const pricesCheck = await pool.query(
        'SELECT * FROM training_prices WHERE training_type_id = $1 ORDER BY child_count',
        [res.body.id]
      );
      expect(pricesCheck.rows.length).toBe(3);
      expect(parseFloat(pricesCheck.rows[0].price)).toBe(12);
    });

    it('2.2 Vytvorenie dospeláckeho typu s jednou cenou', async () => {
      const res = await request(app)
        .post('/api/admin/training-types')
        .set(adminHeaders())
        .send({
          name: TYPE_NAME,
          description: 'Testovací dospelácky typ',
          durationMinutes: 90,
          audienceType: 'adults',
          colorHex: '#ef4444',
          prices: [
            { child_count: 1, price: 25 }
          ],
          accompanyingPrice: 0
        });

      expect(res.status).toBe(201);

      const dbCheck = await pool.query(
        'SELECT * FROM training_types WHERE id = $1',
        [res.body.id]
      );
      expect(dbCheck.rows[0].audience_type).toBe('adults');
      expect(dbCheck.rows[0].accompanying_person_price).toBe('0.00');
    });

    it('2.3 Vytvorenie "both" typu (deti aj dospelí)', async () => {
      const res = await request(app)
        .post('/api/admin/training-types')
        .set(adminHeaders())
        .send({
          name: TYPE_NAME,
          audienceType: 'both',
          durationMinutes: 45,
          prices: [
            { child_count: 1, price: 10 }
          ]
        });

      expect(res.status).toBe(201);

      const dbCheck = await pool.query(
        'SELECT * FROM training_types WHERE id = $1',
        [res.body.id]
      );
      expect(dbCheck.rows[0].audience_type).toBe('both');
    });

    it('2.4 NEGATÍVNY: Vytvorenie typu bez mena', async () => {
      const res = await request(app)
        .post('/api/admin/training-types')
        .set(adminHeaders())
        .send({
          name: '',
          audienceType: 'children',
          prices: [{ child_count: 1, price: 10 }]
        });

      expect(res.status).toBe(400);
    });

    it('2.5 NEGATÍVNY: Vytvorenie typu len s bielymi znakmi v názve', async () => {
      const res = await request(app)
        .post('/api/admin/training-types')
        .set(adminHeaders())
        .send({
          name: '   ',
          audienceType: 'children',
          prices: [{ child_count: 1, price: 10 }]
        });

      expect(res.status).toBe(400);
    });

    it('2.6 NEGATÍVNY: Duplicitný názov typu', async () => {
      // Prvý zápis
      await request(app)
        .post('/api/admin/training-types')
        .set(adminHeaders())
        .send({
          name: TYPE_NAME,
          audienceType: 'children',
          prices: [{ child_count: 1, price: 10 }]
        });

      // Druhý zápis s rovnakým názvom
      const res = await request(app)
        .post('/api/admin/training-types')
        .set(adminHeaders())
        .send({
          name: TYPE_NAME,
          audienceType: 'adults',
          prices: [{ child_count: 1, price: 20 }]
        });

      expect(res.status).toBe(409);
    });

    it('2.7 NEGATÍVNY: Cena nemôže byť záporná', async () => {
      const res = await request(app)
        .post('/api/admin/training-types')
        .set(adminHeaders())
        .send({
          name: TYPE_NAME,
          audienceType: 'children',
          prices: [{ child_count: 1, price: -5 }]
        });

      expect(res.status).toBe(400);
    });
  });

  // ==========================================
  // 3. TOGGLE VISIBILITY (AKTÍVNY / NEAKTÍVNY)
  // ==========================================
  describe('Toggle visibility (active/inactive)', () => {
    let testType;

    beforeAll(async () => {
      testType = await createTestTrainingType('TEST_TOGGLE_TYPE', 'children');
    });

    it('3.1 Deaktivácia typu', async () => {
      const res = await request(app)
        .put(`/api/admin/training-types/${testType.id}/toggle`)
        .set(adminHeaders())
        .send({ active: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbCheck = await pool.query(
        'SELECT active FROM training_types WHERE id = $1',
        [testType.id]
      );
      expect(dbCheck.rows[0].active).toBe(false);
    });

    it('3.2 Reaktivácia typu', async () => {
      const res = await request(app)
        .put(`/api/admin/training-types/${testType.id}/toggle`)
        .set(adminHeaders())
        .send({ active: true });

      expect(res.status).toBe(200);

      const dbCheck = await pool.query(
        'SELECT active FROM training_types WHERE id = $1',
        [testType.id]
      );
      expect(dbCheck.rows[0].active).toBe(true);
    });

    it('3.3 Neaktívny typ sa nezobrazí bežnému používateľovi', async () => {
      // Deaktivujeme
      await request(app)
        .put(`/api/admin/training-types/${testType.id}/toggle`)
        .set(adminHeaders())
        .send({ active: false });

      // Bežný používateľ ho nevidí
      const userRes = await request(app)
        .get('/api/training-types?audience=children')
        .set(userHeaders());
      const found = userRes.body.find(t => t.id === testType.id);
      expect(found).toBeUndefined();

      // Admin ho stále vidí
      const adminRes = await request(app)
        .get('/api/training-types?admin=true&audience=children')
        .set(adminHeaders());
      const adminFound = adminRes.body.find(t => t.id === testType.id);
      expect(adminFound).toBeDefined();
      expect(adminFound.active).toBe(false);

      // Reaktivujeme
      await request(app)
        .put(`/api/admin/training-types/${testType.id}/toggle`)
        .set(adminHeaders())
        .send({ active: true });
    });

    it('3.4 NEGATÍVNY: Toggle neexistujúceho ID', async () => {
      const res = await request(app)
        .put('/api/admin/training-types/99999/toggle')
        .set(adminHeaders())
        .send({ active: true });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 4. ÚPRAVA POPISU (EDIT DESCRIPTION)
  // ==========================================
  describe('Úprava popisu', () => {
    let testType;

    beforeAll(async () => {
      testType = await createTestTrainingType('TEST_EDIT_TYPE', 'children');
    });

    it('4.1 Úprava popisu na nový text', async () => {
      const newDesc = 'Aktualizovaný popis s **bold** a [link](https://example.com)';

      const res = await request(app)
        .put(`/api/admin/training-types/${testType.id}/description`)
        .set(adminHeaders())
        .send({ description: newDesc });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbCheck = await pool.query(
        'SELECT description FROM training_types WHERE id = $1',
        [testType.id]
      );
      expect(dbCheck.rows[0].description).toBe(newDesc);
    });

    it('4.2 Nastavenie prázdneho popisu', async () => {
      const res = await request(app)
        .put(`/api/admin/training-types/${testType.id}/description`)
        .set(adminHeaders())
        .send({ description: '' });

      expect(res.status).toBe(200);

      const dbCheck = await pool.query(
        'SELECT description FROM training_types WHERE id = $1',
        [testType.id]
      );
      expect(dbCheck.rows[0].description).toBe('');
    });

    it('4.3 Úprava popisu s Markdown formátovaním', async () => {
      const mdDesc = '## Nadpis\n\nOdstavec s **tučným** textom a [odkazom](https://nitracik.sk).\n\n### Podnadpis\n\nĎalší text.';

      const res = await request(app)
        .put(`/api/admin/training-types/${testType.id}/description`)
        .set(adminHeaders())
        .send({ description: mdDesc });

      expect(res.status).toBe(200);

      const dbCheck = await pool.query(
        'SELECT description FROM training_types WHERE id = $1',
        [testType.id]
      );
      expect(dbCheck.rows[0].description).toBe(mdDesc);
    });

    it('4.4 Úprava popisu s URL linkami v texte', async () => {
      const descWithUrl = 'Navštívte https://nitracik.sk pre viac info.';

      const res = await request(app)
        .put(`/api/admin/training-types/${testType.id}/description`)
        .set(adminHeaders())
        .send({ description: descWithUrl });

      expect(res.status).toBe(200);
    });

    it('4.5 NEGATÍVNY: Úprava popisu neexistujúceho typu', async () => {
      const res = await request(app)
        .put('/api/admin/training-types/99999/description')
        .set(adminHeaders())
        .send({ description: 'Nová hodnota' });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 5. AUDIENCE FILTER — deti vs dospelí
  // ==========================================
  describe('Audience filter (deti vs dospelí)', () => {
    let childType;
    let adultType;
    let bothType;

    beforeAll(async () => {
      childType = await createTestTrainingType('TEST_FILTER_CHILD', 'children');
      adultType = await createTestTrainingType('TEST_FILTER_ADULT', 'adults');
      bothType = await createTestTrainingType('TEST_FILTER_BOTH', 'both');
    });

    it('5.1 Filter "children" vráti len detské a both typy', async () => {
      const res = await request(app)
        .get('/api/training-types?audience=children')
        .set(adminHeaders());

      const ids = res.body.map(t => t.id);
      expect(ids).toContain(childType.id);
      expect(ids).toContain(bothType.id);
      expect(ids).not.toContain(adultType.id);
    });

    it('5.2 Filter "adults" vráti len dospelácke a both typy', async () => {
      const res = await request(app)
        .get('/api/training-types?audience=adults')
        .set(adminHeaders());

      const ids = res.body.map(t => t.id);
      expect(ids).toContain(adultType.id);
      expect(ids).toContain(bothType.id);
      expect(ids).not.toContain(childType.id);
    });

    it('5.3 Bez audience filtra — vráti všetky typy', async () => {
      const res = await request(app)
        .get('/api/training-types?admin=true')
        .set(adminHeaders());

      const ids = res.body.map(t => t.id);
      expect(ids).toContain(childType.id);
      expect(ids).toContain(adultType.id);
      expect(ids).toContain(bothType.id);
    });

    it('5.4 "both" typ sa objaví v oboch audience filtroch', async () => {
      const childRes = await request(app)
        .get('/api/training-types?audience=children')
        .set(adminHeaders());
      expect(childRes.body.some(t => t.id === bothType.id)).toBe(true);

      const adultRes = await request(app)
        .get('/api/training-types?audience=adults')
        .set(adminHeaders());
      expect(adultRes.body.some(t => t.id === bothType.id)).toBe(true);
    });
  });

  // ==========================================
  // 6. VYMAZANIE TYPU (DELETE)
  // ==========================================
  describe('Vymazanie typu tréningu', () => {
    it('6.1 Vymazanie typu bez rezervácií a sessionov', async () => {
      const type = await createTestTrainingType('TEST_DELETE_OK', 'children');

      const res = await request(app)
        .delete(`/api/admin/training-types/${type.id}`)
        .set(adminHeaders());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Overenie, že typ už neexistuje
      const dbCheck = await pool.query(
        'SELECT id FROM training_types WHERE id = $1',
        [type.id]
      );
      expect(dbCheck.rows.length).toBe(0);
    });

    it('6.2 Vymazanie typu vymaže aj jeho prices', async () => {
      // Vytvoríme typ s cenami
      const createRes = await request(app)
        .post('/api/admin/training-types')
        .set(adminHeaders())
        .send({
          name: 'TEST_DELETE_WITH_PRICES',
          audienceType: 'children',
          prices: [
            { child_count: 1, price: 10 },
            { child_count: 2, price: 18 }
          ]
        });
      const typeId = createRes.body.id;

      // Overíme, že ceny existujú
      const pricesBefore = await pool.query(
        'SELECT COUNT(*) as cnt FROM training_prices WHERE training_type_id = $1',
        [typeId]
      );
      expect(parseInt(pricesBefore.rows[0].cnt)).toBe(2);

      // Vymažeme
      const deleteRes = await request(app)
        .delete(`/api/admin/training-types/${typeId}`)
        .set(adminHeaders());
      expect(deleteRes.status).toBe(200);

      // Ceny by mali byť tiež vymazané
      const pricesAfter = await pool.query(
        'SELECT COUNT(*) as cnt FROM training_prices WHERE training_type_id = $1',
        [typeId]
      );
      expect(parseInt(pricesAfter.rows[0].cnt)).toBe(0);
    });

    it('6.3 NEGATÍVNY: Vymazanie typu s budúcimi sessionmi', async () => {
      const type = await createTestTrainingType('TEST_DELETE_WITH_SESSIONS', 'children');

      // Vytvoríme budúci session
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // o týždeň
      await request(app)
        .post('/api/set-training')
        .set(adminHeaders())
        .send({
          trainingType: type.id,
          trainingDate: futureDate.toISOString(),
          maxParticipants: 10
        });

      const res = await request(app)
        .delete(`/api/admin/training-types/${type.id}`)
        .set(adminHeaders());

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('budúc');
    });

    it('6.4 NEGATÍVNY: Vymazanie neexistujúceho typu', async () => {
      const res = await request(app)
        .delete('/api/admin/training-types/99999')
        .set(adminHeaders());

      expect(res.status).toBe(404);
    });

    it('6.5 Idempotentnosť delete — opakované vymazanie', async () => {
      const type = await createTestTrainingType('TEST_DELETE_IDEMPOTENT', 'children');

      // Prvé vymazanie — OK
      const res1 = await request(app)
        .delete(`/api/admin/training-types/${type.id}`)
        .set(adminHeaders());
      expect(res1.status).toBe(200);

      // Druhé vymazanie — 404
      const res2 = await request(app)
        .delete(`/api/admin/training-types/${type.id}`)
        .set(adminHeaders());
      expect(res2.status).toBe(404);
    });
  });

  // ==========================================
  // 7. KOMPLEXNÝ ŽIVOTNÝ CYKLUS
  // ==========================================
  describe('Komplexný životný cyklus typu', () => {
    it('7.1 Create → Edit → Toggle → List → Delete', async () => {
      // 1. CREATE
      const createRes = await request(app)
        .post('/api/admin/training-types')
        .set(adminHeaders())
        .send({
          name: 'TEST_LIFECYCLE',
          description: 'Pôvodný popis',
          durationMinutes: 60,
          audienceType: 'adults',
          colorHex: '#10b981',
          prices: [{ child_count: 1, price: 20 }]
        });
      expect(createRes.status).toBe(201);
      const typeId = createRes.body.id;

      // 2. VERIFY — objaví sa v zozname pre adults
      const listRes1 = await request(app)
        .get('/api/training-types?admin=true&audience=adults')
        .set(adminHeaders());
      const found1 = listRes1.body.find(t => t.id === typeId);
      expect(found1).toBeDefined();
      expect(found1.description).toBe('Pôvodný popis');

      // 3. EDIT — zmena popisu
      const editRes = await request(app)
        .put(`/api/admin/training-types/${typeId}/description`)
        .set(adminHeaders())
        .send({ description: 'Upravený popis po zmene' });
      expect(editRes.status).toBe(200);

      // 4. VERIFY EDIT
      const listRes2 = await request(app)
        .get('/api/training-types?admin=true&audience=adults')
        .set(adminHeaders());
      const found2 = listRes2.body.find(t => t.id === typeId);
      expect(found2.description).toBe('Upravený popis po zmene');

      // 5. TOGGLE OFF
      const toggleRes = await request(app)
        .put(`/api/admin/training-types/${typeId}/toggle`)
        .set(adminHeaders())
        .send({ active: false });
      expect(toggleRes.status).toBe(200);

      // 6. VERIFY TOGGLE — bežný user nevidí
      const userList = await request(app)
        .get('/api/training-types?audience=adults')
        .set(userHeaders());
      expect(userList.body.find(t => t.id === typeId)).toBeUndefined();

      // 7. TOGGLE ON
      await request(app)
        .put(`/api/admin/training-types/${typeId}/toggle`)
        .set(adminHeaders())
        .send({ active: true });

      // 8. DELETE
      const deleteRes = await request(app)
        .delete(`/api/admin/training-types/${typeId}`)
        .set(adminHeaders());
      expect(deleteRes.status).toBe(200);

      // 9. VERIFY DELETE — už neexistuje
      const listRes3 = await request(app)
        .get('/api/training-types?admin=true&audience=adults')
        .set(adminHeaders());
      expect(listRes3.body.find(t => t.id === typeId)).toBeUndefined();
    });
  });

  // ==========================================
  // 8. HRANOVÉ PRÍPADY
  // ==========================================
  describe('Hranové prípady', () => {
    it('8.1 Dlhý názov typu (do 50 znakov)', async () => {
      const longName = 'A'.repeat(50);
      const res = await request(app)
        .post('/api/admin/training-types')
        .set(adminHeaders())
        .send({
          name: longName,
          audienceType: 'children',
          prices: [{ child_count: 1, price: 10 }]
        });

      expect(res.status).toBe(201);

      // Cleanup
      await pool.query('DELETE FROM training_prices WHERE training_type_id = $1', [res.body.id]);
      await pool.query('DELETE FROM training_types WHERE id = $1', [res.body.id]);
    });

    it('8.2 Cena 0 (zadarmo)', async () => {
      const res = await request(app)
        .post('/api/admin/training-types')
        .set(adminHeaders())
        .send({
          name: 'TEST_FREE_TYPE',
          audienceType: 'both',
          prices: [{ child_count: 1, price: 0 }]
        });

      expect(res.status).toBe(201);

      const pricesCheck = await pool.query(
        'SELECT price FROM training_prices WHERE training_type_id = $1',
        [res.body.id]
      );
      expect(parseFloat(pricesCheck.rows[0].price)).toBe(0);

      // Cleanup
      await pool.query('DELETE FROM training_prices WHERE training_type_id = $1', [res.body.id]);
      await pool.query('DELETE FROM training_types WHERE id = $1', [res.body.id]);
    });

    it('8.3 Popis so špeciálnymi znakmi (emoji, HTML entity)', async () => {
      const type = await createTestTrainingType('TEST_SPECIAL_CHARS', 'children');
      const specialDesc = 'Popis s emoji 🎉🔥 a špeciálnymi znakmi <>&"\'';

      const res = await request(app)
        .put(`/api/admin/training-types/${type.id}/description`)
        .set(adminHeaders())
        .send({ description: specialDesc });

      expect(res.status).toBe(200);

      const dbCheck = await pool.query(
        'SELECT description FROM training_types WHERE id = $1',
        [type.id]
      );
      expect(dbCheck.rows[0].description).toBe(specialDesc);
    });

    it('8.4 Vytvorenie typu bez voliteľných polí (len názov a cena)', async () => {
      const res = await request(app)
        .post('/api/admin/training-types')
        .set(adminHeaders())
        .send({
          name: 'TEST_MINIMAL',
          prices: [{ child_count: 1, price: 5 }]
        });

      expect(res.status).toBe(201);

      const dbCheck = await pool.query(
        'SELECT * FROM training_types WHERE id = $1',
        [res.body.id]
      );
      expect(dbCheck.rows[0].duration_minutes).toBe(60); // default
      expect(dbCheck.rows[0].audience_type).toBe('children'); // default
      expect(dbCheck.rows[0].color_hex).toBe('#3b82f6'); // default

      // Cleanup
      await pool.query('DELETE FROM training_prices WHERE training_type_id = $1', [res.body.id]);
      await pool.query('DELETE FROM training_types WHERE id = $1', [res.body.id]);
    });

    it('8.5 NEGATÍVNY: Vytvorenie typu bez prices poľa', async () => {
      const res = await request(app)
        .post('/api/admin/training-types')
        .set(adminHeaders())
        .send({
          name: 'TEST_NO_PRICES',
          audienceType: 'children'
        });

      // Mal by prejsť, ale bez cien
      expect(res.status).toBe(201);

      const pricesCheck = await pool.query(
        'SELECT COUNT(*) as cnt FROM training_prices WHERE training_type_id = $1',
        [res.body.id]
      );
      expect(parseInt(pricesCheck.rows[0].cnt)).toBe(0);

      // Cleanup
      await pool.query('DELETE FROM training_types WHERE id = $1', [res.body.id]);
    });

    it('8.6 Viacnásobné toggle (rýchle prepínanie)', async () => {
      const type = await createTestTrainingType('TEST_RAPID_TOGGLE', 'children');

      for (let i = 0; i < 5; i++) {
        const newState = i % 2 === 0;
        const res = await request(app)
          .put(`/api/admin/training-types/${type.id}/toggle`)
          .set(adminHeaders())
          .send({ active: newState });
        expect(res.status).toBe(200);
      }

      // Finálny stav: i=0→true, i=1→false, i=2→true, i=3→false, i=4→true
      const dbCheck = await pool.query(
        'SELECT active FROM training_types WHERE id = $1',
        [type.id]
      );
      expect(dbCheck.rows[0].active).toBe(true);
    });
  });

  // ==========================================
  // 9. INTEGRITA DÁT
  // ==========================================
  describe('Integrita dát', () => {
    it('9.1 Edit popisu neovplyvní iné polia', async () => {
      const type = await createTestTrainingType('TEST_INTEGRITY', 'adults');

      // Zapamätáme si pôvodné hodnoty
      const before = await pool.query('SELECT * FROM training_types WHERE id = $1', [type.id]);
      const originalName = before.rows[0].name;
      const originalAudience = before.rows[0].audience_type;
      const originalDuration = before.rows[0].duration_minutes;
      const originalActive = before.rows[0].active;

      // Upravíme len popis
      await request(app)
        .put(`/api/admin/training-types/${type.id}/description`)
        .set(adminHeaders())
        .send({ description: 'Nový popis' });

      // Overíme, že ostatné polia sú nezmenené
      const after = await pool.query('SELECT * FROM training_types WHERE id = $1', [type.id]);
      expect(after.rows[0].name).toBe(originalName);
      expect(after.rows[0].audience_type).toBe(originalAudience);
      expect(after.rows[0].duration_minutes).toBe(originalDuration);
      expect(after.rows[0].active).toBe(originalActive);
      expect(after.rows[0].description).toBe('Nový popis');
    });

    it('9.2 Toggle neovplyvní popis ani iné polia', async () => {
      const type = await createTestTrainingType('TEST_TOGGLE_INTEGRITY', 'children');

      const before = await pool.query(
        'SELECT description, name, audience_type FROM training_types WHERE id = $1',
        [type.id]
      );

      await request(app)
        .put(`/api/admin/training-types/${type.id}/toggle`)
        .set(adminHeaders())
        .send({ active: false });

      const after = await pool.query(
        'SELECT description, name, audience_type, active FROM training_types WHERE id = $1',
        [type.id]
      );
      expect(after.rows[0].description).toBe(before.rows[0].description);
      expect(after.rows[0].name).toBe(before.rows[0].name);
      expect(after.rows[0].audience_type).toBe(before.rows[0].audience_type);
      expect(after.rows[0].active).toBe(false);
    });
  });
});
