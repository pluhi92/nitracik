// tests/setup.js
// Setup pre integračné testy - databázové utility
// ⚠️  DÔLEŽITÉ: Tieto testy používajú LEN testovaciu databázu!
// Produkcia je úplne chránená.

const { Pool } = require('pg');
const path = require('path');

// Načítanie .env z tests priečinka (priorita)
// Ak neexistuje, fallback na koreňový priečinok
const fs = require('fs');
const testsEnvPath = path.join(__dirname, '.env');
const rootEnvPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(testsEnvPath)) {
  require('dotenv').config({ path: testsEnvPath });
  console.log('✅ Načítaný .env z tests priečinka');
} else {
  require('dotenv').config({ path: rootEnvPath });
  console.log('⚠️  Načítaný .env z koreňového priečinka');
}

// ⚠️  KONTROLA: Používame len testovaciu databázu
// Pre testy MUSÍ byť nastavená premenná TEST_DATABASE_URL alebo DB_NAME musí obsahovať 'test'
const isTestDatabase = process.env.TEST_DATABASE_URL || 
                       (process.env.DB_NAME && process.env.DB_NAME.toLowerCase().includes('test'));

if (!isTestDatabase) {
  console.error('❌ CHYBA: Testy vyžadujú testovaciu databázu!');
  console.error('Nastavte TEST_DATABASE_URL alebo DB_NAME obsahujúce "test"');
  console.error('Aktuálna DB_NAME:', process.env.DB_NAME);
  process.exit(1);
}

// Testovacia databáza - použijeme TEST_DATABASE_URL alebo štandardnú konfiguráciu
const TEST_DB_CONFIG = process.env.TEST_DATABASE_URL 
  ? { connectionString: process.env.TEST_DATABASE_URL }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    };

console.log('✅ Testy používajú databázu:', TEST_DB_CONFIG.database || 'z TEST_DATABASE_URL');

const pool = new Pool(TEST_DB_CONFIG);

/**
 * Vyčistí testovacie dáta z databázy
 */
async function cleanupTestData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Odstránenie testovacích dát v správnom poradí (podľa cudzích kľúčov)
    // 1. Najprv zmazať závislé tabuľky
    await client.query(`DELETE FROM season_ticket_usage WHERE season_ticket_id IN (
      SELECT id FROM season_tickets WHERE stripe_payment_id LIKE 'test_%'
    )`);
    
    // 2. Zmazať bookings (závisia na training_availability a users)
    await client.query(`DELETE FROM bookings WHERE user_id IN (
      SELECT id FROM users WHERE email LIKE 'test_%'
    )`);
    
    await client.query(`DELETE FROM bookings WHERE session_id LIKE 'test_%' OR payment_intent_id LIKE 'test_%'`);

    // 2b. Zmazať bookings, ktoré nemajú test_% session_id/payment_intent_id
    // (napr. credit bookings) ale smerujú na TEST_% training_availability
    await client.query(`DELETE FROM bookings WHERE training_id IN (
      SELECT id FROM training_availability WHERE training_type LIKE 'TEST_%'
    )`);
    
    // 3. Zmazať season_tickets
    await client.query(`DELETE FROM season_tickets WHERE stripe_payment_id LIKE 'test_%'`);
    
    // 4. Zmazať season_ticket_products
    await client.query(`DELETE FROM season_ticket_products WHERE code LIKE 'test_%'`);

    // 4b. Zmazať credits (pred training_availability, kôli FK credits_session_id_fkey)
    await client.query(`DELETE FROM credits WHERE user_id IN (
      SELECT id FROM users WHERE email LIKE 'test_%'
    )`);
    
    // 5. Teraz môžeme zmazať training_availability (už nie sú závislé bookings ani credits)
    await client.query(`DELETE FROM training_availability WHERE training_type LIKE 'TEST_%'`);
    
    // 6. Zmazať user_saved_gift_cards (pred gift_card, kôli FK)
    const usgcTableCheck = await client.query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'user_saved_gift_cards'
       ) AS exists`
    );
    if (usgcTableCheck.rows[0].exists) {
      await client.query(`DELETE FROM user_saved_gift_cards WHERE user_id IN (
        SELECT id FROM users WHERE email LIKE 'test_%'
      )`);
    }

    // 7. Zmazať gift_card (pred users, kôli FK) — len ak tabuľka existuje
    const giftCardTableCheck = await client.query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'gift_card'
       ) AS exists`
    );
    if (giftCardTableCheck.rows[0].exists) {
      await client.query(`DELETE FROM gift_card WHERE "buyerEmail" LIKE 'test_%' OR code LIKE 'TESTGC%'`);
    }

    // 8. Zmazať training_types
    await client.query(`DELETE FROM training_types WHERE name LIKE 'TEST_%'`);
    
    // 9. Nakoniec zmazať users
    await client.query(`DELETE FROM users WHERE email LIKE 'test_%'`);
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cleanup error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Vytvorí testovacieho používateľa
 */
async function createTestUser(email = 'test_user@example.com') {
  const result = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password, address, verified, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (email) DO UPDATE SET first_name = $1
     RETURNING *`,
    ['Test', 'User', email, 'hashed_password', 'Test Address 123', true, 'user']
  );
  return result.rows[0];
}

/**
 * Vytvorí testovací produkt permanentky
 */
async function createTestSeasonTicketProduct() {
  const result = await pool.query(
    `INSERT INTO season_ticket_products (
      code, name, description, active
    ) VALUES ($1, $2, $3, $4)
    ON CONFLICT (code) DO UPDATE SET name = $2
    RETURNING *`,
    [
      `test_product_${Date.now()}`,
      'Testovací produkt',
      'Produkt pre testovanie',
      true
    ]
  );
  return result.rows[0];
}

/**
 * Vytvorí testovaciu permanentku
 */
async function createTestSeasonTicket(userId, entriesTotal = 5, entriesRemaining = 5) {
  // Najprv vytvoríme produkt
  const product = await createTestSeasonTicketProduct();
  
  const result = await pool.query(
    `INSERT INTO season_tickets (
      user_id, season_ticket_product_id, entries_total, entries_remaining, 
      purchase_date, expiry_date, stripe_payment_id, amount_paid
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      userId,
      product.id,
      entriesTotal,
      entriesRemaining,
      new Date(),
      new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000), // 6 mesiacov
      `test_payment_${Date.now()}`,
      50.00
    ]
  );
  return result.rows[0];
}

/**
 * Vytvorí testovací typ tréningu
 */
async function createTestTrainingType(name = 'TEST_TRAINING', audienceType = 'children') {
  const result = await pool.query(
    `INSERT INTO training_types (
      name, description, duration_minutes, active, audience_type, color_hex
    ) VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (name) DO UPDATE SET name = $1
    RETURNING *`,
    [name, 'Testovací typ tréningu', 60, true, audienceType, '#3b82f6']
  );
  return result.rows[0];
}

/**
 * Vytvorí testovací tréning
 */
async function createTestTraining(trainingTypeId, maxParticipants = 10) {
  // Ak nie je zadané trainingTypeId, vytvoríme nový typ
  let typeId = trainingTypeId;
  let typeName = 'TEST_TRAINING';
  
  if (!typeId) {
    const type = await createTestTrainingType();
    typeId = type.id;
    typeName = type.name;
  } else {
    // Získame názov typu
    const typeResult = await pool.query(
      'SELECT name FROM training_types WHERE id = $1',
      [typeId]
    );
    if (typeResult.rows.length > 0) {
      typeName = typeResult.rows[0].name;
    }
  }
  
  const result = await pool.query(
    `INSERT INTO training_availability (
      training_type_id, training_type, training_date, max_participants
    ) VALUES ($1, $2, $3, $4)
    RETURNING *`,
    [
      typeId,
      typeName,
      new Date(Date.now() + 24 * 60 * 60 * 1000), // zajtra
      maxParticipants
    ]
  );
  return result.rows[0];
}

/**
 * Získa stav permanentky podľa ID
 */
async function getSeasonTicketById(ticketId) {
  const result = await pool.query(
    'SELECT * FROM season_tickets WHERE id = $1',
    [ticketId]
  );
  return result.rows[0];
}

/**
 * Získa počet záznamov v season_ticket_usage pre danú permanentku
 */
async function getSeasonTicketUsageCount(ticketId) {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM season_ticket_usage WHERE season_ticket_id = $1',
    [ticketId]
  );
  return parseInt(result.rows[0].count, 10);
}

module.exports = {
  pool,
  cleanupTestData,
  createTestUser,
  createTestSeasonTicket,
  createTestSeasonTicketProduct,
  createTestTrainingType,
  createTestTraining,
  getSeasonTicketById,
  getSeasonTicketUsageCount,
};
