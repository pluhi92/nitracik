require('dotenv').config();

// Time handling rules
// - All timestamps are stored in UTC (PostgreSQL TIMESTAMPTZ)
// - Backend runs in UTC (process.env.TZ = 'UTC')
// - Frontend receives UTC and converts to Europe/Bratislava for display
// - No to_char(), no implicit Date conversions
// - Local time exists only at UI boundaries
process.env.TZ = 'UTC';

const emailService = require('./services/emailService');

const PORT = process.env.PORT || 5000;

console.log('PORT:', PORT);
console.log('DB_USER:', process.env.DB_USER);

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const { Pool } = require('pg');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { v4: uuidv4 } = require('uuid');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PDFDocument = require('pdfkit');
const fs = require('fs');
const app = express();
const path = require('path');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
require('dayjs/locale/sk');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('sk');

const APP_TIMEZONE = 'Europe/Bratislava';

const to24Hour = (timeWithMeridiem) => {
  if (!timeWithMeridiem) return null;
  const [time, modifier] = timeWithMeridiem.split(' ');
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours, 10);
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

const toUtcDateTime = (date, time24) => {
  if (!date || !time24) return null;
  return dayjs.tz(`${date} ${time24}`, 'YYYY-MM-DD HH:mm', APP_TIMEZONE).utc().toDate();
};

const toUtcDateTimeFromLocalInput = (localDateTime) => {
  if (!localDateTime) return null;
  return dayjs.tz(localDateTime, APP_TIMEZONE).utc().toDate();
};
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
const multer = require('multer');
const sharp = require('sharp');

app.set('trust proxy', 1);


app.use((req, res, next) => {
  console.log('REQ IP:', req.ip);
  console.log('XFF:', req.headers['x-forwarded-for']);
  next();
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hodina
  max: 5,
  message: { message: 'Príliš veľa pokusov o registráciu z tejto IP adresy, skúste to prosím neskôr.' },
  standardHeaders: true,
  legacyHeaders: false,
});

//upload directory setup
const uploadDir = path.join(__dirname, 'public', 'uploads', 'blog');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ SHARP: Memory storage namiesto disk storage
const storage = multer.memoryStorage();

// ✅ SHARP: Rozšírený filter pre všetky bežné formáty
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|bmp|tiff|svg/;
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Len obrázky sú povolené'));
  }
};

const createSlug = (title) => {
  return title
    .toString()
    .normalize('NFD')                   
    .replace(/[\u0300-\u036f]/g, '')   
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')               
    .replace(/[^\w\-]+/g, '')           
    .replace(/\-\-+/g, '-');            
};

// ✅ SHARP: Zvýšený buffer limit (Sharp potom skomprimuje)
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB buffer
  },
  fileFilter: fileFilter
});

// ✅ UPRAVENÁ FUNKCIA processImage s THUMBNAIL podporou
async function processImage(buffer, filename) {
  try {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    
    const webpFilename = `blog-${uniqueSuffix}.webp`;
    const outputPath = path.join(uploadDir, webpFilename);
    
    const thumbFilename = `blog-${uniqueSuffix}-thumb.webp`;
    const thumbPath = path.join(uploadDir, thumbFilename);

    // ✅ HLAVNÁ ÚPRAVA: pridané { failOnError: false }
    // Toto zabezpečí, že Sharp ignoruje chybu "Invalid SOS parameters"
    
    // 1. Spracovanie hlavného obrázka
    await sharp(buffer, { failOnError: false }) 
      .rotate() 
      .resize({
        width: 1200,
        height: 1200,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({
        quality: 90,
        effort: 6
      })
      .toFile(outputPath);

    // 2. Spracovanie thumbnailu (tiež pridaj failOnError)
    await sharp(buffer, { failOnError: false }) 
      .rotate() 
      .resize({
        width: 300,
        height: 200, 
        fit: 'cover',
        position: 'centre' 
      })
      .webp({
        quality: 80,
        effort: 6
      })
      .toFile(thumbPath);

    const stats = fs.statSync(outputPath);
    const thumbStats = fs.statSync(thumbPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);
    const thumbSizeKB = (thumbStats.size / 1024).toFixed(2);

    console.log(`✅ Obrázok spracovaný:`);
    console.log(`   - Full: ${webpFilename} (${fileSizeKB} KB)`);
    console.log(`   - Thumb: ${thumbFilename} (${thumbSizeKB} KB)`);

    return {
      filename: webpFilename,
      thumbnailFilename: thumbFilename,
      path: outputPath,
      thumbnailPath: thumbPath,
      size: stats.size,
      thumbnailSize: thumbStats.size
    };
  } catch (error) {
    console.error('❌ Chyba pri spracovaní obrázka:', error);
    throw error;
  }
}

app.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('🔹 [DEBUG] Webhook hit!'); // 1. Zistíme, či sem vôbec Stripe trafí
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('[DEBUG] Webhook Event Received:', event.type);
  } catch (err) {
    console.error('[DEBUG] Webhook Signature Verification Failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('📦 [DEBUG] Session data:', JSON.stringify(session.metadata, null, 2));
    const client = await pool.connect();

    // Initialize email data variables
    var emailDataToSend = null;
    var bookingEmailData = null;

    try {
      await client.query('BEGIN');

      // === 1. SEASON TICKET (Permanentka) ===
      if (session.metadata.type === 'season_ticket') {
        const { userId, entries, totalPrice, trainingTypeId } = session.metadata;
        console.log(`Processing Season Ticket for User: ${userId}, Entries: ${entries}, Price: ${totalPrice}, TrainingType: ${trainingTypeId}`);

        // Konverzia typov (Stripe posiela stringy)
        const entriesInt = parseInt(entries, 10);
        const priceFloat = parseFloat(totalPrice);
        const trainingTypeIdInt = parseInt(trainingTypeId, 10);

        if (!trainingTypeIdInt) {
          throw new Error('Training type is missing for season ticket purchase');
        }

        // Bezpečnostná kontrola: overiť cenu podľa ponuky
        const offerResult = await client.query(
          `SELECT price FROM season_ticket_offers WHERE training_type_id = $1 AND entries = $2 AND active = TRUE`,
          [trainingTypeIdInt, entriesInt]
        );

        if (offerResult.rows.length === 0) {
          console.error(`[SECURITY] Offer not found. TrainingType: ${trainingTypeIdInt}, Entries: ${entriesInt}`);
          throw new Error('Season ticket offer not found');
        }

        const dbPrice = parseFloat(offerResult.rows[0].price);
        if (dbPrice !== priceFloat) {
          console.error(`[SECURITY] Price mismatch. Entries: ${entriesInt}, Paid: ${priceFloat}, Expected: ${dbPrice}`);
          throw new Error('Payment amount verification failed');
        }

        // Exspirácia (6 mesiacov od nákupu) - UTC-safe
        const expiryDate = dayjs.utc().add(6, 'month').toDate();

        console.log('📝 [DEBUG] Attempting INSERT into DB...');

        // === INSERT DO DB (Vrátane amount_paid a payment_time) ===
        const ticketResult = await client.query(
          `INSERT INTO season_tickets (
              user_id, 
              training_type_id,
              entries_total, 
              entries_remaining, 
              purchase_date, 
              expiry_date, 
              stripe_payment_id, 
              amount_paid, 
              payment_time,
              created_at,
              updated_at
           )
           VALUES ($1, $2, $3, $3, NOW(), $4, $5, $6, $7, NOW(), NOW()) 
           RETURNING id`,
          [
            parseInt(userId, 10),            // $1: user_id
            trainingTypeIdInt,               // $2: training_type_id
            entriesInt,                      // $3: entries_total (aj remaining)
            expiryDate,                      // $4: expiry_date
            session.id,                      // $5: stripe_payment_id
            priceFloat,                      // $6: amount_paid
            new Date(session.created * 1000) // $7: payment_time (zo Stripe timestampu)
          ]
        );

        console.log('[DEBUG] Season ticket created ID:', ticketResult.rows[0].id);

        const typeResult = await client.query(
          `SELECT name FROM training_types WHERE id = $1`,
          [trainingTypeIdInt]
        );
        const trainingTypeName = typeResult.rows[0]?.name || '';

        // Odoslanie emailu užívateľovi
        const userResult = await client.query(
          'SELECT first_name, last_name, email, address FROM users WHERE id = $1',
          [userId]
        );
        const user = userResult.rows[0];
        const stripePaymentId = session.payment_intent || session.id;

        if (user) {
          // Store email data to send AFTER transaction commits
          var emailDataToSend = {
            type: 'season_ticket_confirmation',
            userEmail: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            address: user.address,
            entries: entriesInt,
            totalPrice: priceFloat,
            expiryDate,
            trainingTypeName,
            stripePaymentId
          };
        }

      } else if (session.metadata.type === 'training_session') {
        const {
          userId,
          trainingId,
          trainingType,
          selectedDate,
          selectedTime,
          childrenCount,
          childrenAge,
          totalPrice,
          photoConsent,
          mobile,
          note,
          accompanyingPerson,
        } = session.metadata;

        if (!userId || !trainingType || !childrenCount || !totalPrice) {
          throw new Error('Missing required metadata fields');
        }
        if (!trainingId && (!selectedDate || !selectedTime)) {
          throw new Error('Missing required metadata fields');
        }

        let trainingResult;
        let training;

        if (trainingId) {
          trainingResult = await client.query(
            `SELECT * FROM training_availability WHERE id = $1`,
            [parseInt(trainingId, 10)]
          );
        } else {
          // Resolve training_type name to training_type_id
          const typeIdResult = await client.query(
            `SELECT id FROM training_types WHERE name = $1`,
            [trainingType]
          );
          if (typeIdResult.rows.length === 0) {
            throw new Error(`Training type '${trainingType}' not found`);
          }
          const trainingTypeId = typeIdResult.rows[0].id;
          
          const time24 = to24Hour(selectedTime);
          const trainingDateTimeUtc = toUtcDateTime(selectedDate, time24);

          trainingResult = await client.query(
            `SELECT * FROM training_availability WHERE training_type_id = $1 AND training_date = $2`,
            [trainingTypeId, trainingDateTimeUtc]
          );
        }

        if (trainingResult.rows.length === 0) {
          throw new Error('Training session no longer available');
        }

        training = trainingResult.rows[0];

        let displayDate = selectedDate;
        let displayTime = selectedTime;
        if ((!displayDate || !displayTime) && training?.training_date) {
          const trainingLocal = dayjs(training.training_date).tz(APP_TIMEZONE);
          if (!displayDate) displayDate = trainingLocal.format('YYYY-MM-DD');
          if (!displayTime) displayTime = trainingLocal.format('HH:mm');
        }
        const bookingsResult = await client.query(
          `SELECT COALESCE(SUM(number_of_children), 0) AS booked_children FROM bookings WHERE training_id = $1`,
          [training.id]
        );
        const bookedCount = parseInt(bookingsResult.rows[0].booked_children, 10);
        if (bookedCount >= training.max_participants) {
          throw new Error('Session is full');
        }

        // Update existing booking with payment details
        const paymentIntentId = session.payment_intent;
        const updateResult = await client.query(
          `UPDATE bookings 
           SET amount_paid = $1, 
               payment_time = $2, 
               payment_intent_id = $3, 
               session_id = NULL 
           WHERE session_id = $4 
           RETURNING *`,
          [parseFloat(totalPrice), new Date(session.created * 1000), paymentIntentId, session.id]
        );

        if (updateResult.rowCount === 0) {
          throw new Error('No booking found with the provided session ID');
        }

        const booking = updateResult.rows[0];
        console.log('[DEBUG] Booking updated with payment details:', {
          bookingId: booking.id,
          paymentIntentId,
          amountPaid: totalPrice,
          sessionId: session.id
        });

        const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];

        // Store booking email data to send AFTER transaction commits
        const targetEmail = user.email || session.customer_details?.email;
        const firstName = user.first_name || 'Osôbka';

        var bookingEmailData = {
          targetEmail,
          selectedDate: displayDate,
          selectedTime: displayTime,
          trainingType,
          firstName,
          user,
          mobile,
          childrenCount,
          childrenAge,
          photoConsent,
          accompanyingPerson,
          note,
          totalPrice,
          paymentIntentId,
          trainingId: training.id
        };

        console.log('[DEBUG] Booking data stored, will send emails after transaction commits');
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[DEBUG] Webhook processing error:', error.message);
    } finally {
      client.release();
    }
  }

  // === RESPOND TO STRIPE IMMEDIATELY (Best Practice) ===
  // This must be OUTSIDE the if block, so ALL events get acknowledged
  res.json({ received: true });

  // === SEND EMAILS ASYNCHRONOUSLY AFTER STRIPE ACK ===
  // Only send if we have email data from a season ticket purchase
  if (emailDataToSend) {
    console.log('📧 [DEBUG] Sending season ticket confirmation email to:', emailDataToSend.userEmail);
    emailService.sendSeasonTicketConfirmation(
      emailDataToSend.userEmail, 
      emailDataToSend.firstName, 
      {
        entries: emailDataToSend.entries,
        totalPrice: emailDataToSend.totalPrice,
        expiryDate: emailDataToSend.expiryDate,
        trainingTypeName: emailDataToSend.trainingTypeName,
        stripePaymentId: emailDataToSend.stripePaymentId
      }
    ).catch(err => console.error('Failed to send season ticket confirmation email:', err.message));
    
    // Send admin notification
    emailService.sendAdminSeasonTicketPurchase('info@nitracik.sk', {
      user: {
        first_name: emailDataToSend.firstName,
        last_name: emailDataToSend.lastName,
        email: emailDataToSend.userEmail,
        address: emailDataToSend.address
      },
      entries: emailDataToSend.entries,
      totalPrice: emailDataToSend.totalPrice,
      expiryDate: emailDataToSend.expiryDate,
      stripePaymentId: emailDataToSend.stripePaymentId,
      trainingTypeName: emailDataToSend.trainingTypeName
    }).catch(err => console.error('Failed to send admin season ticket notification:', err.message));
  }

  // Send booking confirmation emails if booking was processed
  if (bookingEmailData) {
    console.log('📧 [DEBUG] Sending booking confirmation email to:', bookingEmailData.targetEmail);
    emailService.sendUserBookingEmail(bookingEmailData.targetEmail, {
      date: bookingEmailData.selectedDate,
      start_time: bookingEmailData.selectedTime,
      trainingType: bookingEmailData.trainingType,
      userName: bookingEmailData.firstName,
      paymentType: 'payment'
    }).catch(err => console.error('Failed to send user booking email:', err.message));

    // Send admin booking notification
    emailService.sendAdminNewBookingNotification('info@nitracik.sk', {
      user: bookingEmailData.user,
      mobile: bookingEmailData.mobile,
      childrenCount: bookingEmailData.childrenCount,
      childrenAge: bookingEmailData.childrenAge,
      trainingType: bookingEmailData.trainingType,
      selectedDate: bookingEmailData.selectedDate,
      selectedTime: bookingEmailData.selectedTime,
      photoConsent: bookingEmailData.photoConsent,
      accompanyingPerson: bookingEmailData.accompanyingPerson,
      note: bookingEmailData.note,
      totalPrice: bookingEmailData.totalPrice,
      paymentIntentId: bookingEmailData.paymentIntentId,
      trainingId: bookingEmailData.trainingId
    }).catch(err => console.error('Failed to send admin booking notification:', err.message));

    console.log('[DEBUG] Booking confirmation emails sent (after transaction)');
  }
});

// Add webhook handler for refund updates
app.post('/stripe-refund-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'charge.refund.updated') {
    const refund = event.data.object;

    try {
      await pool.query(
        'UPDATE refunds SET status = $1, updated_at = NOW() WHERE refund_id = $2',
        [refund.status, refund.id]
      );
      console.log('Refund status updated:', refund.id, refund.status);
    } catch (error) {
      console.error('Error updating refund status:', error);
    }
  }

  res.json({ received: true });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  '/images',
  express.static(path.join(__dirname, 'public/images'), {
    maxAge: '30d',
    immutable: true
  })
);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'user_sessions',
  }),
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24,
  },
}));

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Súbor je príliš veľký. Maximálna veľkosť je 5MB.'
      });
    }
  }
  next(error);
});


const isAdmin = async (req, res, next) => {
  try {
    console.log(`[isAdmin] Checking admin access for userId=${req.session.userId}, session.role=${req.session.role}`);
    
    if (!req.session.userId) {
      console.log(`[isAdmin] ❌ DENIED: No userId in session`);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1. PRIORITA 1: Kontrola role v session (najrýchlejšie, nastavená pri login)
    if (req.session.role === 'admin') {
      console.log(`[isAdmin] ✅ ALLOWED: session.role === 'admin' (userId=${req.session.userId})`);
      return next();
    }

    const client = await pool.connect();
    try {
      // 2. PRIORITA 2: Kontrola role z DB
      const result = await client.query(
        'SELECT role, email FROM users WHERE id = $1',
        [req.session.userId]
      );

      if (!result.rows.length) {
        console.log(`[isAdmin] ❌ DENIED: User not found in DB (userId=${req.session.userId})`);
        return res.status(401).json({ error: 'User not found' });
      }

      const user = result.rows[0];
      console.log(`[isAdmin] User found: email=${user.email}, role=${user.role}`);

      // Check DB role
      if (user.role === 'admin') {
        console.log(`[isAdmin] ✅ ALLOWED: DB role === 'admin' (email=${user.email})`);
        return next();
      }

      // Žiadna podmienka nesplnená → pristup odmietnutý
      console.log(`[isAdmin] ❌ DENIED: User ${user.email} is not admin (role=${user.role})`);
      return res.status(403).json({ error: 'Forbidden: Admin access required' });

    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[isAdmin] ERROR:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

function isAuthenticated(req, res, next) {
  console.log('Session data in isAuthenticated:', req.session);
  if (req.session.userId) {
    // Fetch user email to check admin status
    pool.query('SELECT email FROM users WHERE id = $1', [req.session.userId], (err, result) => {
      if (err || !result.rows.length) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      req.session.email = result.rows[0].email;
      next();
    });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
}


app.post('/api/set-training', isAdmin, async (req, res) => {
  try {
    const { trainingType, trainingDate, maxParticipants } = req.body;

    // 1. PRETYPOVANIE na číslo (istota pre SQL query)
    const typeId = parseInt(trainingType, 10);

    // 2. Kontrola typu
    const typeRes = await pool.query('SELECT name FROM training_types WHERE id = $1', [typeId]);

    if (typeRes.rows.length === 0) {
      console.log(`[ERROR] Training type ID ${typeId} not found in DB`);
      return res.status(404).json({ error: `Training type ID ${typeId} not found` });
    }

    const typeName = typeRes.rows[0].name;
    const trainingDateUtc = toUtcDateTimeFromLocalInput(trainingDate);

    // 3. Vloženie - skontroluj si, či máš v DB stĺpce training_type_id, training_type, training_date, max_participants
    const result = await pool.query(
      `INSERT INTO training_availability 
       (training_type_id, training_type, training_date, max_participants)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [typeId, typeName, trainingDateUtc, maxParticipants]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    // TOTO vypíše presnú chybu z Postgresu (napr. že chýba stĺpec)
    console.error('SET TRAINING ERROR:', error.message);
    res.status(500).json({
      error: 'Failed to set training date',
      details: error.message
    });
  }
});

app.get('/api/admin/bookings', isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ta.id AS training_id,
        ta.training_date,
        ta.training_type,
        ta.max_participants,
        ta.cancelled,
        u.id AS user_id,
        u.first_name,
        u.last_name,
        u.email,
        b.number_of_children,
        b.active,
        b.booking_type,
        b.amount_paid,
        COALESCE(SUM(b.number_of_children) OVER (PARTITION BY ta.id), 0) AS total_children,
        (ta.max_participants - COALESCE(SUM(b.number_of_children) OVER (PARTITION BY ta.id), 0)) AS available_spots
      FROM training_availability ta
      LEFT JOIN bookings b 
        ON ta.id = b.training_id
      LEFT JOIN users u 
        ON b.user_id = u.id
      WHERE ta.training_date >= NOW() - INTERVAL '60 minutes'
        AND (
          b.active = true
          OR NOT EXISTS (
            SELECT 1 FROM bookings b2 WHERE b2.credit_id = b.id
          )
        )
      ORDER BY ta.training_date DESC, ta.training_type;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching admin bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});


app.get('/api/admin/season-tickets', async (req, res) => {
  try {
    // === ZMENA: Pridaná podmienka WHERE ===
    // Zobrazujeme len tie, ktoré majú zostatok A SÚČASNE dátum expirácie je v budúcnosti
    const tickets = await pool.query(
      `SELECT u.first_name,
              u.last_name,
              u.email,
              s.user_id,
              s.entries_total,
              s.entries_remaining,
              s.expiry_date,
              s.training_type_id,
              t.name AS training_type_name,
              t.name AS training_type
       FROM season_tickets s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN training_types t ON s.training_type_id = t.id
       WHERE s.entries_remaining > 0 AND s.expiry_date >= NOW()`
    );
    res.json(tickets.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch season tickets' });
  }
});

// GET archived sessions for admin
app.get('/api/admin/archived-sessions', async (req, res) => {
  try {
    const query = `
      SELECT 
        ts.id as training_id,
        ts.training_type,
        ts.training_date,
        COUNT(DISTINCT b.id) as participant_count,
        SUM(b.number_of_children) as total_children
      FROM training_availability ts   -- <--- ZMENA TU (pôvodne training_sessions)
      LEFT JOIN bookings b ON ts.id = b.training_id AND b.active = true
      WHERE ts.training_date < NOW() - INTERVAL '1 hour'
      GROUP BY ts.id, ts.training_type, ts.training_date
      ORDER BY ts.training_date DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching archived sessions:', error);
    res.status(500).json({ error: 'Failed to fetch archived sessions' });
  }
});

// GET archived sessions for specific user
app.get('/api/archived-sessions/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT 
        b.id as booking_id,
        b.training_id,
        b.booking_type,
        ts.training_type,
        ts.training_date
      FROM bookings b
      JOIN training_availability ts ON b.training_id = ts.id  -- <--- ZMENA TU
      WHERE b.user_id = $1 
        AND b.active = true
        AND ts.training_date < NOW() - INTERVAL '1 hour'
      ORDER BY ts.training_date DESC
    `;
    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user archived sessions:', error);
    res.status(500).json({ error: 'Failed to fetch archived sessions' });
  }
});

// Update /api/admin/payment-report endpoint
app.post('/api/admin/payment-report', isAuthenticated, async (req, res) => {
  // Check if user is admin
  const userEmail = req.session.email;
  if (userEmail !== 'info@nitracik.sk') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { startDate, endDate } = req.body;
  const currentDate = new Date();

  // Validate date range
  if (new Date(endDate) > currentDate) {
    return res.status(400).json({
      error: `End date cannot be later than ${currentDate.toLocaleDateString('en-US', { timeZone: 'Europe/Budapest' })}. Please select a date up to today.`,
    });
  }

  const client = await pool.connect();

  try {
    // Convert endDate to include the full day
    const endDateWithTime = new Date(endDate);
    endDateWithTime.setHours(23, 59, 59, 999);

    // ✅ UPDATED: Fetch only PAID bookings (excluding credit and season ticket bookings)
    const sessionPayments = await client.query(
      `SELECT 
    u.last_name, 
    u.first_name, 
    'reservation' AS order_type,
    b.amount_paid, 
    b.payment_time,
    b.booked_at
   FROM bookings b 
   JOIN users u ON b.user_id = u.id 
   WHERE b.payment_time BETWEEN $1 AND $2 
   AND b.booking_type = 'paid' -- ✅ ONLY include paid bookings
   AND b.amount_paid > 0
   ORDER BY b.payment_time ASC`,
      [startDate, endDateWithTime]
    );

    // Fetch payments for season ticket purchases
    const seasonTicketPayments = await client.query(
      `SELECT u.last_name, u.first_name, 'season ticket purchase' AS order_type, 
              st.amount_paid, st.payment_time, st.purchase_date as booked_at
       FROM season_tickets st 
       JOIN users u ON st.user_id = u.id 
       WHERE st.payment_time BETWEEN $1 AND $2`,
      [startDate, endDateWithTime]
    );

    // Combine and sort results by payment time
    const payments = [...sessionPayments.rows, ...seasonTicketPayments.rows]
      .sort((a, b) => new Date(a.payment_time) - new Date(b.payment_time));

    console.log('Fetched payments - Paid bookings:', sessionPayments.rows.length, 'Season ticket purchases:', seasonTicketPayments.rows.length);

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="payment_report_${startDate}_to_${endDate}.pdf"`);
      res.send(pdfData);
    });

    // Title and Period
    doc.fontSize(16).text(`Payment Report`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Period: ${new Date(startDate).toLocaleDateString('sk-SK', { timeZone: 'Europe/Bratislava' })} to ${new Date(endDate).toLocaleDateString('sk-SK', { timeZone: 'Europe/Bratislava' })}`, { align: 'center' });
    doc.moveDown(2);

    // Table setup
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const columnWidths = [120, 120, 120, 100, 150];
    const totalTableWidth = columnWidths.reduce((a, b) => a + b);

    // Center the table horizontally
    const leftMargin = (pageWidth - totalTableWidth) / 2 + doc.page.margins.left;
    const tableTop = 180;
    const rowHeight = 30;
    const cellPadding = 5;

    // Table header
    doc.font('Helvetica-Bold').fontSize(10);
    const headerY = tableTop;

    // Draw header background
    doc.rect(leftMargin, headerY, totalTableWidth, rowHeight)
      .fill('#f0f0f0');

    // Header text
    doc.fillColor('#000').text('Last Name', leftMargin + cellPadding, headerY + cellPadding, { width: columnWidths[0] - cellPadding * 2 });
    doc.text('First Name', leftMargin + columnWidths[0] + cellPadding, headerY + cellPadding, { width: columnWidths[1] - cellPadding * 2 });
    doc.text('Order Type', leftMargin + columnWidths[0] + columnWidths[1] + cellPadding, headerY + cellPadding, { width: columnWidths[2] - cellPadding * 2 });
    doc.text('Amount Paid', leftMargin + columnWidths[0] + columnWidths[1] + columnWidths[2] + cellPadding, headerY + cellPadding, { width: columnWidths[3] - cellPadding * 2 });
    doc.text('Payment Time', leftMargin + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + cellPadding, headerY + cellPadding, { width: columnWidths[4] - cellPadding * 2 });

    // Draw data rows
    doc.font('Helvetica').fontSize(9);
    if (payments.length > 0) {
      payments.forEach((p, index) => {
        const y = tableTop + rowHeight * (index + 1);
        const amount = parseFloat(p.amount_paid) || 0;

        // Alternate row colors
        if (index % 2 === 0) {
          doc.rect(leftMargin, y, totalTableWidth, rowHeight)
            .fill('#ffffff');
        } else {
          doc.rect(leftMargin, y, totalTableWidth, rowHeight)
            .fill('#f9f9f9');
        }

        // Cell borders
        doc.rect(leftMargin, y, totalTableWidth, rowHeight)
          .stroke('#e0e0e0');

        // Cell content
        doc.fillColor('#333').text(p.last_name || 'N/A', leftMargin + cellPadding, y + cellPadding, { width: columnWidths[0] - cellPadding * 2 });
        doc.text(p.first_name || 'N/A', leftMargin + columnWidths[0] + cellPadding, y + cellPadding, { width: columnWidths[1] - cellPadding * 2 });
        doc.text(p.order_type || 'N/A', leftMargin + columnWidths[0] + columnWidths[1] + cellPadding, y + cellPadding, { width: columnWidths[2] - cellPadding * 2 });
        doc.text(`${amount.toFixed(2)} €`, leftMargin + columnWidths[0] + columnWidths[1] + columnWidths[2] + cellPadding, y + cellPadding, { width: columnWidths[3] - cellPadding * 2 });

        // Show payment time for both types
        const displayDate = p.payment_time ? new Date(p.payment_time).toLocaleString('sk-SK', { timeZone: 'Europe/Bratislava' }) : 'N/A';

        doc.text(displayDate, leftMargin + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + cellPadding, y + cellPadding, { width: columnWidths[4] - cellPadding * 2 });
      });

      // Footer with totals
      const totalY = tableTop + rowHeight * (payments.length + 1);
      const totalAmount = payments.reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0);

      doc.rect(leftMargin, totalY, totalTableWidth, rowHeight)
        .fill('#f0f0f0');

      doc.font('Helvetica-Bold').fillColor('#000')
        .text('Total:', leftMargin + cellPadding, totalY + cellPadding, { width: columnWidths[0] + columnWidths[1] + columnWidths[2] - cellPadding * 2 });

      doc.text(`${totalAmount.toFixed(2)} €`, leftMargin + columnWidths[0] + columnWidths[1] + columnWidths[2] + cellPadding, totalY + cellPadding, { width: columnWidths[3] - cellPadding * 2 });

      doc.rect(leftMargin, totalY, totalTableWidth, rowHeight)
        .stroke('#e0e0e0');
    } else {
      // Center the "no records" message
      doc.fontSize(10).text('No payment records found for the selected period.', doc.page.margins.left, tableTop + rowHeight, {
        width: pageWidth,
        align: 'center'
      });
    }

    doc.end();
  } catch (error) {
    console.error('Error generating payment report:', error);
    res.status(500).json({ error: 'Failed to generate payment report' });
  } finally {
    client.release();
  }
});

// GET Checklist pre konkrétny tréning
app.get('/api/admin/checklist/:trainingId', isAdmin, async (req, res) => {
  const { trainingId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        b.id AS booking_id,
        u.first_name,
        u.last_name,
        b.number_of_children,
        b.note,
        b.booking_type,
        b.amount_paid,
        b.credit_id,
        b.checked_in,  
        b.accompanying_person,
        b.photo_consent,  
        CASE 
            WHEN b.booking_type = 'paid' THEN 'Platba'
            WHEN b.booking_type = 'season_ticket' THEN 'Permanentka'
            WHEN b.booking_type = 'credit' THEN 'Kredit'
            ELSE b.booking_type 
        END as payment_display
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.training_id = $1 
        AND b.active = true
      ORDER BY u.last_name ASC, u.first_name ASC
    `, [trainingId]);

    // Získame aj info o tréningu pre hlavičku stránky
    const trainingInfo = await pool.query(`
        SELECT training_date, training_type 
        FROM training_availability 
        WHERE id = $1
    `, [trainingId]);

    res.json({
      participants: result.rows,
      training: trainingInfo.rows[0]
    });

  } catch (error) {
    console.error('Error fetching checklist:', error);
    res.status(500).json({ error: 'Failed to fetch checklist' });
  }
});

// PUT prepnutie check-in stavu
app.put('/api/admin/checklist/:bookingId/toggle', isAdmin, async (req, res) => {
  const { bookingId } = req.params;
  const { checked_in } = req.body; // Očakávame true/false

  try {
    await pool.query(
      'UPDATE bookings SET checked_in = $1 WHERE id = $2',
      [checked_in, bookingId]
    );
    res.json({ success: true, message: 'Check-in updated' });
  } catch (error) {
    console.error('Error updating check-in:', error);
    res.status(500).json({ error: 'Failed to update check-in' });
  }
});

app.get('/api/admin/archived-sessions-report', isAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    // SQL query, ktorá vytiahne archivované bookingy a zistí ich stav
    const query = `
      SELECT 
        b.id,
        u.first_name, u.last_name, u.email,
        b.amount_paid,
        b.archived_training_date,
        b.archived_training_type,
        b.payment_time,
        CASE 
          WHEN c.id IS NOT NULL THEN 'CREDIT'
          WHEN r.id IS NOT NULL THEN 'REFUNDED'
          ELSE 'RESOLVED'
        END as resolution_status
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      LEFT JOIN credits c ON b.id = c.session_id
      LEFT JOIN refunds r ON b.id = r.booking_id
      WHERE b.training_id IS NULL 
        AND b.archived_training_date IS NOT NULL
      ORDER BY b.archived_training_date DESC;
    `;

    const result = await client.query(query);
    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=archived_sessions_report.pdf');
    doc.pipe(res);

    // Hlavička PDF
    doc.fontSize(20).text('Report zrušených a archivovaných hodín', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Vygenerované: ${new Date().toLocaleString('sk-SK', {
      timeZone: 'Europe/Bratislava',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })}`, { align: 'right' });
    doc.moveDown();

    // Tabuľka
    const tableTop = 150;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Dátum hodiny', 30, tableTop);
    doc.text('Typ', 130, tableTop);
    doc.text('Užívateľ', 200, tableTop);
    doc.text('Suma', 380, tableTop);
    doc.text('Riešenie', 450, tableTop);

    doc.moveTo(30, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let y = tableTop + 25;
    doc.font('Helvetica');

    result.rows.forEach(row => {
      if (y > 750) { doc.addPage(); y = 50; } // Nová strana ak je plno

      const dateStr = new Date(row.archived_training_date).toLocaleDateString('sk-SK', {
        timeZone: 'Europe/Bratislava',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      });
      doc.text(dateStr, 30, y);
      doc.text(row.archived_training_type || '-', 130, y);
      doc.text(`${row.first_name} ${row.last_name}`, 200, y);
      doc.text(`${parseFloat(row.amount_paid).toFixed(2)} EUR`, 380, y);
      doc.text(row.resolution_status, 450, y);

      y += 20;
    });

    doc.end();
  } catch (error) {
    console.error('Archived report error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  } finally {
    client.release();
  }
});

app.get('/api/training-types', async (req, res) => {
  try {
    const isAdminRequest = req.query.admin === 'true'; // Admin vidí aj neaktívne

    let query = `
      SELECT t.*, 
             COALESCE(json_agg(json_build_object('child_count', p.child_count, 'price', p.price)) FILTER (WHERE p.id IS NOT NULL), '[]') as prices
      FROM training_types t
      LEFT JOIN training_prices p ON t.id = p.training_type_id
    `;

    if (!isAdminRequest) {
      query += ` WHERE t.active = TRUE`;
    }

    query += ` GROUP BY t.id ORDER BY t.name ASC`;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching training types:', error);
    res.status(500).json({ error: 'Failed to fetch training types' });
  }
});

// 2. POST nový typ tréningu (ADMIN)
app.post('/api/admin/training-types', isAdmin, async (req, res) => {
  // 1. Pridaj colorHex do deštrukturalizácie
  const { name, description, durationMinutes, prices, accompanyingPrice, colorHex } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 2. Uprav INSERT query - pridaj color_hex a $5
    const typeResult = await client.query(
      `INSERT INTO training_types (name, description, duration_minutes, accompanying_person_price, color_hex) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        name,
        description,
        durationMinutes || 60,
        accompanyingPrice || 3.00,
        colorHex || '#3b82f6' // Fallback farba ak by neprišla žiadna
      ]
    );
    const typeId = typeResult.rows[0].id;

    // Vloženie cien
    if (prices && Array.isArray(prices)) {
      for (const p of prices) {
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
    console.error('Error creating training type:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.put('/api/admin/training-types/:id/toggle', isAdmin, async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;
  try {
    await pool.query('UPDATE training_types SET active = $1 WHERE id = $2', [active, id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error toggling training type:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// --- SEASON TICKET OFFERS (USER) ---
app.get('/api/season-ticket-offers', async (req, res) => {
  try {
    const trainingTypeId = req.query.trainingTypeId ? parseInt(req.query.trainingTypeId, 10) : null;
    const params = [];
    let whereClause = 'WHERE o.active = TRUE';

    if (trainingTypeId) {
      params.push(trainingTypeId);
      whereClause += ` AND o.training_type_id = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT o.id,
              o.training_type_id,
              o.entries,
              o.price,
              o.active,
              t.name AS training_type_name
       FROM season_ticket_offers o
       JOIN training_types t ON t.id = o.training_type_id
       ${whereClause}
       ORDER BY t.name ASC, o.entries ASC`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching season ticket offers:', error);
    res.status(500).json({ error: 'Failed to fetch season ticket offers' });
  }
});

// --- SEASON TICKET OFFERS (ADMIN) ---
app.get('/api/admin/season-ticket-offers', isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.id,
              o.training_type_id,
              o.entries,
              o.price,
              o.active,
              t.name AS training_type_name
       FROM season_ticket_offers o
       JOIN training_types t ON t.id = o.training_type_id
       ORDER BY t.name ASC, o.entries ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching admin season ticket offers:', error);
    res.status(500).json({ error: 'Failed to fetch season ticket offers' });
  }
});

app.post('/api/admin/season-ticket-offers', isAdmin, async (req, res) => {
  const { trainingTypeId, offers } = req.body;
  const allowedEntries = [3, 5, 10];

  if (!trainingTypeId || !Array.isArray(offers)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const offer of offers) {
      const entries = parseInt(offer.entries, 10);
      const price = parseFloat(offer.price);
      const active = offer.active !== false;

      if (!allowedEntries.includes(entries) || Number.isNaN(price)) {
        throw new Error('Invalid offer data');
      }

      await client.query(
        `INSERT INTO season_ticket_offers (training_type_id, entries, price, active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (training_type_id, entries)
         DO UPDATE SET price = EXCLUDED.price, active = EXCLUDED.active, updated_at = NOW()`,
        [trainingTypeId, entries, price, active]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error upserting season ticket offers:', error);
    res.status(500).json({ error: 'Failed to save season ticket offers' });
  } finally {
    client.release();
  }
});

// UPRAVENÉ: training-dates endpoint musí vrátiť ID typu
app.get('/api/training-dates', async (req, res) => {
  try {
    const userId = req.session?.userId || null;
    let isAdmin = false;

    if (userId) {
      const roleCheck = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
      isAdmin = roleCheck.rows[0]?.role === 'admin';
    }

    // Join s training_types pre získanie aktuálneho názvu
    const result = await pool.query(
      `
        SELECT 
          ta.id, 
          tt.id as training_type_id,
          tt.name as training_type, 
          tt.duration_minutes,
          tt.description,
          tt.active,
          tt.color_hex, 
          ta.training_date, 
          ta.max_participants, 
          ta.cancelled
          FROM training_availability ta
          JOIN training_types tt ON ta.training_type_id = tt.id
          WHERE ta.training_date >= NOW()
          ${isAdmin ? '' : 'AND (ta.cancelled IS NULL OR ta.cancelled = FALSE) AND tt.active = TRUE'}
         ORDER BY ta.training_date ASC
         `
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fetch training dates error:', error);
    res.status(500).json({ error: 'Failed to fetch training dates' });
  }
});

app.get('/api/season-tickets/:userId', isAuthenticated, async (req, res) => {
  try {
    const userId = req.params.userId;
    if (req.session.userId !== parseInt(userId)) {
      return res.status(403).json({ error: 'Unauthorized access to season tickets' });
    }

    const result = await pool.query(
      `SELECT s.id,
              s.entries_total,
              s.entries_remaining,
              s.purchase_date,
              s.expiry_date,
              s.training_type_id,
              t.name AS training_type_name
       FROM season_tickets s
       LEFT JOIN training_types t ON s.training_type_id = t.id
       WHERE s.user_id = $1
       ORDER BY s.purchase_date DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching season tickets:', error);
    res.status(500).json({ error: 'Failed to fetch season tickets' });
  }
});

app.post('/api/create-season-ticket-payment', isAuthenticated, async (req, res) => {
  try {
    const { userId, entries, totalPrice, trainingTypeId } = req.body;
    if (!userId || !entries || !totalPrice || !trainingTypeId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const entriesInt = parseInt(entries, 10);
    const trainingTypeIdInt = parseInt(trainingTypeId, 10);

    const offerResult = await pool.query(
      `SELECT o.price, t.name AS training_type_name
       FROM season_ticket_offers o
       JOIN training_types t ON t.id = o.training_type_id
       WHERE o.training_type_id = $1 AND o.entries = $2 AND o.active = TRUE`,
      [trainingTypeIdInt, entriesInt]
    );

    if (offerResult.rows.length === 0) {
      return res.status(400).json({ error: 'Season ticket offer not available' });
    }

    const dbPrice = parseFloat(offerResult.rows[0].price);
    if (dbPrice !== parseFloat(totalPrice)) {
      return res.status(400).json({ error: 'Price validation failed' });
    }

    const productName = `Season Ticket (${entriesInt} Entries) - ${offerResult.rows[0].training_type_name}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: productName },
          unit_amount: Math.round(dbPrice * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-canceled`,
      metadata: {
        userId: userId.toString(),
        entries: entriesInt.toString(),
        totalPrice: dbPrice.toString(),
        trainingTypeId: trainingTypeIdInt.toString(),
        type: 'season_ticket',
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Season ticket payment session error:', error);
    res.status(500).json({ error: 'Failed to create payment session' });
  }
});

app.post('/api/use-season-ticket', isAuthenticated, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      userId, seasonTicketId, trainingTypeId, trainingId,
      childrenCount, childrenAge, photoConsent, mobile, note, accompanyingPerson,
    } = req.body;

    if (!userId || !seasonTicketId || !trainingTypeId || !trainingId || !childrenCount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Verify season ticket (Získame aj celkový počet a expiráciu)
    const ticketResult = await client.query(
      `SELECT entries_remaining, entries_total, expiry_date, training_type_id FROM season_tickets WHERE id = $1 AND user_id = $2`,
      [seasonTicketId, userId]
    );
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Season ticket not found' });
    }

    const ticketTrainingTypeId = ticketResult.rows[0].training_type_id;
    if (ticketTrainingTypeId && parseInt(trainingTypeId, 10) !== ticketTrainingTypeId) {
      return res.status(400).json({ error: 'Season ticket is not valid for this training type.' });
    }
    const ticket = ticketResult.rows[0]; // Tu máme entries_total aj expiry_date

    if (ticket.entries_remaining < childrenCount) {
      return res.status(400).json({ error: 'Not enough entries remaining in your season ticket' });
    }
    if (new Date(ticket.expiry_date) < new Date()) {
      return res.status(400).json({ error: 'Season ticket has expired' });
    }

    // Find training by ID
    const trainingResult = await client.query(
      `SELECT id, max_participants, training_type, training_date, training_type_id FROM training_availability WHERE id = $1`,
      [trainingId]
    );
    if (trainingResult.rows.length === 0) {
      throw new Error('Training session not found');
    }
    const training = trainingResult.rows[0];

    // Check availability
    const bookingsResult = await client.query(
      `SELECT COALESCE(SUM(number_of_children), 0) AS booked_children FROM bookings WHERE training_id = $1`,
      [training.id]
    );
    const bookedChildren = parseInt(bookingsResult.rows[0].booked_children, 10);
    if (bookedChildren + childrenCount > training.max_participants) {
      throw new Error('Not enough available spots');
    }

    // Insert booking
    const bookingResult = await client.query(
      `INSERT INTO bookings (user_id, training_id, number_of_children, amount_paid, payment_time, booked_at, active, booking_type, children_ages, photo_consent, mobile, note, accompanying_person)
       VALUES ($1, $2, $3, 0, NULL, NOW(), true, 'season_ticket', $4, $5, $6, $7, $8) RETURNING id`,
      [userId, training.id, childrenCount, childrenAge, photoConsent, mobile, note, accompanyingPerson]
    );
    const bookingId = bookingResult.rows[0].id;

    // Update season ticket
    const updateTicketResult = await client.query(
      `UPDATE season_tickets SET entries_remaining = entries_remaining - $1 WHERE id = $2 RETURNING entries_remaining`,
      [childrenCount, seasonTicketId]
    );
    const newBalance = updateTicketResult.rows[0].entries_remaining;

    // Record usage
    await client.query(
      `INSERT INTO season_ticket_usage (season_ticket_id, booking_id, training_type_id, created_at, used_date)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [seasonTicketId, bookingId, training.training_type_id]
    );

    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    await client.query('COMMIT');

    // --- EMAILY ---
    try {
      // 1. User Email (s detailmi o zostatku)
      await emailService.sendUserBookingEmail(user.email, {
        date: training.training_date, // Používame dátum z DB pre istotu
        trainingType: training.training_type,
        userName: user.first_name,
        paymentType: 'season_ticket',
        // Data pre permanentku:
        usedEntries: childrenCount,
        remainingEntries: newBalance,
        totalEntries: ticket.entries_total, // <--- Pridané
        expiryDate: ticket.expiry_date      // <--- Pridané
      });

      // 2. Admin Email (s trainingId pre tabuľku)
      await emailService.sendAdminSeasonTicketUsage('info@nitracik.sk', {
        user,
        mobile,
        childrenCount,
        childrenAge,
        trainingType: training.training_type,
        photoConsent,
        note,
        seasonTicketId,
        trainingId: training.id
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Nechceme zlyhať request len kvôli emailom, keď už je DB commitnutá
    }

    res.json({ success: true });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Season ticket booking error:', error);

    if (error.message.includes('Not enough entries remaining')) {
      res.status(400).json({ error: 'Not enough entries remaining in your season ticket' });
    } else if (error.message.includes('Season ticket has expired')) {
      res.status(400).json({ error: 'Season ticket has expired' });
    } else if (error.message.includes('Season ticket not found')) {
      res.status(404).json({ error: 'Season ticket not found' });
    } else if (error.message.includes('Not enough available spots')) {
      res.status(400).json({ error: 'Not enough available spots in the selected session' });
    } else if (error.message.includes('Training session not found')) {
      res.status(404).json({ error: 'Training session not found' });
    } else {
      res.status(500).json({ error: 'Failed to process season ticket booking' });
    }
  } finally {
    client.release();
  }
});

// UPRAVENÉ: create-payment-session - Dynamický výpočet ceny
app.post('/api/create-payment-session', isAuthenticated, async (req, res) => {
  try {
    const {
      userId,
      trainingId, // <--- Toto je kľúčové. Ak user nevyberie čas, toto je zvyčajne null/undefined
      trainingType,
      selectedDate,
      selectedTime,
      childrenCount,
      childrenAge,
      photoConsent,
      mobile,
      note,
      accompanyingPerson,
    } = req.body;

    // --- 1. VALIDÁCIA VSTUPOV (FIX) ---
    // Skôr než začneme transakciu, overíme, či máme to najhlavnejšie - ID tréningu
    if (!trainingId) {
      // Tu vrátime 400 (Bad Request) a jasnú hlášku pre užívateľa
      return res.status(400).json({ error: 'Nebol vybratý konkrétny termín (čas). Prosím, kliknite na požadovaný čas tréningu.' });
    }

    if (!childrenCount || childrenCount < 1) {
      return res.status(400).json({ error: 'Musíte zvoliť aspoň jedno dieťa.' });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Získame detaily tréningu a CENNÍK pre daný typ
      const trainingResult = await client.query(
        `SELECT ta.id, ta.max_participants, ta.training_date, 
                tt.name as type_name, tt.accompanying_person_price,
                tp.price as base_price
         FROM training_availability ta
         JOIN training_types tt ON ta.training_type_id = tt.id
         JOIN training_prices tp ON tp.training_type_id = tt.id AND tp.child_count = $2
         WHERE ta.id = $1`,
        [trainingId, childrenCount]
      );

      if (trainingResult.rows.length === 0) {
        throw new Error('Pre tento termín sa nenašiel záznam alebo platná cena.');
      }
      const training = trainingResult.rows[0];

      // 2. Výpočet ceny na serveri (Bezpečnosť)
      let calculatedPrice = parseFloat(training.base_price);
      if (accompanyingPerson) {
        calculatedPrice += parseFloat(training.accompanying_person_price);
      }

      // Validácia kapacity (ostáva rovnaká)
      const bookingsResult = await client.query(
        `SELECT COALESCE(SUM(number_of_children), 0) AS booked_children 
         FROM bookings WHERE training_id = $1 AND active = true`,
        [training.id]
      );
      const bookedChildren = parseInt(bookingsResult.rows[0].booked_children, 10);

      if (bookedChildren + childrenCount > training.max_participants) {
        throw new Error('Kapacita tréningu bola práve naplnená.');
      }

      const sessionDate = new Date(training.training_date).toLocaleDateString('sk-SK');

      // 3. Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${training.type_name} Tréning`,
              description: `Termín: ${sessionDate} | Počet detí: ${childrenCount}`
            },
            unit_amount: Math.round(calculatedPrice * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&booking_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment-canceled`,
        metadata: {
          userId: userId.toString(),
          trainingId: training.id.toString(),
          trainingType: training.type_name,
          selectedDate,
          selectedTime,
          childrenCount: childrenCount.toString(),
          childrenAge: childrenAge?.toString() || '',
          totalPrice: calculatedPrice.toString(), // Ukladáme vypočítanú cenu
          photoConsent: photoConsent?.toString() || 'false',
          mobile: mobile || '',
          note: note || '',
          accompanyingPerson: accompanyingPerson?.toString() || 'false',
          type: 'training_session',
        },
      });

      // 4. Vytvorenie záznamu (ostáva rovnaké, len používame calculatedPrice)
      const bookingResult = await client.query(
        `INSERT INTO bookings (
          user_id, training_id, number_of_children, amount_paid, payment_time, 
          session_id, booked_at, children_ages, photo_consent, mobile, note, accompanying_person, active, booking_type
        ) VALUES ($1, $2, $3, $4, NULL, $5, NOW(), $6, $7, $8, $9, $10, true, 'paid')
        RETURNING id`,
        [
          userId,
          training.id,
          childrenCount,
          calculatedPrice,
          session.id,
          childrenAge || '',
          photoConsent !== null ? photoConsent : false,
          mobile || '',
          note || '',
          accompanyingPerson || false,
        ]
      );

      await client.query('COMMIT');
      res.json({ sessionId: session.id, bookingId: bookingResult.rows[0].id });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[DEBUG] Transaction error:', error.message);
      res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[DEBUG] Payment session error:', error.message);
    res.status(500).json({ error: `Chyba pri vytváraní platby: ${error.message}` });
  }
});

// Updated endpoint to handle payment success redirect
app.get('/api/booking-success', isAuthenticated, async (req, res) => {
  const { session_id, booking_id } = req.query;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === 'paid') {
      const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
      const amountPaid = paymentIntent.amount / 100; // Convert from cents to euros
      const paymentTime = new Date(paymentIntent.created * 1000);

      // Update existing booking with payment details
      await client.query(
        `UPDATE bookings 
         SET amount_paid = $1, payment_time = $2, session_id = NULL 
         WHERE id = $3`,
        [amountPaid, paymentTime, booking_id]
      );
    }

    await client.query('COMMIT');
    res.redirect('/user-profile'); // Redirect to profile after success
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  } finally {
    client.release();
  }
});

app.use((req, res, next) => {
  console.log('Session data:', req.session);
  next();
});

function validateEnvVariables() {
  const requiredEnvVars = [
    'EMAIL_USER',
    'EMAIL_PASS',
    'DB_USER',
    'DB_HOST',
    'DB_NAME',
    'DB_PASSWORD',
    'DB_PORT',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'FRONTEND_URL',
    'SESSION_SECRET',
    'CLOUDFLARE_SECRET' // <--- CLOUDFLARE TURNSTILE
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing ${envVar} in environment variables.`);
      process.exit(1);
    }
  }
}

validateEnvVariables();

app.get('/api/test-email', async (req, res) => {
  try {
    await emailService.sendTestEmail('info@nitracik.sk');
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

// async function sendEmail(mailOptions) {
//   try {
//     await transporter.sendMail(mailOptions);
//     console.log(`Email sent to ${mailOptions.to}`);
//   } catch (error) {
//     console.error(`Error sending email to ${mailOptions.to}:`, error);
//     throw error;
//   }
// }

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateMobile(mobile) {
  const mobileRegex = /^\d{10,15}$/;
  return mobileRegex.test(mobile);
}

app.post('/api/register', registerLimiter, async (req, res) => {
  // Turnstile token z frontendu
  const { firstName, lastName, email, password, address, _honey, turnstileToken } = req.body;

  // 1. HONEYPOT KONTROLA (už si mal)
  if (_honey) {
    console.log(`Bot detected via honeypot. IP: ${req.ip}`);
    return res.status(200).json({ message: 'Registrácia úspešná' }); // Fake success
  }

  // 2. CLOUDFLARE TURNSTILE OVERENIE (NOVÉ)
  if (!turnstileToken) {
    return res.status(400).json({ message: 'Prosím, potvrďte, že nie ste robot (Captcha).' });
  }

  try {
    const verificationUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    
    // Vytvoríme form-data namiesto JSON objektu
    const formData = new URLSearchParams();
    formData.append('secret', process.env.CLOUDFLARE_SECRET);
    formData.append('response', turnstileToken);
    formData.append('remoteip', req.ip);

    // Axios automaticky nastaví hlavičku na 'application/x-www-form-urlencoded'
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

  // --- ZVYŠOK TVOJHO PÔVODNÉHO KÓDU ---
  // Od tohto bodu je kód rovnaký ako predtým, len pokračuješ validáciou a DB operáciami.

  if (!firstName || !lastName || !email || !password || !address) {
    return res.status(400).json({ message: 'Všetky polia sú povinné.' });
  }

  // Validácia hesla
  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({
      message: 'Heslo musí mať min. 8 znakov, veľké a malé písmeno, číslo a špeciálny znak.'
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Kontrola existencie emailu
    const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Užívateľ s týmto emailom už existuje.' });
    }

    // Hashovanie hesla
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Vytvorenie verifikačného tokenu
    const verificationToken = uuidv4();

    // Vloženie užívateľa
    const newUser = await client.query(
      `INSERT INTO users 
      (first_name, last_name, email, password, address, role, created_at, verified, verification_token)
       VALUES ($1, $2, $3, $4, $5, 'user', NOW(), false, $6) 
       RETURNING id, email, first_name`,
      [firstName, lastName, email, hashedPassword, address, verificationToken]
    );

    await client.query('COMMIT');

    // Odoslanie emailu (asynchrónne, neblokujeme response)
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;

    emailService.sendVerificationEmail(email, firstName, verificationLink).catch(err =>
      console.error('Email send failed:', err)
    );

    res.status(201).json({
      message: 'Registrácia úspešná! Skontrolujte si email pre aktiváciu účtu.'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Chyba pri registrácii:', error);
    res.status(500).json({ message: 'Interná chyba servera' });
  } finally {
    client.release();
  }
});

app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const resetToken = uuidv4();
    await pool.query('UPDATE users SET reset_token = $1 WHERE id = $2', [resetToken, user.rows[0].id]);

    const clientUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

    await emailService.sendPasswordResetEmail(email, resetLink);

    res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ message: 'Failed to send reset email.' });
  }
});

app.post('/api/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  // --- 1. PRIDANÁ VALIDÁCIA HESLA ---
  if (!newPassword || !PASSWORD_REGEX.test(newPassword)) {
    return res.status(400).json({
      message: 'Heslo musí mať min. 8 znakov, veľké a malé písmeno, číslo a špeciálny znak.'
    });
  }

  try {
    const user = await pool.query('SELECT * FROM users WHERE reset_token = $1', [token]);

    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    // Hashovanie nového (teraz už overeného) hesla
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL WHERE id = $2',
      [hashedPassword, user.rows[0].id]
    );

    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({ message: 'Failed to reset password.' });
  }
});

app.get('/api/verify-email', async (req, res) => {
  const { token } = req.query; // Frontend posiela ?token=xyz

  try {
    // 1. Hľadáme užívateľa podľa tokenu
    const result = await pool.query('SELECT * FROM users WHERE verification_token = $1', [token]);

    if (result.rows.length === 0) {
      // OPRAVA: Ak token nie je v DB, znamená to, že je neplatný alebo už bol použitý.
      return res.status(400).json({
        message: 'Tento overovací odkaz je neplatný alebo už bol použitý.'
      });
    }

    const user = result.rows[0];

    // 2. Nastavíme verified na true a ZMAŽEME token (aby sa nedal použiť znova)
    await pool.query('UPDATE users SET verified = true, verification_token = NULL WHERE id = $1', [user.id]);

    // 3. Úspech
    res.status(200).json({ message: 'Email bol úspešne overený. Teraz sa môžete prihlásiť.' });

  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ message: 'Nepodarilo sa overiť email.', error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const validPassword = await bcrypt.compare(password, user.password);
      
      if (validPassword) {
        if (!user.verified) {
          return res.status(403).json({ message: 'Please verify your email before logging in.' });
        }

        // --- NOVÁ LOGIKA PRE ROLU ---
        // Skontrolujeme, či je v .env zozname adminov
        let userRole = user.role; 
        if (user.role === 'admin') {
          userRole = 'admin';
        }

        // Uložíme do session (pre backend checky)
        req.session.userId = user.id;
        req.session.role = userRole; 

        console.log('Session after login:', req.session);

        // VRÁTIME ROLE FRONTENDU (aby React vedel zobraziť menu)
        res.json({ 
          message: 'Login successful', 
          userId: user.id, 
          userName: `${user.first_name} ${user.last_name}`,
          role: userRole // <--- TOTO JE KĽÚČOVÉ
        });

      } else {
        res.status(400).json({ message: 'Invalid password' });
      }
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Failed to login', error: error.message });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to logout', error: err.message });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Update user profile (address and mobile)
app.put('/api/users/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { address, mobile } = req.body;

  // Check if user is updating their own profile
  if (parseInt(id) !== req.session.userId) {
    return res.status(403).json({ error: 'Unauthorized to update this profile' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET address = $1, mobile = $2, updated_at = NOW() WHERE id = $3 RETURNING id, first_name, last_name, email, address, mobile',
      [address, mobile, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      const user = result.rows[0];

// Check DB role
        let userRole = user.role;
        if (userRole !== 'admin') {
          // Role not admin from DB, stay as is
      }

      // Vrátime dáta, ale prepíšeme rolu tou správnou
      res.json({
        ...user,
        role: userRole
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Failed to fetch user data', error: error.message });
  }
});

app.get('/api/check-availability', async (req, res) => {
  try {
    const { trainingId, trainingType, selectedDate, selectedTime, childrenCount } = req.query;

    let trainingResult;

    if (trainingId) {
      // NAJLEPŠIE RIEŠENIE: Hľadáme priamo podľa unikátneho ID
      trainingResult = await pool.query(
        `SELECT id, max_participants FROM training_availability WHERE id = $1`,
        [trainingId]
      );
    } else {
      // FALLBACK: Ak ID chýba, použijeme UTC timestamp
      // Resolve training_type name to training_type_id
      const typeIdResult = await pool.query(
        `SELECT id FROM training_types WHERE name = $1`,
        [trainingType]
      );
      if (typeIdResult.rows.length === 0) {
        return res.status(404).json({ error: `Training type '${trainingType}' not found` });
      }
      const trainingTypeId = typeIdResult.rows[0].id;
      
      const time24 = to24Hour(selectedTime);
      const trainingDateTimeUtc = toUtcDateTime(selectedDate, time24);
      trainingResult = await pool.query(
        `SELECT id, max_participants FROM training_availability
         WHERE training_type_id = $1 
         AND training_date = $2`,
        [trainingTypeId, trainingDateTimeUtc]
      );
    }

    if (trainingResult.rows.length === 0) {
      return res.json({
        available: false,
        reason: 'Session not found',
        remainingSpots: 0
      });
    }

    const training = trainingResult.rows[0];
    const bookingsResult = await pool.query(
      `SELECT COALESCE(SUM(number_of_children), 0) AS booked_children
       FROM bookings WHERE training_id = $1 AND active = true`,
      [training.id]
    );

    const bookedChildren = parseInt(bookingsResult.rows[0].booked_children, 10);
    const requestedChildren = parseInt(childrenCount, 10);
    const remainingSpots = training.max_participants - bookedChildren;

    res.json({
      available: remainingSpots >= requestedChildren,
      remainingSpots,
      maxParticipants: training.max_participants,
      bookedChildren,
      requestedChildren,
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

app.post('/api/verify-password', isAuthenticated, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.session.userId;

    const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect password' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Password verification error:', error);
    res.status(500).json({ error: 'Failed to verify password' });
  }
});

app.get('/api/bookings/user/:userId', isAuthenticated, async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await pool.query(`
      SELECT 
        b.id AS booking_id, 
        b.credit_id,           -- ✅ Pridané pre starší kód
        b.booking_type,        -- ✅ TOTO JE KĽÚČOVÉ - musí sa vrátiť
        b.amount_paid,         -- ✅ Pre rozlíšenie paid
        t.training_type, 
        t.training_date,
        t.cancelled,
        b.active
      FROM bookings b
      JOIN training_availability t ON b.training_id = t.id
      WHERE b.user_id = $1 AND b.active = true
      ORDER BY t.training_date ASC
    `, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.get('/api/bookings/:bookingId/type', isAuthenticated, async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const userId = req.session.userId;

    const client = await pool.connect();
    try {
      // Verify booking exists and belongs to the user
      const bookingResult = await client.query(
        'SELECT id, payment_intent_id, amount_paid, credit_id FROM bookings WHERE id = $1 AND user_id = $2',
        [bookingId, userId]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ error: 'Booking not found or unauthorized' });
      }

      const booking = bookingResult.rows[0];

      // Check if booking is associated with a season ticket
      const usageResult = await client.query(
        'SELECT season_ticket_id FROM season_ticket_usage WHERE booking_id = $1',
        [bookingId]
      );

      if (usageResult.rows.length > 0) {
        return res.json({ bookingType: 'season_ticket' });
      }

      // Check if booking is a credit-based booking
      if (booking.credit_id || booking.booking_type === 'credit') {
        return res.json({ bookingType: 'credit' });
      }

      // Check if booking is a paid booking
      if (booking.payment_intent_id || (booking.amount_paid && booking.amount_paid > 0)) {
        return res.json({ bookingType: 'paid' });
      }

      // Fallback if type could not be determined
      return res.status(400).json({ error: 'Booking type could not be determined' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[DEBUG] Error checking booking type:', error.message);
    res.status(500).json({ error: 'Failed to check booking type: ' + error.message });
  }
});

app.get('/api/credits/:userId', isAuthenticated, async (req, res) => {
  try {
    const userId = req.params.userId;
    const credits = await pool.query(`
      SELECT 
        id, 
        training_type, 
        original_date, 
        child_count, 
        accompanying_person, 
        children_ages,
        photo_consent,
        mobile,
        note,
        status
      FROM credits
      WHERE user_id = $1 AND status = 'active'
      ORDER BY created_at DESC
    `, [userId]);
    res.json(credits.rows);
  } catch (err) {
    console.error('Error fetching credits:', err);
    res.status(500).json({ error: 'Failed to fetch credits' });
  }
});

app.post('/api/replace-booking/:bookingId', isAuthenticated, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { bookingId } = req.params;
    const { newTrainingId } = req.body;

    // 1. Check that booking belongs to logged-in user
    const bookingResult = await client.query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, req.session.userId]
    );
    if (bookingResult.rows.length === 0) {
      throw new Error('Booking not found or unauthorized');
    }
    const booking = bookingResult.rows[0];

    // 2. Check capacity in new session
    const availabilityResult = await client.query(
      `SELECT ta.id, ta.max_participants, COALESCE(SUM(b.number_of_children),0) AS booked
       FROM training_availability ta
       LEFT JOIN bookings b ON ta.id = b.training_id
       WHERE ta.id = $1
       GROUP BY ta.id`,
      [newTrainingId]
    );
    if (availabilityResult.rows.length === 0) {
      throw new Error('New training session not found');
    }
    const availability = availabilityResult.rows[0];
    if (availability.booked + booking.number_of_children > availability.max_participants) {
      throw new Error('Not enough spots in the new session');
    }

    // 3. Update booking to point to new training_id
    await client.query(
      'UPDATE bookings SET training_id = $1 WHERE id = $2',
      [newTrainingId, bookingId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Booking replaced successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Replace booking error:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});


app.get('/api/replacement-sessions/:bookingId', isAuthenticated, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.session.userId;

    // Get the current booking details
    const bookingResult = await pool.query(
      `SELECT b.*, ta.training_type, ta.training_date, ta.max_participants 
       FROM bookings b 
       JOIN training_availability ta ON b.training_id = ta.id 
       WHERE b.id = $1 AND b.user_id = $2`,
      [bookingId, userId]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];
    const currentDate = new Date();

    // Find available sessions of the same type in the future (excluding the current booking's session)
    // Get training_type_id from training_type name
    const typeIdResult = await pool.query(
      `SELECT id FROM training_types WHERE name = $1`,
      [booking.training_type]
    );
    const trainingTypeId = typeIdResult.rows.length > 0 ? typeIdResult.rows[0].id : null;

    const replacementSessions = await pool.query(
      `SELECT ta.id, ta.training_type, ta.training_date, ta.max_participants,
              (ta.max_participants - COALESCE(SUM(b.number_of_children), 0)) as available_spots
       FROM training_availability ta
       LEFT JOIN bookings b ON ta.id = b.training_id
       WHERE ta.training_type_id = $1 
         AND ta.training_date > $2
         AND ta.id != $3
         AND ta.training_date > NOW()
       GROUP BY ta.id
       HAVING (ta.max_participants - COALESCE(SUM(b.number_of_children), 0)) >= $4
       ORDER BY ta.training_date ASC`,
      [trainingTypeId, currentDate, booking.training_id, booking.number_of_children]
    );

    res.json(replacementSessions.rows);
  } catch (error) {
    console.error('Error fetching replacement sessions:', error);
    res.status(500).json({ error: 'Failed to fetch replacement sessions' });
  }
});

// USER: Cancel Booking (Single) - UPDATED with credit option
app.delete('/api/bookings/:bookingId', isAuthenticated, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const bookingId = req.params.bookingId;
    const { requestCredit } = req.body; // NEW: Flag to request credit instead of refund

    // 1. Get complete booking info
    const bookingResult = await client.query(
      `SELECT b.id, b.user_id, b.training_id, b.number_of_children, b.session_id, 
              b.amount_paid, b.payment_time, b.payment_intent_id, b.credit_id, b.booking_type,
              b.children_ages, b.photo_consent, b.mobile, b.note, b.accompanying_person,
              ta.training_date, ta.training_type,
              u.email, u.first_name, u.last_name
       FROM bookings b 
       JOIN training_availability ta ON b.training_id = ta.id
       JOIN users u ON b.user_id = u.id 
       WHERE b.id = $1 AND b.user_id = $2`,
      [bookingId, req.session.userId]
    );

    if (bookingResult.rows.length === 0) {
      throw new Error('Booking not found or unauthorized');
    }

    const booking = bookingResult.rows[0];

    // Check 10-hour rule
    const trainingDateTime = new Date(booking.training_date);
    const currentTime = new Date();
    const timeDifference = trainingDateTime - currentTime;
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    if (hoursDifference <= 10) {
      throw new Error('Cancellation is not allowed within 10 hours of the session');
    }

    // Check season ticket usage
    const usageResult = await client.query(
      'SELECT season_ticket_id FROM season_ticket_usage WHERE booking_id = $1',
      [bookingId]
    );

    let refundData = null;

    // --- A. SEASON TICKET RETURN ---
    if (usageResult.rows.length > 0) {
      const seasonTicketId = usageResult.rows[0].season_ticket_id;
      console.log('[DEBUG] Reversing season ticket usage:', seasonTicketId);

      await client.query(
        'UPDATE season_tickets SET entries_remaining = entries_remaining + $1 WHERE id = $2',
        [booking.number_of_children, seasonTicketId]
      );
      await client.query('DELETE FROM season_ticket_usage WHERE booking_id = $1', [bookingId]);

      refundData = { type: 'season_ticket_returned' };

      // --- B. CREDIT RETURN ---
    } else if (booking.booking_type === 'credit' || booking.credit_id) {
      console.log('[DEBUG] Returning credit to user:', booking.user_id);

      if (booking.credit_id) {
        await client.query(
          "UPDATE credits SET status = 'active', used_at = NULL WHERE id = $1",
          [booking.credit_id]
        );
      }

      refundData = { type: 'credit_returned' };

      // --- C. PAID BOOKING: REFUND OR CREDIT ---
    } else {
      // NEW: Check if user requested credit instead of refund
      if (requestCredit) {
        console.log('[DEBUG] User requested CREDIT instead of refund for booking:', bookingId);

        // Create credit record
        await client.query(`
          INSERT INTO credits (
            user_id, session_id, child_count, accompanying_person, children_ages, 
            photo_consent, mobile, note, training_type, original_date, 
            reason, status, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'User requested credit on cancellation', 'active', NOW())
        `, [
          booking.user_id,
          booking.training_id,
          booking.number_of_children,
          booking.accompanying_person || false,
          booking.children_ages,
          booking.photo_consent,
          booking.mobile,
          booking.note,
          booking.training_type,
          booking.training_date
        ]);

        refundData = { type: 'credit_issued' };

      } else {
        // Original REFUND logic
        if (!booking.amount_paid || booking.amount_paid <= 0) {
          refundData = { error: 'No payment associated with this booking' };
        } else if (!booking.payment_intent_id) {
          refundData = { error: 'No payment intent found' };
        } else {
          try {
            const refund = await stripe.refunds.create({
              payment_intent: booking.payment_intent_id,
              amount: Math.round(booking.amount_paid * 100),
              reason: 'requested_by_customer',
              metadata: {
                booking_id: bookingId,
                user_id: booking.user_id,
              }
            });
            refundData = refund;

            await client.query(
              'INSERT INTO refunds (booking_id, refund_id, amount, status, reason, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
              [bookingId, refund.id, booking.amount_paid, refund.status, 'Cancellation by customer']
            );
          } catch (refundError) {
            console.error('[DEBUG] Stripe Refund error:', refundError.message);
            refundData = { error: 'Failed to process refund automatically.' };
          }
        }
      }
    }

    // 4. DELETE THE BOOKING (or mark inactive based on your logic)
    await client.query(
      'DELETE FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, req.session.userId]
    );

    await client.query('COMMIT');

    // 5. SEND EMAILS
    try {
      await emailService.sendCancellationEmails(
        'info@nitracik.sk',
        booking.email,
        booking,
        refundData,
        usageResult
      );
    } catch (emailError) {
      console.error('[DEBUG] Error sending cancellation emails:', emailError.message);
    }

    res.json({
      success: true,
      message: 'Booking canceled successfully',
      refundProcessed: !!refundData?.id || ['credit_returned', 'season_ticket_returned', 'credit_issued'].includes(refundData?.type),
      creditIssued: refundData?.type === 'credit_issued'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[DEBUG] Error canceling booking:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

//Permanently delete cancelled sessions by Admin
app.delete('/api/admin/training-sessions/:trainingId', isAdmin, async (req, res) => {
  const { trainingId } = req.params;
  const client = await pool.connect();

  console.log('[DEBUG] Archiving bookings and deleting session:', trainingId);

  try {
    await client.query('BEGIN');

    // 1. Overenie existencie a stavu cancelled
    const sessionCheck = await client.query(
      'SELECT id, training_type, training_date, cancelled FROM training_availability WHERE id = $1',
      [trainingId]
    );

    if (sessionCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Training session not found' });
    }

    const session = sessionCheck.rows[0];

    if (!session.cancelled) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Only cancelled sessions can be deleted from view' });
    }

    // VALIDÁCIA: Zistíme počet nevyriešených platieb kartou ('paid').
    // Hľadáme len tie, ktoré sú stále aktívne a nemajú vystavený refund.
    // Poznámka: Permanentky a kredity ignorujeme, pretože tie sa vrátili automaticky pri zrušení hodiny.
    const bookingsCheck = await client.query(`
      SELECT COUNT(*) as pending_count 
      FROM bookings b
      LEFT JOIN refunds r ON b.id = r.booking_id
      WHERE b.training_id = $1 
      AND b.booking_type = 'paid'   -- Riešime len platby kartou
      AND b.active = true           -- Ktoré ešte neboli zmenené na kredit (neaktívne)
      AND r.id IS NULL              -- A ešte nemajú vrátené peniaze (refund)
    `, [trainingId]);

    const pendingCount = parseInt(bookingsCheck.rows[0].pending_count);

    if (pendingCount > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Nemožno vymazať. Ešte existuje ${pendingCount} používateľov s platbou kartou, ktorí si nevybrali refund/kredit.`,
        message: 'Počkajte, kým si všetci používatelia s platbou kartou vyberú možnosť vrátenia.'
      });
    }

    // 3. ARCHIVÁCIA: Odpojíme bookings (nastavíme training_id na NULL)
    // Toto bezpečne odpojí aj vybavené platby kartou, aj permanentky/kredity
    await client.query(
      `UPDATE bookings 
       SET 
         training_id = NULL, 
         archived_training_date = $2, 
         archived_training_type = $3 
       WHERE training_id = $1`,
      [trainingId, session.training_date, session.training_type]
    );

    // 4. VYMAZANIE: Zmažeme tréning z kalendára
    const deleteResult = await client.query(
      'DELETE FROM training_availability WHERE id = $1 RETURNING *',
      [trainingId]
    );

    await client.query('COMMIT');

    console.log('[DEBUG] Session removed from view, bookings archived:', trainingId);
    res.json({
      success: true,
      message: 'Tréning bol vymazaný z kalendára. História rezervácií bola archivovaná.',
      deletedSession: deleteResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Archive and delete error:', error);
    res.status(500).json({ error: 'Failed to process: ' + error.message });
  } finally {
    client.release();
  }
});

// Add endpoint to get refund status
app.get('/api/refunds/:bookingId', isAuthenticated, async (req, res) => {
  try {
    const { bookingId } = req.params;

    const result = await pool.query(
      'SELECT * FROM refunds WHERE booking_id = $1 ORDER BY created_at DESC',
      [bookingId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching refunds:', error);
    res.status(500).json({ error: 'Failed to fetch refund information' });
  }
});


// ADMIN: Cancel Session (Email refund/credit options) - UPDATED to preserve bookings
app.post('/api/admin/cancel-session', isAdmin, async (req, res) => {
  const { trainingId, reason, forceCancel } = req.body;
  // const userId = req.session.userId; // Nepoužíva sa, ale nevadí

  console.log('[DEBUG] Admin cancel session request:', { trainingId, reason, forceCancel });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Získanie info o tréningu
    const trainingRes = await client.query(
      'SELECT training_date, training_type FROM training_availability WHERE id = $1',
      [trainingId]
    );

    if (trainingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Training session not found' });
    }

    const trainingInfo = trainingRes.rows[0];
    const trainingDateObj = new Date(trainingInfo.training_date);
    const trainingTypeStr = trainingInfo.training_type;

    // Kontrola 10 hodín
    const hoursDiff = (trainingDateObj - new Date()) / (1000 * 60 * 60);
    if (hoursDiff <= 10 && !forceCancel) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Session is within 10 hours. Use forceCancel=true to override.'
      });
    }

    // 2. Označenie session ako ZRUŠENÁ
    const updateResult = await client.query(
      'UPDATE training_availability SET cancelled = TRUE WHERE id = $1',
      [trainingId]
    );

    if (updateResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Failed to cancel training session' });
    }

    // 3. Získanie všetkých bookingov
    // Ťaháme aj training_type a date, aby sme ich mali pre emaily
    const bookingsRes = await client.query(`
      SELECT 
        b.id AS booking_id, 
        b.user_id, 
        b.amount_paid, 
        b.payment_intent_id,
        b.booking_type,
        b.number_of_children,
        b.credit_id,            -- Dôležité pre vrátenie kreditu
        stu.season_ticket_id,
        u.email, 
        u.first_name, 
        u.last_name,
        ta.training_type,
        ta.training_date
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN training_availability ta ON b.training_id = ta.id
      LEFT JOIN season_ticket_usage stu ON b.id = stu.booking_id
      WHERE b.training_id = $1
    `, [trainingId]);

    const bookings = bookingsRes.rows;
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

    // --- ZOZNAM EMAILOV NA ODOSLANIE (Queue) ---
    const emailQueue = [];

    // 4. Spracovanie bookingov (IBA DB OPERÁCIE)
    for (const booking of bookings) {

      // --- A: PERMANENTKA ---
      if (booking.booking_type === 'season_ticket' || booking.season_ticket_id) {
        if (booking.season_ticket_id) {
          // Vrátiť vstupy
          await client.query(
            'UPDATE season_tickets SET entries_remaining = entries_remaining + $1 WHERE id = $2',
            [booking.number_of_children, booking.season_ticket_id]
          );
          // Zmazať záznam o použití a booking
          await client.query('DELETE FROM season_ticket_usage WHERE booking_id = $1', [booking.booking_id]);
          await client.query('DELETE FROM bookings WHERE id = $1', [booking.booking_id]);

          // Pridať email do fronty
          emailQueue.push({
            type: 'season',
            email: booking.email,
            firstName: booking.first_name,
            trainingType: trainingTypeStr,
            dateObj: trainingDateObj,
            reason: reason
          });
        }

        // --- B: KREDIT (OPRAVENÁ LOGIKA) ---
      } else if (booking.booking_type === 'credit' || booking.credit_id) {
        if (booking.credit_id) {
          // !!! OPRAVA !!!
          // Namiesto pripočítavania sumy, len "ožívíme" existujúci kredit
          console.log(`[DEBUG] Reactivating credit ID: ${booking.credit_id}`);
          await client.query(
            "UPDATE credits SET status = 'active', used_at = NULL WHERE id = $1",
            [booking.credit_id]
          );
        }

        // Zmažeme booking, aby nevisel v systéme
        await client.query('DELETE FROM bookings WHERE id = $1', [booking.booking_id]);

        // Pridať email do fronty
        emailQueue.push({
          type: 'credit',
          email: booking.email,
          firstName: booking.first_name,
          trainingType: trainingTypeStr,
          dateObj: trainingDateObj,
          reason: reason
        });

        // --- C: PLATBA KARTOU (ŠTANDARD) ---
      } else {
        // Títo ostávajú, kým si nevyberú možnosť
        emailQueue.push({
          type: 'card',
          email: booking.email,
          booking: booking,
          reason: reason,
          frontendUrl: FRONTEND_URL
        });
      }
    }

    // 5. ULOŽENIE ZMIEN DO DB
    await client.query('COMMIT');
    console.log('[DEBUG] DB Transaction Committed. Sending emails now...');

    // 6. ODOSLANIE EMAILOV (Až teraz, keď je DB v poriadku)
    const emailPromises = emailQueue.map(task => {
      // Používame try-catch vnútri mapy, aby jeden zlyhaný email nezhodil ostatné
      // (alebo Promise.allSettled nižšie to rieši tiež)
      if (task.type === 'season') {
        return emailService.sendMassCancellationSeasonTicket(task.email, task.firstName, task.trainingType, task.dateObj, task.reason);
      } else if (task.type === 'credit') {
        return emailService.sendMassCancellationCredit(task.email, task.firstName, task.trainingType, task.dateObj, task.reason);
      } else if (task.type === 'card') {
        return emailService.sendMassCancellationEmail(task.email, task.booking, task.reason, task.frontendUrl);
      }
    });

    await Promise.allSettled(emailPromises);

    res.json({
      success: true,
      message: `Session cancelled. Processed ${bookings.length} bookings.`,
      canceledBookings: bookings.length
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cancel session error:', error);
    res.status(500).json({ error: 'Failed to cancel session: ' + error.message });
  } finally {
    client.release();
  }
});


app.get('/api/booking/refund', async (req, res) => {
  console.log("🔥 REFUND ENDPOINT CALLED", new Date().toISOString(), "bookingId:", req.query.bookingId);
  const { bookingId } = req.query;
  if (!bookingId) return res.status(400).json({ status: 'error', message: 'Missing bookingId.' });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [parseInt(bookingId, 10)]);

    const existingRefundRes = await client.query(
      'SELECT refund_id, status FROM refunds WHERE booking_id = $1',
      [bookingId]
    );

    if (existingRefundRes.rows.length > 0) {
      await client.query('COMMIT');
      return res.json({
        status: 'already',
        message: 'Your refund has already been processed',
        refundId: existingRefundRes.rows[0].refund_id,
      });
    }

    const bookingRes = await client.query(
      `SELECT 
        b.user_id,
        b.payment_intent_id,
        b.amount_paid,
        u.email AS user_email,
        u.first_name AS user_first_name,
        ta.training_type,
        ta.training_date
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN training_availability ta ON b.training_id = ta.id
      WHERE b.id = $1 AND b.active = true
      FOR UPDATE OF b`,
      [bookingId]
    );

    if (bookingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ status: 'error', message: 'Booking not active or not found.' });
    }

    const { user_id, payment_intent_id, amount_paid, user_email, user_first_name, training_type, training_date } = bookingRes.rows[0];

    const idempotencyKey = `refund-${bookingId}-${payment_intent_id}`;
    let refund;

    try {
      refund = await stripe.refunds.create({ payment_intent: payment_intent_id }, { idempotencyKey });
    } catch (stripeErr) {
      console.error('Stripe refund create error:', stripeErr);

      if (stripeErr.code === 'charge_already_refunded') {
        const dbFind = await client.query(
          'SELECT refund_id, status FROM refunds WHERE booking_id = $1',
          [bookingId]
        );

        if (dbFind.rows.length > 0) {
          await client.query('COMMIT');
          return res.json({
            status: 'already',
            message: 'Your refund has already been processed',
            refundId: dbFind.rows[0].refund_id,
          });
        }

        await client.query('ROLLBACK');
        return res.status(400).json({ status: 'error', message: 'Refund already refunded in Stripe but not in DB' });
      }

      await client.query('ROLLBACK');
      return res.status(500).json({ status: 'error', message: 'Stripe error' });
    }

    await client.query(
      'INSERT INTO refunds (booking_id, refund_id, amount, status, reason, created_at) VALUES ($1,$2,$3,$4,$5,NOW())',
      [bookingId, refund.id, amount_paid, refund.status, 'User selected refund']
    );

    await client.query('UPDATE bookings SET active = false WHERE id = $1 AND user_id = $2', [bookingId, user_id]);
    await client.query('COMMIT');

    if (user_email) {
      try {
        await emailService.sendRefundConfirmationEmail(user_email, {
          userName: user_first_name,
          refundId: refund.id,
          amount: amount_paid,
          trainingType: training_type,
          trainingDate: training_date
        });
      } catch (emailErr) {
        console.error('Refund confirmation email error:', emailErr.message);
      }
    }

    return res.json({
      status: 'processed',
      message: 'Refund Processed Successfully!',
      refundId: refund.id,
    });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (e) { console.error('Rollback failed', e); }
    console.error('Refund endpoint unexpected error:', err);
    return res.status(500).json({ status: 'error', message: 'Refund failed' });
  } finally {
    client.release();
  }
});



// Alternative credit processing endpoint that doesn't depend on training_availability
app.get('/api/booking/credit', async (req, res) => {
  const { bookingId } = req.query;
  if (!bookingId) return res.status(400).json({ message: 'Missing bookingId.' });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Získanie informácií o rezervácii
    const bookingRes = await client.query(`
      SELECT 
        b.user_id, 
        b.training_id, 
        b.number_of_children, 
        b.children_ages,
        b.photo_consent, 
        b.mobile, 
        b.note,
        b.accompanying_person,
        ta.training_type,
        ta.training_date
      FROM bookings b
      LEFT JOIN training_availability ta ON b.training_id = ta.id
      WHERE b.id = $1 AND b.active = true
    `, [bookingId]);

    let actionStatus = ''; // 'processed' alebo 'already'
    let creditIdReturn = null;

    // ✅ CASE 1: Existuje aktívna rezervácia
    if (bookingRes.rows.length > 0) {
      const b = bookingRes.rows[0];

      // Check, či už kredit náhodou neexistuje
      const existingCredit = await client.query(
        `SELECT id FROM credits WHERE user_id = $1 AND session_id = $2`,
        [b.user_id, b.training_id]
      );

      if (existingCredit.rows.length === 0) {
        // Vytvoríme nový kredit
        const insertRes = await client.query(`
          INSERT INTO credits (
            user_id, session_id, child_count, accompanying_person, children_ages, photo_consent,
            mobile, note, training_type, original_date, reason, status, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'User selected credit', 'active', NOW())
          RETURNING id
        `, [
          b.user_id,
          b.training_id,
          b.number_of_children,
          b.accompanying_person || false,
          b.children_ages,
          b.photo_consent,
          b.mobile,
          b.note,
          b.training_type || 'UNKNOWN',
          b.training_date || new Date()
        ]);

        creditIdReturn = insertRes.rows[0].id;

        // Deaktivujeme booking
        await client.query(
          'UPDATE bookings SET active = false WHERE id = $1 AND user_id = $2',
          [bookingId, b.user_id]
        );

        actionStatus = 'processed';
      } else {
        // Kredit už existuje, len vrátime info
        creditIdReturn = existingCredit.rows[0].id;
        actionStatus = 'already';
      }
    } else {
      // Tu by sme mohli riešiť, ak booking neexistuje alebo už nie je active (napr. bol už refundovaný)
      // Pre jednoduchosť predpokladáme, že ak nie je active, možno už bol spracovaný skôr.
      // Skontrolujeme, či existuje kredit pre tento bookingId (ak by sme mali priamy link, ale tu joinujeme cez user/session)
      // Ak sa nenájde booking, vrátime chybu alebo 'already' ak nájdeme kredit inou cestou.
      // Pre bezpečnosť teraz vrátime error, ak sa nenájde active booking:
      await client.query('ROLLBACK');
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found or already processed/cancelled.'
      });
    }

    await client.query('COMMIT');

    // ✅ ODPOVEĎ PRE FRONTEND (JSON, nie HTML)
    if (actionStatus === 'processed') {
      return res.json({
        status: 'processed',
        message: 'Credit added successfully',
        creditId: creditIdReturn
      });
    } else if (actionStatus === 'already') {
      return res.json({
        status: 'already',
        message: 'Credit already exists',
        creditId: creditIdReturn
      });
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Credit error:', err);
    // Vrátime JSON error, aby to frontend zachytil a zobrazil červenú ikonku
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error during credit creation.'
    });
  } finally {
    client.release();
  }
});

// Endpoint to use credit for new booking
app.post('/api/bookings/use-credit', async (req, res) => {
  const { creditId, trainingId, childrenAges, photoConsent, mobile, note, accompanyingPerson } = req.body;
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch the credit
    const creditResult = await client.query(
      `SELECT * FROM credits WHERE id = $1 AND user_id = $2 AND status = 'active'`,
      [creditId, userId]
    );

    if (creditResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Credit not found or not usable' });
    }

    const credit = creditResult.rows[0];
    const originalSessionId = credit.session_id;

    // 2. Verify NEW training availability
    const trainingResult = await client.query(
      `SELECT id, training_date, training_type, max_participants 
       FROM training_availability WHERE id = $1`,
      [trainingId]
    );

    if (trainingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Training session not found' });
    }
    const training = trainingResult.rows[0];

    // 3. Check participant count
    const currentBookings = await client.query(
      `SELECT COALESCE(SUM(number_of_children), 0) as total 
       FROM bookings WHERE training_id = $1`,
      [trainingId]
    );
    const totalParticipants = parseInt(currentBookings.rows[0].total) + credit.child_count;
    if (totalParticipants > training.max_participants) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Training session is full' });
    }

    // 4. Deactivate original paid booking if exists (keep type as 'paid')
    if (originalSessionId) {
      await client.query(
        'UPDATE bookings SET active = false WHERE user_id = $1 AND training_id = $2 AND booking_type = $3',
        [userId, originalSessionId, 'paid']
      );
    }

    // 5. Prepare data
    const finalChildrenAges = childrenAges || credit.children_ages || '';
    const rawConsent = photoConsent !== undefined ? photoConsent : credit.photo_consent;
    const finalPhotoConsent = (rawConsent === true || rawConsent === 'true');
    const finalMobile = mobile || credit.mobile || '';
    const finalNote = note || credit.note || '';
    const finalAccompanyingPerson = accompanyingPerson !== undefined ? accompanyingPerson : (credit.accompanying_person || false);

    // 6. Insert new booking
    const bookingResult = await client.query(
      `INSERT INTO bookings (
        user_id, training_id, number_of_children, children_ages, 
        photo_consent, mobile, note, accompanying_person, 
        amount_paid, payment_intent_id, payment_time, credit_id, 
        session_id, booked_at, booking_type, active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, null, null, $9, null, NOW(), 'credit', true)
      RETURNING id`,
      [
        credit.user_id,
        trainingId,
        credit.child_count,
        finalChildrenAges,
        finalPhotoConsent,
        finalMobile,
        finalNote,
        finalAccompanyingPerson,
        creditId
      ]
    );

    const bookingId = bookingResult.rows[0].id;

    // 7. Mark credit as used
    await client.query(
      `UPDATE credits SET status = 'used', used_at = NOW() WHERE id = $1`,
      [creditId]
    );

    // Získame User info pre email
    const userResult = await client.query('SELECT first_name, last_name, email FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    // --- COMMIT TRANSAKCIE ---
    await client.query('COMMIT');
    // Teraz je booking reálne v DB a getAttendeesList ho uvidí

    // --- ODOSLANIE EMAILOV (Až po commite) ---
    try {
      // 1. User Email
      await emailService.sendUserBookingEmail(user.email, {
        date: training.training_date,
        start_time: dayjs(training.training_date).format('HH:mm'), // Alebo ak máš selectedTime v body
        trainingType: training.training_type,
        userName: user.first_name,
        paymentType: 'credit'
      });

      // 2. Admin Email
      await emailService.sendAdminCreditUsage('info@nitracik.sk', {
        user,
        training,
        credit,
        finalChildrenAges,
        finalMobile,
        finalPhotoConsent: finalPhotoConsent, // Pozor na názov premennej v emailService
        finalNote,
        bookingId,
        creditId,
        originalSessionId,
        trainingId: training.id // <--- TOTO JE KĽÚČOVÉ PRE TABUĽKU
      });

      console.log('[DEBUG] Credit confirmation emails sent.');
    } catch (emailError) {
      console.error('[DEBUG] Error sending confirmation emails:', emailError.message);
      // Nezastavujeme response, lebo booking už prebehol
    }

    res.json({
      success: true,
      message: 'Booking created successfully using credit',
      bookingId: bookingId
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[DEBUG] Error using credit:', error.message);
    res.status(500).json({ error: 'Error using credit: ' + error.message });
  } finally {
    client.release();
  }
});

// New endpoint to get session ID from type, date, time
app.get('/api/get-session-id', async (req, res) => {
  const { training_type, date, time } = req.query;
  try {
    // Resolve training_type name to training_type_id
    const typeIdResult = await pool.query(
      `SELECT id FROM training_types WHERE name = $1`,
      [training_type]
    );
    if (typeIdResult.rows.length === 0) {
      return res.status(404).json({ error: `Training type '${training_type}' not found` });
    }
    const trainingTypeId = typeIdResult.rows[0].id;
    
    // Parse time (e.g., '01:00 PM' -> '13:00:00')
    const time24 = to24Hour(time);
    const trainingDateTimeUtc = toUtcDateTime(date, time24);

    const result = await pool.query(
      'SELECT id FROM training_availability WHERE training_type_id = $1 AND training_date = $2',
      [trainingTypeId, trainingDateTimeUtc]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ id: result.rows[0].id });
  } catch (error) {
    console.error('Error getting session ID:', error);
    res.status(500).json({ error: 'Failed to get session ID' });
  }
});

// --- FAQ ENDPOINTS ---

// 1. GET všetkých FAQ (Verejné - vidí každý)
app.get('/api/faqs', async (req, res) => {
  try {
    // Zoradíme podľa display_order, aby si mohol meniť poradie (ak by si to v budúcnosti implementoval)
    const result = await pool.query('SELECT * FROM faqs ORDER BY display_order ASC, id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// 2. POST nový FAQ (Iba Admin)
app.post('/api/admin/faqs', isAdmin, async (req, res) => {
  const { question, answer } = req.body;
  try {
    // Zistíme max order, aby sme novú otázku dali na koniec
    const orderRes = await pool.query('SELECT MAX(display_order) as max_order FROM faqs');
    const newOrder = (orderRes.rows[0].max_order || 0) + 1;

    const result = await pool.query(
      'INSERT INTO faqs (question, answer, display_order) VALUES ($1, $2, $3) RETURNING *',
      [question, answer, newOrder]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

// 3. PUT upraviť FAQ (Iba Admin)
app.put('/api/admin/faqs/:id', isAdmin, async (req, res) => {
  const { id } = req.params;
  const { question, answer } = req.body;
  try {
    const result = await pool.query(
      'UPDATE faqs SET question = $1, answer = $2 WHERE id = $3 RETURNING *',
      [question, answer, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

// 4. DELETE zmazať FAQ (Iba Admin)
app.delete('/api/admin/faqs/:id', isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM faqs WHERE id = $1', [id]);
    res.json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

// --- ABOUT CONTENT ENDPOINTS ---

app.get('/api/about-content', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM about_content WHERE id = 1');
    if (result.rows.length === 0) {
      // Vrátiť predvolený obsah, ak neexistuje
      return res.json({
        title: 'O nás',
        description: 'Vitajte v Nitráčiku! Sme lokalný projekt zameraný na kreatívny rozvoj detí. Naša misia je vytvárať priestor, kde sa deti môžu slobodne vyjadrovať, objavovať a učiť sa prostredníctvom hry a kreativity.',
        description2: 'Ponúkame rôzne programy a workshopy navrhnuté tak, aby podporovali motorické zručnosti, sociálnu interakciu a tvorivé myslenie u detí všetkých vekových kategórií.'
      });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching about content:', error);
    res.status(500).json({ error: 'Failed to fetch about content' });
  }
});

app.post('/api/admin/about-content', isAdmin, async (req, res) => {
  try {
    const { title, description, description2 } = req.body;
    const result = await pool.query(
      `INSERT INTO about_content (id, title, description, description2, updated_at)
       VALUES (1, $1, $2, $3, NOW())
       ON CONFLICT (id) 
       DO UPDATE SET 
         title = EXCLUDED.title, 
         description = EXCLUDED.description, 
         description2 = EXCLUDED.description2,
         updated_at = NOW()
       RETURNING *`,
      [title, description, description2]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving about content:', error);
    res.status(500).json({ error: 'Failed to save about content' });
  }
});

// --- BLOG ENDPOINTS ---

app.get('/api/blog-posts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        bp.id, 
        bp.title, 
        bp.slug, 
        bp.perex, 
        bp.content, 
        bp.image_url, 
        bp.label_id,
        bp.created_at, 
        bp.updated_at,
        bl.name as label_name,
        bl.color as label_color
      FROM blog_posts bp
      LEFT JOIN blog_labels bl ON bp.label_id = bl.id
      ORDER BY bp.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

app.post('/api/admin/blog-posts', isAdmin, async (req, res) => {
  try {
    const { title, perex, content, image_url, label_id } = req.body;
    
    let slug = createSlug(title);
    
    const check = await pool.query('SELECT id FROM blog_posts WHERE slug = $1', [slug]);
    if (check.rows.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }

    const result = await pool.query(
      `INSERT INTO blog_posts (title, slug, perex, content, image_url, label_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [title, slug, perex, content || null, image_url || null, label_id || null]
    );
    
    console.log(`✅ Blog post created: ${title} with label_id: ${label_id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

app.put('/api/admin/blog-posts/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, perex, content, image_url, label_id } = req.body;
    
    const slug = createSlug(title);

    const result = await pool.query(
      `UPDATE blog_posts 
       SET title = $1, slug = $2, perex = $3, content = $4, image_url = $5, label_id = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [title, slug, perex, content || null, image_url || null, label_id || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    console.log(`✅ Blog post updated: ${title} with label_id: ${label_id}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});


app.delete('/api/admin/blog-posts/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM blog_posts WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

// GET ONE POST BY ID OR SLUG
app.get('/api/blog-posts/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    
    console.log(`🔍 Hľadám článok podľa: "${idOrSlug}"`);

    let query;
    let params;

    const isId = /^\d+$/.test(idOrSlug);

    if (isId) {
       console.log('👉 Detekované ako ID (číslo)');
       query = `
         SELECT 
           bp.*, 
           bl.name as label_name,
           bl.color as label_color
         FROM blog_posts bp
         LEFT JOIN blog_labels bl ON bp.label_id = bl.id
         WHERE bp.id = $1
       `;
       params = [parseInt(idOrSlug)];
    } else {
       console.log('👉 Detekované ako SLUG (text)');
       query = `
         SELECT 
           bp.*,
           bl.name as label_name,
           bl.color as label_color
         FROM blog_posts bp
         LEFT JOIN blog_labels bl ON bp.label_id = bl.id
         WHERE bp.slug = $1
       `;
       params = [idOrSlug];
    }

    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      console.log('❌ Článok nebol nájdený v DB');
      return res.status(404).json({ error: 'Post not found' });
    }
    
    console.log(`✅ Článok nájdený: ${result.rows[0].title}`);
    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

// ENDPOINT PRE UPLOAD OBRÁZKA
app.post('/api/admin/upload-blog-image', isAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Žiadny súbor nebol nahraný' });
    }

    console.log(`📤 Prijatý obrázok: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)} KB)`);

    // Spracuj obrázok pomocou Sharp
    const processedImage = await processImage(req.file.buffer, req.file.originalname);

    // URL obrázka, ktorý bude prístupný cez web
    const imageUrl = `/uploads/blog/${processedImage.filename}`;

    console.log(`✅ Upload dokončený: ${imageUrl}`);

    res.json({
      success: true,
      imageUrl: imageUrl,
      filename: processedImage.filename,
      originalSize: req.file.size,
      processedSize: processedImage.size,
      compression: ((1 - processedImage.size / req.file.size) * 100).toFixed(2) + '%'
    });
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    res.status(500).json({ error: 'Nepodarilo sa nahrať obrázok' });
  }
});

app.delete('/api/admin/delete-blog-image', isAdmin, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Chýba URL obrázka' });
    }

    const filename = path.basename(imageUrl);
    const filePath = path.join(uploadDir, filename);
    
    // ✅ Zmaž aj thumbnail
    const thumbFilename = filename.replace('.webp', '-thumb.webp');
    const thumbPath = path.join(uploadDir, thumbFilename);
    
    let deletedFiles = [];
    
    // Zmaž hlavný obrázok
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      deletedFiles.push(filename);
      console.log(`🗑️ Obrázok zmazaný: ${filename}`);
    }
    
    // ✅ Zmaž thumbnail ak existuje
    if (fs.existsSync(thumbPath)) {
      fs.unlinkSync(thumbPath);
      deletedFiles.push(thumbFilename);
      console.log(`🗑️ Thumbnail zmazaný: ${thumbFilename}`);
    }
    
    if (deletedFiles.length > 0) {
      res.json({ 
        success: true, 
        message: 'Obrázok bol zmazaný',
        deletedFiles: deletedFiles
      });
    } else {
      res.status(404).json({ error: 'Obrázok nebol nájdený' });
    }
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    res.status(500).json({ error: 'Nepodarilo sa zmazať obrázok' });
  }
});

// ============================================
// BLOG LABELS ENDPOINTS
// ============================================

// GET ALL LABELS
app.get('/api/blog-labels', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, color, created_at
      FROM blog_labels 
      ORDER BY name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching blog labels:', error);
    res.status(500).json({ error: 'Failed to fetch blog labels' });
  }
});

// GET ONE LABEL BY ID
app.get('/api/blog-labels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, name, color, created_at FROM blog_labels WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Label not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching blog label:', error);
    res.status(500).json({ error: 'Failed to fetch blog label' });
  }
});

// CREATE NEW LABEL (ADMIN ONLY)
app.post('/api/admin/blog-labels', isAdmin, async (req, res) => {
  try {
    const { name, color } = req.body;
    
    if (!name || !color) {
      return res.status(400).json({ error: 'Name and color are required' });
    }

    // Check if label with same name already exists
    const checkExisting = await pool.query(
      'SELECT id FROM blog_labels WHERE LOWER(name) = LOWER($1)',
      [name]
    );

    if (checkExisting.rows.length > 0) {
      return res.status(400).json({ error: 'Label with this name already exists' });
    }

    const result = await pool.query(
      `INSERT INTO blog_labels (name, color, created_at)
       VALUES ($1, $2, NOW())
       RETURNING *`,
      [name.trim(), color]
    );
    
    console.log(`✅ Label created: ${name} (${color})`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating blog label:', error);
    res.status(500).json({ error: 'Failed to create blog label' });
  }
});

// UPDATE LABEL (ADMIN ONLY)
app.put('/api/admin/blog-labels/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    if (!name || !color) {
      return res.status(400).json({ error: 'Name and color are required' });
    }

    // Check if another label with same name exists
    const checkExisting = await pool.query(
      'SELECT id FROM blog_labels WHERE LOWER(name) = LOWER($1) AND id != $2',
      [name, id]
    );

    if (checkExisting.rows.length > 0) {
      return res.status(400).json({ error: 'Label with this name already exists' });
    }

    const result = await pool.query(
      `UPDATE blog_labels 
       SET name = $1, color = $2
       WHERE id = $3
       RETURNING *`,
      [name.trim(), color, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Label not found' });
    }
    
    console.log(`✅ Label updated: ${name} (${color})`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating blog label:', error);
    res.status(500).json({ error: 'Failed to update blog label' });
  }
});

// DELETE LABEL (ADMIN ONLY)
app.delete('/api/admin/blog-labels/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, remove label_id from all posts that use this label
    await pool.query(
      'UPDATE blog_posts SET label_id = NULL WHERE label_id = $1',
      [id]
    );
    
    // Then delete the label
    const result = await pool.query(
      'DELETE FROM blog_labels WHERE id = $1 RETURNING id, name',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Label not found' });
    }
    
    console.log(`🗑️ Label deleted: ${result.rows[0].name}`);
    res.json({ 
      message: 'Label deleted successfully',
      deletedLabel: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting blog label:', error);
    res.status(500).json({ error: 'Failed to delete blog label' });
  }
});


// --- GOOGLE RATINGS ENDPOINTS ---

// Simple in-memory cache for Google reviews
let googleReviewsCache = null;
let googleReviewsCacheTime = 0;
const GOOGLE_REVIEWS_TTL_MS = 60 * 60 * 1000; // 1h

app.get('/api/admin/google-ratings', isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT business_id, enabled FROM google_ratings_config WHERE id = 1');
    if (result.rows.length === 0) {
      return res.json({ businessId: '', enabled: false });
    }
    // Mapovanie snake_case z DB na camelCase pre frontend
    res.json({
      businessId: result.rows[0].business_id || '',
      enabled: result.rows[0].enabled || false
    });
  } catch (error) {
    console.error('Error fetching Google ratings config:', error);
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

app.post('/api/admin/google-ratings', isAdmin, async (req, res) => {
  try {
    const { businessId, enabled } = req.body;

    await pool.query(
      `INSERT INTO google_ratings_config (id, business_id, enabled, updated_at)
       VALUES (1, $1, $2, NOW())
       ON CONFLICT (id) 
       DO UPDATE SET 
         business_id = EXCLUDED.business_id,
         enabled = EXCLUDED.enabled,
         updated_at = NOW()`,
      [businessId, enabled]
    );

    res.json({ success: true, message: 'Configuration saved' });
  } catch (error) {
    console.error('Error saving Google ratings config:', error);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

// Public Google reviews endpoint
app.get('/api/reviews', async (req, res) => {
  try {
    const configRes = await pool.query('SELECT business_id, enabled FROM google_ratings_config WHERE id = 1');

    if (configRes.rows.length === 0) {
      return res.json({ reviews: [], enabled: false, businessId: '' });
    }

    const { business_id: businessId, enabled } = configRes.rows[0];
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      console.error('Missing GOOGLE_PLACES_API_KEY');
      return res.status(500).json({ enabled: false, reviews: [], businessId: businessId || '' });
    }

    if (!enabled || !businessId) {
      return res.json({ reviews: [], enabled: false, businessId: businessId || '' });
    }

    const now = Date.now();
    if (
      googleReviewsCache &&
      now - googleReviewsCacheTime < GOOGLE_REVIEWS_TTL_MS &&
      googleReviewsCache.businessId === businessId
    ) {
      return res.json(googleReviewsCache.data);
    }

    const googleRes = await axios.get(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(businessId)}`,
      {
        params: {
          languageCode: 'sk'
        },
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'displayName,rating,userRatingCount,reviews'
        }
      }
    );

    const result = googleRes.data || {};
    const reviews = (result.reviews || []).map((review) => ({
      author_name: review.authorAttribution?.displayName || 'Google User',
      profile_photo_url: review.authorAttribution?.photoUri || '',
      rating: review.rating || 0,
      text: review.text?.text || '',
      relative_time_description: review.relativePublishTimeDescription || ''
    }));

    const payload = {
      reviews,
      rating: result.rating ?? null,
      totalRatings: result.userRatingCount ?? null,
      businessName: result.displayName?.text ?? result.displayName ?? null,
      enabled: true,
      businessId: businessId || ''
    };

    googleReviewsCache = { data: payload, businessId };
    googleReviewsCacheTime = now;

    return res.json(payload);
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    const now = Date.now();
    if (googleReviewsCache && now - googleReviewsCacheTime < GOOGLE_REVIEWS_TTL_MS) {
      return res.json(googleReviewsCache.data);
    }
    return res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Send email to info@ (main inbox) with reply-to user email
    await emailService.sendContactFormEmails('info@nitracik.sk', {
      name, email, message
    });

    res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ message: 'Failed to send message. Please try again.' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const userIdToDelete = req.params.id;
  const currentUserId = req.session.userId;

  // Kontrola, či užívateľ maže vlastný účet
  if (!currentUserId || String(currentUserId) !== String(userIdToDelete)) {
    return res.status(403).json({ error: 'Forbidden: You can only delete your own account' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Začiatok transakcie

    // -------------------------------------------------------------
    // KROK 0: Získame info o užívateľovi (PREDTÝM ako ho zmažeme)
    // -------------------------------------------------------------
    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userIdToDelete]);

    let userInfo = null;
    let userNameForEmail = 'Kamarát'; // Defaultné oslovenie

    if (userResult.rows.length > 0) {
      userInfo = userResult.rows[0];
      userNameForEmail = userInfo.first_name || 'Kamarát';
    }

    // KROK 0.5: Skontrolujeme aktívne rezervácie, permanentky a kredity
    // Aktívne rezervácie - budúce tréningy, aktívne, bez kreditov
    const activeBookingsResult = await client.query(`
      SELECT 
        b.id,
        b.booked_at,
        b.number_of_children,
        b.accompanying_person,
        ta.training_type,
        ta.training_date,
        b.amount_paid
      FROM bookings b
      JOIN training_availability ta ON b.training_id = ta.id
      WHERE b.user_id = $1 
        AND b.active = true
        AND ta.training_date > NOW()
        AND b.booking_type = 'paid'
      ORDER BY ta.training_date ASC
    `, [userIdToDelete]);

    // Platné permanentky s nevyužitými vstupmi
    const activeSeasonTicketsResult = await client.query(`
      SELECT 
        st.id,
        st.purchase_date,
        st.expiry_date,
        st.entries_total,
        st.entries_remaining,
        st.amount_paid,
        tt.name as training_type_name
      FROM season_tickets st
      LEFT JOIN training_types tt ON st.training_type_id = tt.id
      WHERE st.user_id = $1 
        AND st.expiry_date > NOW()
        AND st.entries_remaining > 0
      ORDER BY st.expiry_date DESC
    `, [userIdToDelete]);

    // Nepoužité kredity (status 'active' alebo 'unused' - všetko čo nie je 'used')
    const unusedCreditsResult = await client.query(`
      SELECT 
        c.id,
        c.created_at,
        c.original_date,
        c.training_type,
        c.child_count,
        c.status,
        c.accompanying_person
      FROM credits c
      WHERE c.user_id = $1 
        AND c.status != 'used'
      ORDER BY c.created_at DESC
    `, [userIdToDelete]);

    const activeBookings = activeBookingsResult.rows;
    const activeSeasonTickets = activeSeasonTicketsResult.rows;
    const unusedCredits = unusedCreditsResult.rows;

    // KROK A: Zmažeme závislé dáta (rezervácie, permanentky, kredity)
    // DÔLEŽITÉ: Musíme mazať v správnom poradí kvôli Foreign Key vzťahom
    await client.query('DELETE FROM bookings WHERE user_id = $1', [userIdToDelete]);
    await client.query('DELETE FROM season_tickets WHERE user_id = $1', [userIdToDelete]);
    await client.query('DELETE FROM credits WHERE user_id = $1', [userIdToDelete]);

    // KROK B: Zmažeme samotného užívateľa
    const result = await client.query('DELETE FROM users WHERE id = $1', [userIdToDelete]);

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    await client.query('COMMIT'); // Potvrdenie transakcie - užívateľ je zmazaný

    // KROK C: Odošleme rozlúčkový email s informáciami o aktívnych subjektoch
    if (userInfo && userInfo.email) {
      console.log(`Sending delete email to: ${userInfo.email}`);
      emailService.sendAccountDeletedEmail(
        userInfo.email, 
        userNameForEmail,
        {
          activeBookings,
          activeSeasonTickets,
          unusedCredits,
          hasActiveItems: activeBookings.length > 0 || activeSeasonTickets.length > 0 || unusedCredits.length > 0
        }
      ).catch(err =>
        console.error('Failed to send delete confirmation email:', err)
      );
    }

    // KROK D: Odošleme notifikáciu adminovi
    if (userInfo) {
      emailService.sendAdminAccountDeleteNotification(userInfo, {
        activeBookings,
        activeSeasonTickets,
        unusedCredits,
        hasActiveItems: activeBookings.length > 0 || activeSeasonTickets.length > 0 || unusedCredits.length > 0
      }).catch(err =>
        console.error('Failed to send admin notification:', err)
      );
    }

    // KROK E: Zrušíme session a odhlásime ho
    req.session.destroy((err) => {
      if (err) console.error('Session destroy error:', err);
      res.json({ message: 'User account deleted successfully' });
    });

  } catch (error) {
    await client.query('ROLLBACK'); // V prípade chyby vrátime všetko späť
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  } finally {
    client.release();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

});