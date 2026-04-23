// tests/e2e_register.test.js
// E2E testy pre registráciu používateľa - validácia hesla

const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');
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
app.set('trust proxy', 1);
app.use(express.json());

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: 'Príliš veľa pokusov o registráciu z tejto IP adresy, skúste to prosím neskôr.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const testScopedRegisterLimiter = (req, res, next) => {
  const email = normalizeEmail(req.body?.email);
  if (email.startsWith('test_register_ratelimit_')) {
    return registerLimiter(req, res, next);
  }
  return next();
};

// Import PASSWORD_REGEX z hlavného servera (rovnaký ako v produkcii)
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

// Register endpoint (kopíruje logiku z server.js)
app.post('/api/register', testScopedRegisterLimiter, async (req, res) => {
  const { firstName, lastName, email, password, address, _honey, turnstileToken } = req.body;
  const normalizedEmail = normalizeEmail(email);

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

  function isWhitespaceOnly(str) {
    if (!str) return true;
    return str.trim().length === 0;
  }
    if (!captchaData.success) {
      console.error('Turnstile verification failed:', captchaData);
      return res.status(400).json({ message: 'Overenie Captcha zlyhalo. Skúste to znova.' });
    }
  } catch (error) {
    console.error('Turnstile API error:', error);
    return res.status(500).json({ message: 'Chyba pri overovaní Captcha.' });
  }

  // 3. VALIDÁCIA POVINNÝCH POLÍ
  if (!firstName || !lastName || !normalizedEmail || !password || !address) {
    return res.status(400).json({ message: 'Všetky polia sú povinné.' });
  }

    // 3a. VALIDÁCIA WHITESPACE-ONLY POLÍ
    if (isWhitespaceOnly(firstName) || isWhitespaceOnly(lastName) || isWhitespaceOnly(address)) {
      return res.status(400).json({ message: 'Všetky polia sú povinné.' });
    }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Neplatný formát emailu.' });
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
    const userCheck = await client.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Užívateľ s týmto emailom už existuje.' });
    }

    // 6. VYTVORENIE POUŽÍVATEĽA
    const result = await client.query(
      `INSERT INTO users (first_name, last_name, email, password, address, role, created_at, verified)
       VALUES ($1, $2, $3, $4, $5, 'user', NOW(), false)
       RETURNING id, email, first_name`,
      [firstName, lastName, normalizedEmail, 'hashed_password', address]
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

  const registerRequest = (payload, ip = '127.0.0.1') => {
    return request(app)
      .post('/api/register')
      .set('x-forwarded-for', ip)
      .send(payload);
  };

  const userByEmail = async (email) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows;
  };

  beforeAll(async () => {
    await cleanupTestData();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    if (registerLimiter.store && typeof registerLimiter.store.resetAll === 'function') {
      registerLimiter.store.resetAll();
    }
    registerLimiter.resetKey('127.0.0.1');
    registerLimiter.resetKey('::1');
    registerLimiter.resetKey('::ffff:127.0.0.1');
  });

  afterEach(async () => {
    // Vyčistenie testovacích používateľov po každom teste
    await pool.query(`
      DELETE FROM users
      WHERE email LIKE 'test_register%'
         OR email IN ('user@@domain', 'example@email.com')
    `);
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

    test('2c. Hraničné validné heslo s presne 8 znakmi - success', async () => {
      const response = await registerRequest({
        ...validUserData,
        email: 'test_register_min8@example.com',
        password: 'Aa123456'
      });

      expect(response.status).toBe(201);

      const users = await userByEmail('test_register_min8@example.com');
      expect(users.length).toBe(1);
      expect(users[0].verified).toBe(false);
      expect(users[0].role).toBe('user');
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
      const response = await registerRequest({
          ...validUserData,
          email: 'test_register_security@example.com',
          password: 'Heslo123',
          turnstileToken: null
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Captcha');
      expect(axios.post).not.toHaveBeenCalled();
    });

    test('malo by detekovať bota cez honeypot pole', async () => {
      const response = await registerRequest({
          ...validUserData,
          email: 'test_register_bot@example.com',
          password: 'Heslo123',
          _honey: 'bot_value'
        });

      // Bot dostane fake success, ale používateľ nebude vytvorený
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Registrácia úspešná');
      expect(axios.post).not.toHaveBeenCalled();

      // Overenie že používateľ NEBOL vytvorený
      const userResult = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        ['test_register_bot@example.com']
      );
      expect(userResult.rows.length).toBe(0);
    });

    test('malo by zamietnúť registráciu pri neúspešnom Turnstile overení', async () => {
      axios.post.mockResolvedValueOnce({ data: { success: false } });

      const response = await registerRequest({
        ...validUserData,
        email: 'test_register_turnstile_fail@example.com',
        password: 'Heslo123',
        turnstileToken: 'invalid_token'
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Overenie Captcha zlyhalo');

      const users = await userByEmail('test_register_turnstile_fail@example.com');
      expect(users.length).toBe(0);
    });

    test('malo by vrátiť 500 keď Turnstile služba zlyhá', async () => {
      axios.post.mockRejectedValueOnce(new Error('Turnstile down'));

      const response = await registerRequest({
        ...validUserData,
        email: 'test_register_turnstile_error@example.com',
        password: 'Heslo123',
        turnstileToken: 'test_valid_token'
      });

      expect(response.status).toBe(500);
      expect(response.body.message).toContain('Chyba pri overovaní Captcha');

      const users = await userByEmail('test_register_turnstile_error@example.com');
      expect(users.length).toBe(0);
    });

    test('malo by volať Turnstile endpoint s tokenom', async () => {
      const response = await registerRequest({
        ...validUserData,
        email: 'test_register_turnstile_called@example.com',
        password: 'Heslo123',
        turnstileToken: 'verify_me_token'
      });

      expect(response.status).toBe(201);
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        expect.any(URLSearchParams)
      );
    });

    test('malo by zamietnúť duplicitný email', async () => {
      // Najprv vytvoríme používateľa
      await registerRequest({
          ...validUserData,
          email: 'test_duplicate@example.com',
          password: 'Heslo123'
        });

      // Pokus o registráciu s rovnakým emailom
      const response = await registerRequest({
          ...validUserData,
          email: 'test_duplicate@example.com',
          password: 'Heslo123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Užívateľ s týmto emailom už existuje');

      const users = await userByEmail('test_duplicate@example.com');
      expect(users.length).toBe(1);
    });

    test('malo by brať email case-insensitive pri duplicitnej registrácii', async () => {
      await registerRequest({
        ...validUserData,
        email: 'test_case_insensitive@example.com',
        password: 'Heslo123'
      });

      const response = await registerRequest({
        ...validUserData,
        email: 'Test_Case_Insensitive@Example.com',
        password: 'Heslo123'
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Užívateľ s týmto emailom už existuje');

      const users = await userByEmail('test_case_insensitive@example.com');
      expect(users.length).toBe(1);
    });
  });

  describe('📝 Validácia ostatných polí', () => {
    
    test('malo by zamietnúť registráciu bez povinných polí', async () => {
      const response = await registerRequest({
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

    test.each([
      ['firstName', ''],
      ['lastName', ''],
      ['email', ''],
      ['password', ''],
      ['address', ''],
      ['firstName', null],
      ['lastName', null],
      ['email', null],
      ['password', null],
      ['address', null],
      ['firstName', undefined],
      ['lastName', undefined],
      ['email', undefined],
      ['password', undefined],
      ['address', undefined],
    ])('malo by zamietnúť registráciu keď je pole %s neplatné (%s)', async (field, value) => {
      const emailSuffix = String(value).replace(/[^a-z]/gi, '');
      const payload = {
        ...validUserData,
        email: `test_register_required_${field}_${emailSuffix}@example.com`,
        password: 'Heslo123'
      };

      payload[field] = value;

      const response = await registerRequest(payload);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Všetky polia sú povinné');

      const users = await userByEmail(payload.email);
      expect(users.length).toBe(0);
    });

    test('malo by zamietnúť whitespace-only hodnoty v firstName, lastName a address', async () => {
      const response = await registerRequest({
        ...validUserData,
        email: 'test_register_whitespace_only@example.com',
        password: 'Heslo123',
        firstName: '   ',
        lastName: '\t',
        address: ' \n '
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Všetky polia sú povinné');

      const users = await userByEmail('test_register_whitespace_only@example.com');
      expect(users.length).toBe(0);
    });

    test('malo by zamietnúť nevalidný email formát (napr. user@@domain)', async () => {
      const response = await registerRequest({
        ...validUserData,
        email: 'test_register_invalid@@domain',
        password: 'Heslo123'
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Neplatný formát emailu');

      const users = await userByEmail('test_register_invalid@@domain');
      expect(users.length).toBe(0);
    });

    test('malo by normalizovať email pri registrácii na lowercase', async () => {
      const response = await registerRequest({
        ...validUserData,
        email: 'Test_Register_Normalized@Example.com',
        password: 'Heslo123'
      });

      expect(response.status).toBe(201);

      const usersLower = await userByEmail('test_register_normalized@example.com');
      expect(usersLower.length).toBe(1);

      const usersOriginalCase = await userByEmail('Test_Register_Normalized@Example.com');
      expect(usersOriginalCase.length).toBe(0);
    });

    test('malo by obmedziť počet pokusov z jednej IP adresy (anti-bruteforce/rate limit)', async () => {
      const responses = [];

      for (let i = 0; i < 7; i++) {
        const response = await registerRequest({
          ...validUserData,
          email: `test_register_ratelimit_${i}@example.com`,
          password: 'Heslo123'
        });

        responses.push(response.status);
      }

      expect(responses.some((status) => status === 429)).toBe(true);
      const lastStatus = responses[responses.length - 1];
      expect(lastStatus).toBe(429);
    });
  });
});
