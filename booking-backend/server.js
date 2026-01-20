require('dotenv').config({ path: './cred.env' });
const emailService = require('./services/emailService');
console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);

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
require('dayjs/locale/sk');
dayjs.locale('sk');
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.,])[A-Za-z\d@$!%*?&.,]{8,}$/;

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

    try {
      await client.query('BEGIN');

      // === 1. SEASON TICKET (Permanentka) ===
      if (session.metadata.type === 'season_ticket') {
        const { userId, entries, totalPrice } = session.metadata;
        console.log(`Processing Season Ticket for User: ${userId}, Entries: ${entries}, Price: ${totalPrice}`);

        // Konverzia typov (Stripe posiela stringy)
        const entriesInt = parseInt(entries, 10);
        const priceFloat = parseFloat(totalPrice);

        // Bezpečnostná kontrola: sedia ceny s novým cenníkom?
        const validPrices = { 3: 40, 5: 65, 10: 120 };
        if (validPrices[entriesInt] !== priceFloat) {
          console.error(`[SECURITY] Price mismatch. Entries: ${entriesInt}, Paid: ${priceFloat}`);
          throw new Error('Payment amount verification failed');
        }

        // Exspirácia (1 rok od nákupu)
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 6); //6 mesiacov

        console.log('📝 [DEBUG] Attempting INSERT into DB...');

        // === INSERT DO DB (Vrátane amount_paid a payment_time) ===
        const ticketResult = await client.query(
          `INSERT INTO season_tickets (
              user_id, 
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
           VALUES ($1, $2, $2, NOW(), $3, $4, $5, $6, NOW(), NOW()) 
           RETURNING id`,
          [
            parseInt(userId, 10),            // $1: user_id
            entriesInt,                      // $2: entries_total (aj remaining)
            expiryDate,                      // $3: expiry_date
            session.id,                      // $4: stripe_payment_id
            priceFloat,                      // $5: amount_paid
            new Date(session.created * 1000) // $6: payment_time (zo Stripe timestampu)
          ]
        );

        console.log('[DEBUG] Season ticket created ID:', ticketResult.rows[0].id);

        // Odoslanie emailu užívateľovi
        const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];

        if (user) {
          console.log('📧 [DEBUG] Sending email to:', user.email);
          await emailService.sendSeasonTicketConfirmation(user.email, user.first_name, {
            entries: entriesInt,
            totalPrice: priceFloat,
            expiryDate
          });
          console.log('[DEBUG] Confirmation email sent to:', user.email);
        }

      } else if (session.metadata.type === 'training_session') {
        const {
          userId,
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

        if (!userId || !trainingType || !selectedDate || !selectedTime || !childrenCount || !totalPrice) {
          throw new Error('Missing required metadata fields');
        }

        const [time, modifier] = selectedTime.split(' ');
        let [hours, minutes] = time.split(':');
        if (modifier === 'PM' && hours !== '12') hours = parseInt(hours) + 12;
        if (modifier === 'AM' && hours === '12') hours = '00';
        const trainingDateTimeUTC = new Date(`${selectedDate}T${hours}:${minutes}`);
        const trainingDateTimeLocal = new Date(trainingDateTimeUTC.toLocaleString('en-US', { timeZone: 'Europe/Budapest' }));

        const trainingResult = await client.query(
          `SELECT * FROM training_availability WHERE training_type = $1 AND training_date = $2`,
          [trainingType, trainingDateTimeLocal]
        );
        if (trainingResult.rows.length === 0) {
          throw new Error('Training session no longer available');
        }

        const training = trainingResult.rows[0];
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

        // 1. ZÍSKANIE EMAILU A MENA
        // Email berieme primárne z účtu v DB, ak by tam nebol, záložne zo Stripe
        const targetEmail = user.email || session.customer_details?.email;
        // MENO berieme VŽDY z databázy (krstné meno), aby to bolo osobné
        const firstName = user.first_name || 'Osôbka';

        // 2. ODOSLANIE EMAILU
        try {
          await emailService.sendUserBookingEmail(targetEmail, {
            date: selectedDate,
            start_time: selectedTime,
            trainingType: trainingType,
            userName: firstName, // Tu posielame krstné meno z konta
            paymentType: 'payment'
          });
          console.log(`[DEBUG] Email odoslaný na meno: ${firstName} (${targetEmail})`);
        } catch (emailError) {
          console.error('[DEBUG] Chyba pri odosielaní užívateľského emailu:', emailError.message);
        }

        // 3. ODOSLANIE EMAILU ADMINOVI (pôvodný kód)
        await emailService.sendAdminNewBookingNotification(process.env.ADMIN_EMAIL, {
          user, mobile, childrenCount, childrenAge, trainingType, selectedDate, selectedTime, photoConsent, accompanyingPerson, note, totalPrice, paymentIntentId, trainingId: training.id
        });

        console.log('[DEBUG] Booking confirmation emails sent to admin and user');
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[DEBUG] Webhook processing error:', error.message);
    } finally {
      client.release();
    }
  }

  res.json({ received: true });
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

const isAdmin = async (req, res, next) => {
  try {
    // console.log('[DEBUG] Session userId:', req.session.userId);

    if (!req.session.userId) {
       return res.status(401).json({ error: 'Unauthorized' });
    }

    const userResult = await pool.query(
      'SELECT email, role FROM users WHERE id = $1',
      [req.session.userId]
    );
    
    // console.log('[DEBUG] User query result:', userResult.rows[0]);

    // --- ZMENA TU ---
    // Nekontrolujeme či sa email rovná tomu v .env, ale či má užívateľ v databáze rolu 'admin'
    const user = userResult.rows[0];

    if (user && user.role === 'admin') {
      next(); // Je to admin, pustíme ho ďalej
    } else {
      console.log('[DEBUG] Admin check failed. User role:', user?.role);
      res.status(403).json({ error: 'Admin privileges required' });
    }

  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Server error during admin check' });
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

    // 3. Vloženie - skontroluj si, či máš v DB stĺpce training_type_id, training_type, training_date, max_participants
    const result = await pool.query(
      `INSERT INTO training_availability 
       (training_type_id, training_type, training_date, max_participants)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [typeId, typeName, trainingDate, maxParticipants]
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
      WHERE ta.training_date >= NOW()
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
      `SELECT u.first_name, u.last_name, u.email, s.user_id, s.entries_total, s.entries_remaining, s.expiry_date 
       FROM season_tickets s 
       JOIN users u ON s.user_id = u.id
       WHERE s.entries_remaining > 0 AND s.expiry_date >= NOW()`
    );
    res.json(tickets.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch season tickets' });
  }
});


// Update /api/admin/payment-report endpoint
app.post('/api/admin/payment-report', isAuthenticated, async (req, res) => {
  // Check if user is admin
  const userEmail = req.session.email;
  if (userEmail !== process.env.ADMIN_EMAIL) {
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
    doc.fontSize(12).text(`Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`, { align: 'center' });
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
        const displayDate = p.payment_time ? new Date(p.payment_time).toLocaleString() : 'N/A';

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
      `SELECT id, entries_total, entries_remaining, purchase_date, expiry_date
       FROM season_tickets
       WHERE user_id = $1
       ORDER BY purchase_date DESC`,
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
    const { userId, entries, totalPrice } = req.body;
    if (!userId || !entries || !totalPrice) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const pricing = { 3: 40, 5: 65, 10: 120 };
    if (pricing[entries] !== totalPrice) {
      return res.status(400).json({ error: 'Price validation failed' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: `Season Ticket (${entries} Entries)` },
          unit_amount: totalPrice * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-canceled`,
      metadata: {
        userId,
        entries: entries.toString(),
        totalPrice: totalPrice.toString(),
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
      userId, seasonTicketId, trainingType, selectedDate, selectedTime,
      childrenCount, childrenAge, photoConsent, mobile, note, accompanyingPerson,
    } = req.body;

    if (!userId || !seasonTicketId || !trainingType || !selectedDate || !selectedTime || !childrenCount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const allowedTypes = ['MIDI', 'MAXI'];
    if (!allowedTypes.includes(trainingType)) {
      return res.status(400).json({ error: 'Season tickets are valid only for MIDI and MAXI training sessions.' });
    }

    // 1. Verify season ticket (Získame aj celkový počet a expiráciu)
    const ticketResult = await client.query(
      `SELECT entries_remaining, entries_total, expiry_date FROM season_tickets WHERE id = $1 AND user_id = $2`,
      [seasonTicketId, userId]
    );
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Season ticket not found' });
    }
    const ticket = ticketResult.rows[0]; // Tu máme entries_total aj expiry_date

    if (ticket.entries_remaining < childrenCount) {
      return res.status(400).json({ error: 'Not enough entries remaining in your season ticket' });
    }
    if (new Date(ticket.expiry_date) < new Date()) {
      return res.status(400).json({ error: 'Season ticket has expired' });
    }

    // Time parsing
    const [time, modifier] = selectedTime.split(' ');
    let [hours, minutes] = time.split(':');
    if (modifier === 'PM' && hours !== '12') hours = parseInt(hours) + 12;
    if (modifier === 'AM' && hours === '12') hours = '00';
    const trainingDateTime = new Date(`${selectedDate}T${hours}:${minutes}`);

    // Find training
    const trainingResult = await client.query(
      `SELECT id, max_participants, training_type, training_date FROM training_availability WHERE training_type = $1 AND training_date = $2`,
      [trainingType, trainingDateTime]
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
      `INSERT INTO bookings (user_id, training_id, number_of_children, amount_paid, payment_time, booked_at, active, booking_type)
       VALUES ($1, $2, $3, 0, NULL, NOW(), true, 'season_ticket') RETURNING id`,
      [userId, training.id, childrenCount]
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
      `INSERT INTO season_ticket_usage (season_ticket_id, booking_id, training_type, created_at, used_date)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [seasonTicketId, bookingId, trainingType]
    );

    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    await client.query('COMMIT');

    // --- EMAILY ---
    try {
      // 1. User Email (s detailmi o zostatku)
      await emailService.sendUserBookingEmail(user.email, {
        date: training.training_date, // Používame dátum z DB pre istotu
        start_time: selectedTime,
        trainingType: trainingType,
        userName: user.first_name,
        paymentType: 'season_ticket',
        // Data pre permanentku:
        usedEntries: childrenCount,
        remainingEntries: newBalance,
        totalEntries: ticket.entries_total, // <--- Pridané
        expiryDate: ticket.expiry_date      // <--- Pridané
      });

      // 2. Admin Email (s trainingId pre tabuľku)
      await emailService.sendAdminSeasonTicketUsage(process.env.ADMIN_EMAIL, {
        user,
        mobile,
        childrenCount,
        childrenAge,
        trainingType,
        selectedDate,
        selectedTime,
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

app.post('/api/set-training', isAdmin, async (req, res) => {
  try {
    // POZOR: Premenná sa musí volať rovnako ako kľúč v req.body z frontendu
    // Vo tvojom logu z prehliadača vidím, že posielaš "trainingType"
    const { trainingType, trainingDate, maxParticipants } = req.body;

    console.log('Received training data:', req.body);

    // 1. Overíme, či typ existuje (trainingType tu obsahuje ID vybrané v dropdown-e)
    const typeRes = await pool.query('SELECT name FROM training_types WHERE id = $1', [trainingType]);

    if (typeRes.rows.length === 0) {
      return res.status(404).json({ error: 'Training type not found in database' });
    }

    const typeName = typeRes.rows[0].name;

    // 2. Vložíme do tabuľky training_availability
    // Používame názvy stĺpcov, ktoré máš v DB (training_date / date - skontroluj si presný názov v DB)
    const result = await pool.query(
      `INSERT INTO training_availability 
       (training_type_id, training_type, training_date, max_participants)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [trainingType, typeName, trainingDate, maxParticipants]
    );

    console.log('Insert success:', result.rows[0]);
    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Set training error details:', error);
    res.status(500).json({
      error: 'Failed to set training date',
      details: error.message
    });
  }
});

// UPRAVENÉ: create-payment-session - Dynamický výpočet ceny
app.post('/api/create-payment-session', isAuthenticated, async (req, res) => {
  try {
    const {
      userId,
      trainingId,
      trainingType, // Stále posielame z FE, ale pre cenu použijeme DB
      selectedDate,
      selectedTime,
      childrenCount,
      childrenAge,
      // totalPrice, // <-- IGNORUJEME cenu z Frontendu kvoli bezpečnosti, vypočítame ju tu
      photoConsent,
      mobile,
      note,
      accompanyingPerson,
    } = req.body;

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
        throw new Error('Tréning alebo cena pre tento počet detí neexistuje.');
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
    'HCAPTCHA_SECRET' // <--- PRIDANÉ TU
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
    await emailService.sendTestEmail(process.env.ADMIN_EMAIL);
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
  // Pridali sme hCaptchaToken do destrukturalizácie
  const { firstName, lastName, email, password, address, _honey, hCaptchaToken } = req.body;

  // 1. HONEYPOT KONTROLA (už si mal)
  if (_honey) {
    console.log(`Bot detected via honeypot. IP: ${req.ip}`);
    return res.status(200).json({ message: 'Registrácia úspešná' }); // Fake success
  }

  // 2. HCAPTCHA OVERENIE (NOVÉ)
  if (!hCaptchaToken) {
    return res.status(400).json({ message: 'Prosím, potvrďte, že nie ste robot (Captcha).' });
  }

  try {
    const verificationUrl = 'https://api.hcaptcha.com/siteverify';
    const params = new URLSearchParams();
    params.append('secret', process.env.HCAPTCHA_SECRET);
    params.append('response', hCaptchaToken);

    const captchaResponse = await axios.post(verificationUrl, params);
    const captchaData = captchaResponse.data;

    if (!captchaData.success) {
      console.error('hCaptcha verification failed:', captchaData);
      return res.status(400).json({ message: 'Overenie Captcha zlyhalo. Skúste to znova.' });
    }
  } catch (error) {
    console.error('hCaptcha API error:', error);
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
        req.session.userId = user.id;
        console.log('Session after login:', req.session);
        res.json({ message: 'Login successful', userId: user.id, userName: `${user.first_name} ${user.last_name}` });
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
      res.json(result.rows[0]);
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
      // FALLBACK: Ak ID chýba, použijeme stringy (odolné voči timezone)
      const timePart = selectedTime ? selectedTime.split(' ')[0] : null;
      trainingResult = await pool.query(
        `SELECT id, max_participants FROM training_availability
         WHERE training_type = $1 
         AND to_char(training_date, 'YYYY-MM-DD') = $2 
         AND to_char(training_date, 'HH24:MI') = $3`,
        [trainingType, selectedDate, timePart]
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
    const replacementSessions = await pool.query(
      `SELECT ta.id, ta.training_type, ta.training_date, ta.max_participants,
              (ta.max_participants - COALESCE(SUM(b.number_of_children), 0)) as available_spots
       FROM training_availability ta
       LEFT JOIN bookings b ON ta.id = b.training_id
       WHERE ta.training_type = $1 
         AND ta.training_date > $2
         AND ta.id != $3
         AND ta.training_date > NOW()
       GROUP BY ta.id
       HAVING (ta.max_participants - COALESCE(SUM(b.number_of_children), 0)) >= $4
       ORDER BY ta.training_date ASC`,
      [booking.training_type, currentDate, booking.training_id, booking.number_of_children]
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
        process.env.ADMIN_EMAIL,
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
      'SELECT user_id, payment_intent_id, amount_paid FROM bookings WHERE id = $1 AND active = true FOR UPDATE',
      [bookingId]
    );

    if (bookingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ status: 'error', message: 'Booking not active or not found.' });
    }

    const { user_id, payment_intent_id, amount_paid } = bookingRes.rows[0];

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
  if (!bookingId) return res.status(400).send('Missing bookingId.');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Try to find the booking
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

    let firstTimeCredit = false;

    // ✅ CASE 1: Active booking exists → create new credit and deactivate booking
    if (bookingRes.rows.length > 0) {
      const b = bookingRes.rows[0];

      // Check if credit already exists for this user/session
      const existingCredit = await client.query(
        `SELECT id FROM credits WHERE user_id = $1 AND session_id = $2`,
        [b.user_id, b.training_id]
      );

      if (existingCredit.rows.length === 0) {
        // Create credit record
        await client.query(`
          INSERT INTO credits (
            user_id, session_id, child_count, accompanying_person, children_ages, photo_consent,
            mobile, note, training_type, original_date, reason, status, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'User selected credit', 'active', NOW())
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

        // ✅ NEW: Deactivate the booking but keep original booking_type
        await client.query(
          'UPDATE bookings SET active = false WHERE id = $1 AND user_id = $2',
          [bookingId, b.user_id]
        );

        firstTimeCredit = true;
      }
    }

    await client.query('COMMIT');

    // ✅ Success response (same as before)
    if (firstTimeCredit) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Credit Added Successfully</title>
            <meta http-equiv="refresh" content="4;url=${process.env.FRONTEND_URL}/booking" />
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
                .success-container { background: white; color: #333; padding: 40px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 500px; margin: 0 auto; }
                .success-icon { font-size: 60px; margin-bottom: 20px; }
                .countdown { margin-top: 20px; font-size: 14px; color: #666; }
            </style>
        </head>
        <body>
            <div class="success-container">
                <div class="success-icon">🎫</div>
                <h2>Credit Added Successfully!</h2>
                <p>Your credit has been added to your account and is ready to use.</p>
                <p>You'll be automatically redirected in <span id="countdown">4</span> seconds...</p>
                <div class="countdown">
                    <a href="${process.env.FRONTEND_URL}/booking" style="color: #667eea;">Click here if you are not redirected</a>
                </div>
            </div>
            <script>
                let seconds = 4;
                const el = document.getElementById('countdown');
                const timer = setInterval(() => {
                    seconds--; el.textContent = seconds;
                    if (seconds <= 0) clearInterval(timer);
                }, 1000);
            </script>
        </body>
        </html>
      `);
    }

    // ✅ Already processed response
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Credit Already Processed</title>
          <meta http-equiv="refresh" content="4;url=${process.env.FRONTEND_URL}/booking" />
          <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
              .success-container { background: white; color: #333; padding: 40px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 500px; margin: 0 auto; }
              .success-icon { font-size: 60px; margin-bottom: 20px; }
              .countdown { margin-top: 20px; font-size: 14px; color: #666; }
          </style>
      </head>
      <body>
          <div class="success-container">
              <div class="success-icon">✅</div>
              <h2>Credit Already Processed</h2>
              <p>Your credit was already added earlier and is ready to use.</p>
              <p>You'll be redirected in <span id="countdown">4</span> seconds...</p>
              <div class="countdown">
                  <a href="${process.env.FRONTEND_URL}/booking" style="color: #667eea;">Click here if you are not redirected</a>
              </div>
          </div>
          <script>
              let seconds = 4;
              const el = document.getElementById('countdown');
              const timer = setInterval(() => {
                  seconds--; el.textContent = seconds;
                  if (seconds <= 0) clearInterval(timer);
              }, 1000);
          </script>
      </body>
      </html>
    `);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Credit error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/error?reason=credit_failed`);
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
        await emailService.sendAdminCreditUsage(process.env.ADMIN_EMAIL, {
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
    // Parse time (e.g., '01:00 PM' -> '13:00:00')
    let [timePart, modifier] = time.split(' ');
    let [hours, minutes] = timePart.split(':');
    hours = parseInt(hours);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes}:00`;
    const timestamp = `${date} ${formattedTime}`;

    const result = await pool.query(
      'SELECT id FROM training_availability WHERE training_type = $1 AND training_date = $2',
      [training_type, timestamp]
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

    // Send email to admin
    await emailService.sendContactFormEmails(process.env.ADMIN_EMAIL, {
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
    // Používame SELECT * aby sme mali istotu, že trafíme existujúce stĺpce
    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userIdToDelete]);

    let userInfo = null;
    let userNameForEmail = 'Kamarát'; // Defaultné oslovenie

    if (userResult.rows.length > 0) {
      userInfo = userResult.rows[0];

      // TU BOLA CHYBA: Teraz už vieme, že stĺpec sa volá 'first_name'
      userNameForEmail = userInfo.first_name || 'Kamarát';
    }

    // KROK A: Zmažeme závislé dáta (rezervácie, permanentky)
    await client.query('DELETE FROM bookings WHERE user_id = $1', [userIdToDelete]);
    await client.query('DELETE FROM season_tickets WHERE user_id = $1', [userIdToDelete]);

    // KROK B: Zmažeme samotného užívateľa
    const result = await client.query('DELETE FROM users WHERE id = $1', [userIdToDelete]);

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    await client.query('COMMIT'); // Potvrdenie transakcie - užívateľ je zmazaný

    // KROK C: Odošleme rozlúčkový email (ak sme našli email)
    if (userInfo && userInfo.email) {
      console.log(`Sending delete email to: ${userInfo.email}`);
      emailService.sendAccountDeletedEmail(userInfo.email, userNameForEmail).catch(err =>
        console.error('Failed to send delete confirmation email:', err)
      );
    }

    // KROK D: Zrušíme session a odhlásime ho
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