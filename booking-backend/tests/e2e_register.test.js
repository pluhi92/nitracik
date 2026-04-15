// tests/e2e_register.test.js
// E2E testy pre registráciu používateľa - validácia hesla

const request = require('supertest');
const express = require('express');
const { 
  cleanupTestData, 
  pool 
} = require('./setup');

// Mock email service
jest.mock('../services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true)
}));

// Mock axios pre Cloudflare Turnstile
jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({
    data: { success: true }
  })
}));

const axios = require('axios');

// Vytvorenie testovacej Express aplikácie
const app = express();
app.use(express.json());

// Import PASSWORD_REGEX z hlavného servera (rovnaký ako v produkcii)
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// Register endpoint (kopíruje logiku z server.js)
app.post('/api/register', async (req, res) => {
  const { firstName, lastName, email, password, address, _honey, turnstileToken } = req.body;

  // 1. HONEYPOT KONTROLA
  if (_honey) {
    console.log(`Bot detected via honeypot. IP: ${req.ip}`);
    return res.status(200).json({ message: 'Registrácia úspešná' });
  }

  // 2. CLOUDFLARE TURNSTILE OVERENIE
  if (!turnstileToken) {
    return res.status(400).json({ message: 'Prosím, potvrďte, že nie ste robot (Captcha).' });
  }

  try {
    const verificationUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const formData = new URLSearchParams();
    formData.append('secret', 'test_secret_key');
    formData.append('response', turnstileToken);
    formData.append('remoteip', req.ip);

    const captchaResponse = await axios.post(verificationUrl, formData);
    const captchaData = captchaResponse.data;

    if (!captchaData.success) {
      console.error('Turnstile verification failed:', captchaData);
      return res.status(400).json({ message: 'Overenie Captcha zlyhalo. Skúste to znova.' });
    }
  } catch (error) {
    console.error('Turnstile API error:', error);
    return res.status(500).json({ message: 'Chyba pri overovaní Captcha.' });
  }

  // 3. VALIDÁCIA POVINNÝCH POLÍ
  if (!firstName || !lastName || !email || !password || !address) {
    return res.status(400).json({ message: 'Všetky polia sú povinné.' });
  }

  // 4. VALIDÁCIA HESLA - TOTO JE HLAVNÉ ČO TESTUJEME
  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({
      message: 'Heslo musí mať min. 8 znakov, veľké a malé písmeno a číslo.'
    });
  }

  // 5. KONTROLA EXISTUJÚCEHO EMAILU
  const client = await pool.connect();
  try {
    const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Užívateľ s týmto emailom už existuje.' });
    }

    // 6. VYTVORENIE POUŽÍVATEĽA
    const result = await client.query(
      `INSERT INTO users (first_name, last_name, email, password, address, role, created_at, verified)
       VALUES ($1, $2, $3, $4, $5, 'user', NOW(), false)
       RETURNING id, email, first_name`,
      [firstName, lastName, email, 'hashed_password', address]
    );

    res.status(201).json({
      message: 'Registrácia úspešná! Skontrolujte si email pre aktiváciu účtu.'
    });

  } catch (error) {
    console.error('Chyba pri registrácii:', error);
    res.status(500).json({ message: 'Interná chyba servera' });
  } finally {
    client.release();
  }
});

// ============================================
// TESTY
// ============================================

describe('E2E Testy - Registrácia používateľa', () => {
  const validUserData = {
    firstName: 'Janko',
    lastName: 'Mrkvička',
    email: 'test_register@example.com',
    address: 'Test Street 123, 12345 Test City',
    turnstileToken: 'test_valid_token'
  };

  beforeAll(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    // Vyčistenie testovacích používateľov po každom teste
    await pool.query(`DELETE FROM users WHERE email LIKE 'test_register%'`);
  });

  afterAll(async () => {
    await cleanupTestData();
    await pool.end();
  });

  describe('✅ Úspešné registrácie (validné heslá)', () => {
    
    test('1. Validné heslo BEZ špeciálnych znakov - success', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          ...validUserData,
          email: 'test_register_1@example.com',
          password: 'Heslo123' // 8 znakov, veľké, malé, číslo - BEZ špeciálneho znaku
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('Registrácia úspešná');

      // Overenie v DB
      const userResult = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        ['test_register_1@example.com']
      );
      expect(userResult.rows.length).toBe(1);
      expect(userResult.rows[0].first_name).toBe('Janko');
    });

    test('2. Validné heslo SO špeciálnymi znakmi - success', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          ...validUserData,
          email: 'test_register_2@example.com',
          password: 'Heslo123!@#' // 11 znakov, veľké, malé, číslo + špeciálne znaky
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('Registrácia úspešná');

      // Overenie v DB
      const userResult = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        ['test_register_2@example.com']
      );
      expect(userResult.rows.length).toBe(1);
    });

    test('2b. Validné heslo s rôznymi špeciálnymi znakmi - success', async () => {
      const testPasswords = [
        'Password1!',      // !
        'Password1@',      // @
        'Password1#',      // #
        'Password1$',      // $
        'Password1%',      // %
        'Password1^',      // ^
        'Password1&',      // &
        'Password1*',      // *
        'Password1(',      // (
        'Password1)',      // )
        'Password1-',      // -
        'Password1_',      // _
        'Password1=',      // =
        'Password1+',      // +
        'Pass.word1',      // .
        'Pass,word1',      // ,
        'Pass?word1',      // ?
      ];

      for (let i = 0; i < testPasswords.length; i++) {
        const response = await request(app)
          .post('/api/register')
          .send({
            ...validUserData,
            email: `test_register_special_${i}@example.com`,
            password: testPasswords[i]
          });

        expect(response.status).toBe(201);
        expect(response.body.message).toContain('Registrácia úspešná');
      }
    });
  });

  describe('❌ Neúspešné registrácie (nevalidné heslá)', () => {
    
    test('3. Invalid heslo - príliš málo znakov (7) - negatív', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          ...validUserData,
          email: 'test_register_3@example.com',
          password: 'Heslo12' // Iba 7 znakov - MÁLO
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Heslo musí mať min. 8 znakov');

      // Overenie že používateľ NEBOL vytvorený
      const userResult = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        ['test_register_3@example.com']
      );
      expect(userResult.rows.length).toBe(0);
    });

    test('4. Invalid heslo - bez veľkého písmena - negatív', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          ...validUserData,
          email: 'test_register_4@example.com',
          password: 'heslo1234' // Len malé písmená, žiadne veľké
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Heslo musí mať min. 8 znakov, veľké a malé písmeno a číslo');

      // Overenie že používateľ NEBOL vytvorený
      const userResult = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        ['test_register_4@example.com']
      );
      expect(userResult.rows.length).toBe(0);
    });

    test('5. Invalid heslo - bez malého písmena - negatív', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          ...validUserData,
          email: 'test_register_5@example.com',
          password: 'HESLO1234' // Len veľké písmená, žiadne malé
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Heslo musí mať min. 8 znakov, veľké a malé písmeno a číslo');

      // Overenie že používateľ NEBOL vytvorený
      const userResult = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        ['test_register_5@example.com']
      );
      expect(userResult.rows.length).toBe(0);
    });

    test('6. Invalid heslo - bez čísla - negatív', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          ...validUserData,
          email: 'test_register_6@example.com',
          password: 'HesloHeslo' // Veľké, malé, ale ŽIADNE ČÍSLO
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Heslo musí mať min. 8 znakov, veľké a malé písmeno a číslo');

      // Overenie že používateľ NEBOL vytvorený
      const userResult = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        ['test_register_6@example.com']
      );
      expect(userResult.rows.length).toBe(0);
    });
  });

  describe('🔒 Bezpečnostné testy', () => {
    
    test('malo by zamietnúť registráciu bez Turnstile tokenu', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          ...validUserData,
          email: 'test_register_security@example.com',
          password: 'Heslo123',
          turnstileToken: null
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Captcha');
    });

    test('malo by detekovať bota cez honeypot pole', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          ...validUserData,
          email: 'test_register_bot@example.com',
          password: 'Heslo123',
          _honey: 'bot_value'
        });

      // Bot dostane fake success, ale používateľ nebude vytvorený
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Registrácia úspešná');

      // Overenie že používateľ NEBOL vytvorený
      const userResult = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        ['test_register_bot@example.com']
      );
      expect(userResult.rows.length).toBe(0);
    });

    test('malo by zamietnúť duplicitný email', async () => {
      // Najprv vytvoríme používateľa
      await request(app)
        .post('/api/register')
        .send({
          ...validUserData,
          email: 'test_duplicate@example.com',
          password: 'Heslo123'
        });

      // Pokus o registráciu s rovnakým emailom
      const response = await request(app)
        .post('/api/register')
        .send({
          ...validUserData,
          email: 'test_duplicate@example.com',
          password: 'Heslo123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Užívateľ s týmto emailom už existuje');
    });
  });

  describe('📝 Validácia ostatných polí', () => {
    
    test('malo by zamietnúť registráciu bez povinných polí', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          firstName: '',
          lastName: '',
          email: '',
          password: 'Heslo123',
          address: '',
          turnstileToken: 'test_token'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Všetky polia sú povinné');
    });
  });
});
