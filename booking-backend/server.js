require('dotenv').config({ path: './cred.env' });
console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);

const PORT = process.env.PORT || 5000;

console.log('PORT:', PORT);
console.log('DB_USER:', process.env.DB_USER);

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { v4: uuidv4 } = require('uuid');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PDFDocument = require('pdfkit');
const fs = require('fs');

const app = express();

app.use((req, res, next) => {
  if (req.originalUrl === '/stripe-webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
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
    console.log('[DEBUG] Session userId:', req.session.userId);
    const userResult = await pool.query(
      'SELECT email, role FROM users WHERE id = $1',
      [req.session.userId]
    );
    console.log('[DEBUG] User query result:', userResult.rows[0]);

    if (userResult.rows[0]?.email === process.env.ADMIN_EMAIL) {
      next();
    } else {
      console.log('[DEBUG] Admin check failed for email:', userResult.rows[0]?.email);
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
    console.log('Received training data:', req.body);

    const result = await pool.query(
      `INSERT INTO training_availability 
       (training_type, training_date, max_participants)
       VALUES ($1, $2, $3) RETURNING *`,
      [trainingType, trainingDate, maxParticipants]
    );

    console.log('Insert result:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Set training error:', error);
    res.status(500).json({ error: 'Failed to set training date', details: error.message });
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
    const tickets = await pool.query(
      'SELECT u.first_name, u.last_name, u.email, s.entries_total, s.entries_remaining FROM season_tickets s JOIN users u ON s.user_id = u.id'
    );
    res.json(tickets.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch season tickets' });
  }
});



// ... (previous code remains unchanged until /api/admin/payment-report)

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


app.get('/api/training-dates', async (req, res) => {
  try {
    const userId = req.session?.userId || null;
    let isAdmin = false;

    if (userId) {
      const roleCheck = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
      isAdmin = roleCheck.rows[0]?.role === 'admin';
    }

    // ✅ If admin → show all; else → hide cancelled
    const result = await pool.query(
      `
      SELECT id, training_type, training_date, max_participants, cancelled
      FROM training_availability
      WHERE training_date >= NOW()
      ${isAdmin ? '' : 'AND (cancelled IS NULL OR cancelled = FALSE)'}
      ORDER BY training_date ASC
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

    const pricing = { 5: 60, 10: 100 };
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
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-canceled`,
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
      userId,
      seasonTicketId,
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

    if (!userId || !seasonTicketId || !trainingType || !selectedDate || !selectedTime || !childrenCount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify season ticket
    const ticketResult = await client.query(
      `SELECT entries_remaining, expiry_date FROM season_tickets WHERE id = $1 AND user_id = $2`,
      [seasonTicketId, userId]
    );
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Season ticket not found' });
    }
    const ticket = ticketResult.rows[0];
    if (ticket.entries_remaining < childrenCount) {
      return res.status(400).json({ error: 'Not enough entries remaining in your season ticket' });
    }
    if (new Date(ticket.expiry_date) < new Date()) {
      return res.status(400).json({ error: 'Season ticket has expired' });
    }

    // Convert time format
    const [time, modifier] = selectedTime.split(' ');
    let [hours, minutes] = time.split(':');
    if (modifier === 'PM' && hours !== '12') hours = parseInt(hours) + 12;
    if (modifier === 'AM' && hours === '12') hours = '00';
    const trainingDateTime = new Date(`${selectedDate}T${hours}:${minutes}`);

    // Find training session
    const trainingResult = await client.query(
      `SELECT id, max_participants FROM training_availability WHERE training_type = $1 AND training_date = $2`,
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

    // Insert booking with amount_paid and payment_time
    const bookingResult = await client.query(
      `INSERT INTO bookings (user_id, training_id, number_of_children, amount_paid, payment_time, booked_at, active, booking_type)
   VALUES ($1, $2, $3, 0, NULL, NOW(), true, 'season_ticket') RETURNING id`,
      [userId, training.id, childrenCount]
    );
    const bookingId = bookingResult.rows[0].id;

    // Update season ticket entries
    await client.query(
      `UPDATE season_tickets SET entries_remaining = entries_remaining - $1 WHERE id = $2`,
      [childrenCount, seasonTicketId]
    );

    // Record season ticket usage
    await client.query(
      `INSERT INTO season_ticket_usage (season_ticket_id, booking_id, training_type, created_at, used_date)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [seasonTicketId, bookingId, trainingType]
    );

    // Fetch user details for email
    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    // Send emails
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'New Booking Request (Season Ticket)',
      text: `
        User: ${user.first_name} ${user.last_name}
        Email: ${user.email}
        Address: ${user.address}
        Mobile: ${mobile || 'Not provided'}
        Children: ${childrenCount}
        Children Age: ${childrenAge}
        Training: ${trainingType}
        Date: ${selectedDate}
        Time: ${selectedTime}
        Photo Consent: ${photoConsent ? 'Agreed' : 'Declined'}
        Notes: ${note || 'No additional notes'}
        Season Ticket ID: ${seasonTicketId}
      `.trim(),
    };

    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Booking Confirmation (Season Ticket)',
      text: `
        Hello ${user.first_name},
        Your ${trainingType} training on ${selectedDate} at ${selectedTime} has been confirmed using your season ticket (ID: ${seasonTicketId})!
        Details:
        - Address: ${user.address}
        - Mobile: ${mobile || 'Not provided'}
        - Children: ${childrenCount} (${childrenAge} years old)
        Thank you!
        Nitracik Team
      `.trim(),
    };

    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(userMailOptions),
    ]);

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Season ticket booking error:', error);

    // Return specific error messages based on the error type
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

app.post('/api/create-payment-session', isAuthenticated, async (req, res) => {
  try {
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
    } = req.body;

    if (!userId || !trainingType || !selectedDate || !selectedTime || !childrenCount || !totalPrice) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const pricing = { 1: 15, 2: 28, 3: 39 };
    if (!pricing[childrenCount]) {
      return res.status(400).json({ error: 'Invalid number of children' });
    }
    const expectedPrice = pricing[childrenCount] + (accompanyingPerson ? 3 : 0);
    if (totalPrice !== expectedPrice) {
      return res.status(400).json({ error: 'Price validation failed' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Convert time format
      const [time, modifier] = selectedTime.split(' ');
      let [hours, minutes] = time.split(':');
      if (modifier === 'PM' && hours !== '12') hours = parseInt(hours) + 12;
      if (modifier === 'AM' && hours === '12') hours = '00';
      const trainingDateTimeUTC = new Date(`${selectedDate}T${hours}:${minutes}`);
      const trainingDateTimeLocal = new Date(trainingDateTimeUTC.toLocaleString('en-US', { timeZone: 'Europe/Budapest' }));

      // Find training session
      const trainingResult = await client.query(
        `SELECT id, max_participants, training_type, training_date FROM training_availability WHERE training_type = $1 AND training_date = $2`,
        [trainingType, trainingDateTimeLocal]
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

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${trainingType} Training Session`,
              description: `Training on ${trainingDateTimeLocal.toLocaleString('en-US', { timeZone: 'Europe/Budapest' })}`
            },
            unit_amount: Math.round(totalPrice * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&booking_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/payment-canceled`,
        metadata: {
          userId: userId.toString(),
          trainingType,
          selectedDate,
          selectedTime,
          childrenCount: childrenCount.toString(),
          childrenAge: childrenAge?.toString() || '',
          totalPrice: totalPrice.toString(),
          photoConsent: photoConsent?.toString() || 'false',
          mobile: mobile || '',
          note: note || '',
          accompanyingPerson: accompanyingPerson?.toString() || 'false',
          type: 'training_session',
        },
      });

      // Create booking with all fields
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
          totalPrice,
          session.id,
          childrenAge || '',
          photoConsent !== null ? photoConsent : false,
          mobile || '',
          note || '',
          accompanyingPerson || false,
        ]
      );
      const bookingId = bookingResult.rows[0].id;

      console.log('[DEBUG] Booking created:', {
        bookingId,
        sessionId: session.id,
        amountPaid: totalPrice,
        userId,
        trainingId: training.id,
        numberOfChildren: childrenCount,
        childrenAges: childrenAge || '',
        photoConsent: photoConsent !== null ? photoConsent : false,
        mobile: mobile || '',
        note: note || '',
        accompanyingPerson: accompanyingPerson || false,
        trainingType,
        trainingDate: trainingDateTimeLocal.toISOString()
      });

      await client.query('COMMIT');
      res.json({ sessionId: session.id, bookingId });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[DEBUG] Payment session error:', error.message);
      res.status(500).json({ error: `Failed to create payment session: ${error.message}` });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[DEBUG] Payment session error:', error.message);
    res.status(500).json({ error: `Failed to create payment session: ${error.message}` });
  }
});

app.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
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
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      if (session.metadata.type === 'season_ticket') {
        const { userId, entries, totalPrice } = session.metadata;
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year expiry

        const ticketResult = await client.query(
          `INSERT INTO season_tickets (user_id, entries_total, entries_remaining, purchase_date, expiry_date, stripe_payment_id, amount_paid, payment_time)
           VALUES ($1, $2, $2, NOW(), $3, $4, $5, $6) RETURNING *`,
          [userId, entries, expiryDate, session.id, parseFloat(totalPrice), new Date(session.created * 1000)]
        );

        console.log('[DEBUG] Season ticket created:', {
          ticketId: ticketResult.rows[0].id,
          userId,
          entries,
          amountPaid: totalPrice
        });

        const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: 'Season Ticket Purchase Confirmation',
          text: `
            Hello ${user.first_name},
            Your season ticket purchase for ${entries} entries has been confirmed!
            Details:
            - Total Entries: ${entries}
            - Price: €${totalPrice}
            - Purchase Date: ${new Date().toLocaleDateString()}
            - Expiry Date: ${expiryDate.toLocaleDateString()}
            Thank you!
            Nitracik Team
          `.trim(),
        };

        await transporter.sendMail(mailOptions);
        console.log('[DEBUG] Season ticket email sent to:', user.email);
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

        const adminMailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.ADMIN_EMAIL,
          subject: 'New Booking Request',
          text: `
            User: ${user.first_name} ${user.last_name}
            Email: ${user.email}
            Address: ${user.address}
            Mobile: ${mobile || 'Not provided'}
            Children: ${childrenCount}
            Children Age: ${childrenAge}
            Training: ${trainingType}
            Date: ${selectedDate}
            Time: ${selectedTime}
            Photo Consent: ${photoConsent ? 'Agreed' : 'Declined'}
            Notes: ${note || 'No additional notes'}
            Price: €${totalPrice}
            Payment Intent: ${paymentIntentId}
          `.trim(),
        };

        const userMailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: 'Booking Confirmation',
          text: `
            Hello ${user.first_name},
            Your ${trainingType} training on ${selectedDate} at ${selectedTime} has been confirmed!
            Details:
            - Address: ${user.address}
            - Mobile: ${mobile || 'Not provided'}
            - Children: ${childrenCount} (${childrenAge} years old)
            - Price: €${totalPrice}
            Thank you!
            Nitracik Team
          `.trim(),
        };

        await Promise.all([
          transporter.sendMail(adminMailOptions),
          transporter.sendMail(userMailOptions),
        ]);
        console.log('[DEBUG] Booking confirmation emails sent to:', user.email, process.env.ADMIN_EMAIL);
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
  const requiredEnvVars = ['EMAIL_USER', 'EMAIL_PASS', 'DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'CLIENT_URL', 'SESSION_SECRET'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing ${envVar} in environment variables.`);
      process.exit(1);
    }
  }
}

validateEnvVariables();

let transporter;
try {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.verify(function (error, success) {
    if (error) {
      console.error("❌ Email server connection failed:", error);
    } else {
      console.log("✅ Email server is ready to send messages");
    }
  });
} catch (error) {
  console.error('Error setting up email transporter:', error);
  process.exit(1);
}

app.get('/api/test-email', async (req, res) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'Test Email',
      text: 'This is a test email from Nitracik.',
    });
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

async function sendEmail(mailOptions) {
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${mailOptions.to}`);
  } catch (error) {
    console.error(`Error sending email to ${mailOptions.to}:`, error);
    throw error;
  }
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateMobile(mobile) {
  const mobileRegex = /^\d{10,15}$/;
  return mobileRegex.test(mobile);
}

app.post('/api/register', async (req, res) => {
  const { firstName, lastName, email, password, address } = req.body;

  try {
    const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email is already registered. Please use a different one.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4();

    const result = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password, address, verification_token, verified) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [firstName, lastName, email, hashedPassword, address, verificationToken, false]
    );

    const verificationLink = `http://localhost:3000/verify-email?token=${verificationToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email',
      text: `Please click the following link to verify your email: ${verificationLink}`,
    };

    await sendEmail(mailOptions);
    res.status(201).json({ message: 'User registered successfully. Please check your email to verify your account.', userId: result.rows[0].id });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Failed to register user', error: error.message });
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

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset',
      text: `Click the following link to reset your password: ${resetLink}`,
    };

    await sendEmail(mailOptions);
    res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ message: 'Failed to send reset email.' });
  }
});

app.post('/api/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await pool.query('SELECT * FROM users WHERE reset_token = $1', [token]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

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
  const { token } = req.query;

  try {
    const result = await pool.query('SELECT * FROM users WHERE verification_token = $1', [token]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'You have successfully verified your email address' });
    }

    const user = result.rows[0];
    await pool.query('UPDATE users SET verified = true, verification_token = NULL WHERE id = $1', [user.id]);
    res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ message: 'Failed to verify email', error: error.message });
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
    const { trainingType, selectedDate, selectedTime, childrenCount } = req.query;

    const [time, modifier] = selectedTime.split(' ');
    let [hours, minutes] = time.split(':');
    if (modifier === 'PM' && hours !== '12') hours = parseInt(hours) + 12;
    if (modifier === 'AM' && hours === '12') hours = '00';
    const trainingDateTime = new Date(`${selectedDate}T${hours}:${minutes}`);

    const trainingResult = await pool.query(
      `SELECT id, max_participants FROM training_availability
       WHERE training_type = $1 AND training_date = $2`,
      [trainingType, trainingDateTime]
    );

    if (trainingResult.rows.length === 0) {
      return res.json({ available: false, reason: 'Session not found' });
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

    const canBook = remainingSpots >= requestedChildren;

    res.json({
      available: canBook,
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
        t.training_type, 
        t.training_date,
        t.cancelled,
        b.active,
        b.booking_type -- ✅ ADD: Include booking_type
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

app.delete('/api/bookings/:bookingId', isAuthenticated, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const bookingId = req.params.bookingId;

    // 1. Get complete booking and payment information
    const bookingResult = await client.query(
      `SELECT b.id, b.user_id, b.training_id, b.number_of_children, b.session_id, 
              b.amount_paid, b.payment_time, b.payment_intent_id, b.credit_id,
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

    // ✅ NEW: Check if cancellation is allowed (10 hours before session)
    const trainingDateTime = new Date(booking.training_date);
    const currentTime = new Date();
    const timeDifference = trainingDateTime - currentTime;
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    if (hoursDifference <= 10) {
      throw new Error('Cancellation is not allowed within 10 hours of the session');
    }

    console.log('[DEBUG] Booking details:', {
      bookingId: booking.id,
      userId: booking.user_id,
      sessionId: booking.session_id || 'null',
      paymentIntentId: booking.payment_intent_id || 'null',
      amountPaid: booking.amount_paid || 0,
      paymentTime: booking.payment_time ? booking.payment_time.toISOString() : 'null',
      trainingType: booking.training_type,
      trainingDate: booking.training_date,
      creditId: booking.credit_id || 'null',
      hoursUntilSession: hoursDifference // Added for debugging
    });

    // Check if booking was made with season ticket
    const usageResult = await client.query(
      'SELECT season_ticket_id FROM season_ticket_usage WHERE booking_id = $1',
      [bookingId]
    );

    let refundData = null;

    // 2. Process Stripe refund only for paid bookings (not season tickets)
    if (usageResult.rows.length === 0) {
      if (!booking.amount_paid || booking.amount_paid <= 0) {
        console.log('[DEBUG] Skipping refund: amount_paid is missing or zero');
        refundData = { error: 'No payment associated with this booking' };
        await client.query(
          'INSERT INTO refunds (booking_id, amount, status, reason, created_at) VALUES ($1, $2, $3, $4, NOW())',
          [bookingId, 0, 'failed', 'No payment associated with this booking']
        );
      } else if (!booking.payment_intent_id) {
        console.log('[DEBUG] Skipping refund: payment_intent_id is missing');
        refundData = { error: 'No payment intent found for this booking' };
        await client.query(
          'INSERT INTO refunds (booking_id, amount, status, reason, created_at) VALUES ($1, $2, $3, $4, NOW())',
          [bookingId, booking.amount_paid, 'failed', 'No payment intent found']
        );
      } else {
        try {
          // Create refund using payment_intent_id
          const refund = await stripe.refunds.create({
            payment_intent: booking.payment_intent_id,
            amount: Math.round(booking.amount_paid * 100),
            reason: 'requested_by_customer',
            metadata: {
              booking_id: bookingId,
              user_id: booking.user_id,
              training_type: booking.training_type,
              training_date: booking.training_date
            }
          });

          console.log('[DEBUG] Refund processed:', {
            refundId: refund.id,
            paymentIntentId: booking.payment_intent_id,
            amount: booking.amount_paid
          });
          refundData = refund;

          // Store refund reference in database
          await client.query(
            'INSERT INTO refunds (booking_id, refund_id, amount, status, reason, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
            [bookingId, refund.id, booking.amount_paid, refund.status, 'Cancellation by customer']
          );
        } catch (refundError) {
          console.error('[DEBUG] Refund creation error:', refundError.message);
          let userFriendlyMessage = 'Failed to process refund. Please contact support.';
          if (refundError.type === 'StripeInvalidRequestError') {
            userFriendlyMessage = 'Invalid refund request. The payment may have already been refunded or is invalid.';
          } else if (refundError.code === 'resource_missing') {
            userFriendlyMessage = 'Payment record not found. Please contact support.';
          }
          refundData = { error: userFriendlyMessage };
          await client.query(
            'INSERT INTO refunds (booking_id, amount, status, reason, created_at) VALUES ($1, $2, $3, $4, NOW())',
            [bookingId, booking.amount_paid, 'failed', userFriendlyMessage]
          );
        }
      }
    }

    // 3. Handle season ticket usage reversal
    if (usageResult.rows.length > 0) {
      const seasonTicketId = usageResult.rows[0].season_ticket_id;
      console.log('[DEBUG] Reversing season ticket usage for ticket:', seasonTicketId);
      await client.query(
        'UPDATE season_tickets SET entries_remaining = entries_remaining + $1 WHERE id = $2',
        [booking.number_of_children, seasonTicketId]
      );
      await client.query(
        'DELETE FROM season_ticket_usage WHERE booking_id = $1',
        [bookingId]
      );
    }

    // 4. Delete the booking (refunds.booking_id will be set to NULL by constraint)
    console.log('[DEBUG] Deleting booking:', bookingId);
    const deleteResult = await client.query(
      'DELETE FROM bookings WHERE id = $1 AND user_id = $2 RETURNING *',
      [bookingId, req.session.userId]
    );

    if (deleteResult.rowCount === 0) {
      throw new Error('Booking not found or unauthorized');
    }

    await client.query('COMMIT');

    // 5. Send cancellation emails with refund information
    try {
      const adminMailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: 'Session Cancellation Notification',
        text: `
          Session Cancellation
          User: ${booking.first_name} ${booking.last_name}
          Email: ${booking.email}
          Training: ${booking.training_type}
          Date: ${new Date(booking.training_date).toLocaleString()}
          Children: ${booking.number_of_children}
          Refund Status: ${refundData ? (refundData.id ? `Processed (${refundData.id})` : `Failed: ${refundData.error}`) : 'Not applicable (season ticket)'}
          Amount: €${booking.amount_paid || 0}
        `.trim(),
      };

      const userMailOptions = {
        from: process.env.EMAIL_USER,
        to: booking.email,
        subject: 'Session Cancellation Confirmation',
        text: `
          Hello ${booking.first_name},
          Your ${booking.training_type} training session on ${new Date(booking.training_date).toLocaleString()} has been successfully canceled.
          ${refundData && refundData.id ? `
            Refund Information:
            - Amount: €${booking.amount_paid}
            - Refund ID: ${refundData.id}
            - Status: ${refundData.status}
            The refund may take 5-10 business days to appear in your account.
          ` : refundData && refundData.error ? `
            Refund Status: Failed to process refund: ${refundData.error}. Please contact support.
          ` : usageResult.rows.length > 0 ? `
            Season Ticket: ${booking.number_of_children} entries have been returned to your season ticket.
          ` : ''}
          If you have any questions, please contact us.
          Best regards,
          Nitracik Team
        `.trim(),
      };

      await Promise.all([
        transporter.sendMail(adminMailOptions),
        transporter.sendMail(userMailOptions),
      ]);
      console.log('[DEBUG] Cancellation emails sent successfully');
    } catch (emailError) {
      console.error('[DEBUG] Error sending cancellation emails:', emailError.message);
    }

    res.json({
      message: 'Booking canceled successfully',
      trainingDate: booking.training_date,
      refundProcessed: !!refundData?.id,
      refundId: refundData?.id,
      seasonTicketEntriesReturned: usageResult.rows.length > 0 ? booking.number_of_children : 0,
      refundError: refundData?.error || null
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[DEBUG] Error canceling booking:', error.message);
    if (error.message === 'Booking not found or unauthorized') {
      return res.status(404).json({ error: 'Booking not found or unauthorized' });
    }
    return res.status(500).json({ error: 'Failed to cancel booking: ' + error.message });
  } finally {
    client.release();
  }
});

//Permanently delete cancelled sessions by Admin
app.delete('/api/admin/training-sessions/:trainingId', isAdmin, async (req, res) => {
  const { trainingId } = req.params;
  const client = await pool.connect();

  console.log('[DEBUG] Deleting training session:', trainingId);

  try {
    await client.query('BEGIN');

    // 1. Verify the session exists and is cancelled
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
      return res.status(400).json({ error: 'Only cancelled sessions can be deleted' });
    }

    // 2. ✅ UPDATED: Check if there are any remaining bookings for this session
    const bookingsCheck = await client.query(
      'SELECT COUNT(*) as booking_count, ARRAY_AGG(user_id) as user_ids FROM bookings WHERE training_id = $1',
      [trainingId]
    );

    const bookingCount = parseInt(bookingsCheck.rows[0].booking_count);

    if (bookingCount > 0) {
      const userIds = bookingsCheck.rows[0].user_ids;
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Cannot delete session. ${bookingCount} booking(s) still remain.`,
        remainingBookings: bookingCount,
        userIds: userIds,
        message: 'All users must process their refunds or credits before deletion.'
      });
    }

    // 3. Delete the session (only if no bookings remain)
    const deleteResult = await client.query(
      'DELETE FROM training_availability WHERE id = $1 RETURNING *',
      [trainingId]
    );

    if (deleteResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Failed to delete training session' });
    }

    await client.query('COMMIT');

    console.log('[DEBUG] Training session deleted successfully:', trainingId);
    res.json({
      success: true,
      message: 'Training session deleted permanently',
      deletedSession: deleteResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete training session error:', error);
    res.status(500).json({ error: 'Failed to delete training session: ' + error.message });
  } finally {
    client.release();
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
  const userId = req.session.userId;

  console.log('[DEBUG] Admin cancel session request:', { trainingId, reason, forceCancel });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verify the training session exists and get its date
    const trainingRes = await client.query(
      'SELECT training_date FROM training_availability WHERE id = $1',
      [trainingId]
    );

    if (trainingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Training session not found' });
    }

    const trainingDate = new Date(trainingRes.rows[0].training_date);
    const hoursDiff = (trainingDate - new Date()) / (1000 * 60 * 60);

    // 2. Check 10-hour rule unless forceCancel is true
    if (hoursDiff <= 10 && !forceCancel) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Session is within 10 hours. Use forceCancel=true to override.'
      });
    }

    // 3. ✅ UPDATED: Only mark the training session as cancelled - DON'T delete bookings
    const updateResult = await client.query(
      'UPDATE training_availability SET cancelled = TRUE WHERE id = $1 RETURNING *',
      [trainingId]
    );

    if (updateResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Failed to cancel training session' });
    }

    console.log('[DEBUG] Training session marked as cancelled:', trainingId);

    // 4. Get all bookings for this session to send emails
    const bookingsRes = await client.query(`
      SELECT b.id AS booking_id, b.user_id, b.amount_paid, b.payment_intent_id,
             u.email, u.first_name, u.last_name,
             ta.training_type, ta.training_date
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN training_availability ta ON ta.id = b.training_id
      WHERE b.training_id = $1
    `, [trainingId]);

    const bookings = bookingsRes.rows;
    console.log('[DEBUG] Affected bookings:', bookings.length);

    // 5. Send cancellation emails to all affected users
    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

    for (const booking of bookings) {
      const refundUrl = `${CLIENT_URL}/refund-option?bookingId=${booking.booking_id}&action=refund`;
      const creditUrl = `${CLIENT_URL}/refund-option?bookingId=${booking.booking_id}&action=credit`;

      const sessionDate = new Date(booking.training_date).toLocaleString('en-GB', {
        dateStyle: 'full',
        timeStyle: 'short',
      });

      const html = `
        <div style="font-family:Arial, sans-serif; line-height:1.6;">
          <h3>Training Session Cancelled</h3>
          <p>Dear ${booking.first_name},</p>
          <p>Your <strong>${booking.training_type}</strong> training on <strong>${sessionDate}</strong> has been cancelled.</p>
          <p>Reason: ${reason || 'No reason provided.'}</p>
          <p>Please choose one of the following:</p>
          <div style="margin:20px 0;">
            <a href="${refundUrl}" style="background:#e63946;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;">💳 Request Refund</a>
            &nbsp;&nbsp;
            <a href="${creditUrl}" style="background:#2a9d8f;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;">🎫 Accept Credit</a>
          </div>
          <p>If you take no action, your payment will remain on hold.</p>
          <p>Best regards,<br/>Nitracik Team</p>
        </div>
      `;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: booking.email,
        subject: `Cancelled: ${booking.training_type} Training`,
        html,
      });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Session cancelled successfully. ${bookings.length} users notified.`,
      canceledBookings: bookings.length,
      forceCancelUsed: forceCancel || false
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cancel session error:', error);
    res.status(500).json({ error: 'Failed to cancel session: ' + error.message });
  } finally {
    client.release();
  }
});


// Update refund endpoint to remove booking AFTER processing
app.get('/api/booking/refund', async (req, res) => {
  const { bookingId } = req.query;
  if (!bookingId) return res.status(400).send('Missing bookingId.');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Try to find the active booking first
    const bookingRes = await client.query(
      'SELECT user_id, training_id, payment_intent_id, amount_paid FROM bookings WHERE id = $1 AND active = true',
      [bookingId]
    );

    let firstTimeRefund = false;
    let refundRecord = null;

    // ✅ CASE 1: Active booking found → process refund and deactivate booking
    if (bookingRes.rows.length > 0) {
      const { user_id, payment_intent_id, amount_paid } = bookingRes.rows[0];

      // Double-check if refund already exists for this booking
      const existingRefund = await client.query(
        'SELECT refund_id, status FROM refunds WHERE booking_id = $1',
        [bookingId]
      );

      if (existingRefund.rows.length === 0) {
        // Create Stripe refund
        const refund = await stripe.refunds.create({
          payment_intent: payment_intent_id,
        });

        refundRecord = refund;

        // Store refund record
        await client.query(
          `INSERT INTO refunds (booking_id, refund_id, amount, status, reason, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [bookingId, refund.id, amount_paid, refund.status, 'User selected refund']
        );

        // ✅ NEW: Deactivate booking instead of deleting it
        await client.query(
          'UPDATE bookings SET active = false WHERE id = $1 AND user_id = $2',
          [bookingId, user_id]
        );

        firstTimeRefund = true;
      } else {
        refundRecord = existingRefund.rows[0];
      }
    }

    await client.query('COMMIT');

    // ✅ Success response (same as before)
    if (firstTimeRefund && refundRecord) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Refund Processed Successfully</title>
            <meta http-equiv="refresh" content="4;url=${process.env.CLIENT_URL}/booking" />
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
                .success-container { background: white; color: #333; padding: 40px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 500px; margin: 0 auto; }
                .success-icon { font-size: 60px; margin-bottom: 20px; }
                .countdown { margin-top: 20px; font-size: 14px; color: #666; }
            </style>
        </head>
        <body>
            <div class="success-container">
                <div class="success-icon">💳</div>
                <h2>Refund Processed Successfully!</h2>
                <p>Your refund (ID: <strong>${refundRecord.id}</strong>) was successfully processed.</p>
                <p>You'll be automatically redirected in <span id="countdown">4</span> seconds...</p>
                <div class="countdown">
                    <a href="${process.env.CLIENT_URL}/booking" style="color: #667eea;">Click here if you are not redirected</a>
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
          <title>Refund Already Processed</title>
          <meta http-equiv="refresh" content="4;url=${process.env.CLIENT_URL}/booking" />
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
              <h2>Refund Already Processed</h2>
              <p>Your refund has already been handled successfully.</p>
              <p>You'll be redirected in <span id="countdown">4</span> seconds...</p>
              <div class="countdown">
                  <a href="${process.env.CLIENT_URL}/booking" style="color: #667eea;">Click here if you are not redirected</a>
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
    console.error('Refund error:', err);
    res.redirect(`${process.env.CLIENT_URL}/error?reason=refund_failed`);
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
            <meta http-equiv="refresh" content="4;url=${process.env.CLIENT_URL}/booking" />
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
                    <a href="${process.env.CLIENT_URL}/booking" style="color: #667eea;">Click here if you are not redirected</a>
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
          <meta http-equiv="refresh" content="4;url=${process.env.CLIENT_URL}/booking" />
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
                  <a href="${process.env.CLIENT_URL}/booking" style="color: #667eea;">Click here if you are not redirected</a>
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
    res.redirect(`${process.env.CLIENT_URL}/error?reason=credit_failed`);
  } finally {
    client.release();
  }
});


// Endpoint to use credit for new booking
app.post('/api/bookings/use-credit', async (req, res) => {
  const { creditId, trainingId, childrenAges, photoConsent, mobile, note, accompanyingPerson } = req.body;
  const userId = req.session.userId;

  console.log('[DEBUG] Use credit request:', {
    creditId,
    trainingId,
    userId,
    childrenAges,
    photoConsent,
    mobile,
    note,
    accompanyingPerson
  });

  if (!userId) {
    console.log('[DEBUG] Unauthorized: No userId in session');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ✅ FIX: Fetch the credit with accompanying_person instead of companion_count
    console.log('[DEBUG] Fetching credit:', creditId);
    const creditResult = await client.query(
      `SELECT 
    user_id, 
    child_count, 
    accompanying_person, 
    children_ages,
    photo_consent, 
    mobile, 
    note, 
    training_type, 
    status, 
    session_id
   FROM credits WHERE id = $1 AND user_id = $2 AND status = 'active'`,
      [creditId, userId]
    );

    if (creditResult.rows.length === 0) {
      console.log('[DEBUG] Credit not found or not usable');
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Credit not found or not usable' });
    }

    const credit = creditResult.rows[0];
    const originalSessionId = credit.session_id;

    // Verify NEW training availability
    console.log('[DEBUG] Verifying new training availability:', trainingId);
    const trainingResult = await client.query(
      `SELECT id, training_date, training_type, max_participants 
       FROM training_availability WHERE id = $1`,
      [trainingId]
    );

    if (trainingResult.rows.length === 0) {
      console.log('[DEBUG] Training not found');
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Training session not found' });
    }

    // Check participant count for NEW session
    console.log('[DEBUG] Checking participant count for new trainingId:', trainingId);
    const currentBookings = await client.query(
      `SELECT COALESCE(SUM(number_of_children), 0) as total 
       FROM bookings WHERE training_id = $1`,
      [trainingId]
    );
    const totalParticipants = currentBookings.rows[0].total + credit.child_count;
    if (totalParticipants > trainingResult.rows[0].max_participants) {
      console.log('[DEBUG] Training session is full');
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Training session is full' });
    }

    // ✅ NEW: Only deactivate the original booking but keep booking_type as 'paid'
    if (originalSessionId) {
      console.log('[DEBUG] Deactivating original booking from cancelled session:', originalSessionId);
      await client.query(
        'UPDATE bookings SET active = false WHERE user_id = $1 AND training_id = $2 AND booking_type = $3',
        [userId, originalSessionId, 'paid'] // Only deactivate paid bookings, keep type as 'paid'
      );
      console.log('[DEBUG] Original paid booking deactivated (not deleted)');
    }

    // ✅ Use updated form data or fall back to credit data
    const finalChildrenAges = childrenAges || credit.children_ages || '';
    const finalPhotoConsent = photoConsent !== undefined ? photoConsent : credit.photo_consent;
    const finalMobile = mobile || credit.mobile || '';
    const finalNote = note || credit.note || '';
    const finalAccompanyingPerson = accompanyingPerson !== undefined ? accompanyingPerson : (credit.accompanying_person || false);

    console.log('[DEBUG] Final booking data:', {
      childrenAges: finalChildrenAges,
      photoConsent: finalPhotoConsent,
      mobile: finalMobile,
      note: finalNote,
      accompanyingPerson: finalAccompanyingPerson
    });

    // Insert new booking with updated information - explicitly set as 'credit'
    console.log('[DEBUG] Inserting new booking for trainingId:', trainingId);
    const bookingResult = await client.query(
      `INSERT INTO bookings (
    user_id, training_id, number_of_children, children_ages, 
    photo_consent, mobile, note, accompanying_person, 
    amount_paid, payment_intent_id, payment_time, credit_id, 
    session_id, booked_at, booking_type, active
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), $14, $15)
  RETURNING id`,
      [
        credit.user_id,
        trainingId,
        credit.child_count || 1,
        finalChildrenAges,
        finalPhotoConsent,
        finalMobile,
        finalNote,
        finalAccompanyingPerson,
        0, // amount_paid: 0 for credit-based booking
        null, // payment_intent_id: null for credit-based booking
        null, // payment_time: null for credit-based booking
        creditId, // credit_id: tracks which credit was used
        null, // session_id: null for credit-based booking
        'credit', // ✅ CRITICAL: Explicitly set booking_type to 'credit'
        true // active: true for new booking
      ]
    );

    const bookingId = bookingResult.rows[0].id;
    console.log('[DEBUG] Booking created with ID:', bookingId);

    // Mark credit as used
    console.log('[DEBUG] Marking credit as used:', creditId);
    await client.query(
      `UPDATE credits SET status = 'used', used_at = NOW() WHERE id = $1`,
      [creditId]
    );

    // ✅ Send confirmation emails
    try {
      const userResult = await client.query(
        'SELECT first_name, last_name, email FROM users WHERE id = $1',
        [userId]
      );

      const trainingResult = await client.query(
        'SELECT training_type, training_date FROM training_availability WHERE id = $1',
        [trainingId]
      );

      if (userResult.rows.length > 0 && trainingResult.rows.length > 0) {
        const user = userResult.rows[0];
        const training = trainingResult.rows[0];

        // Admin email
        const adminMailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.ADMIN_EMAIL,
          subject: 'Credit-Based Booking Created',
          text: `
            New booking created using credit:
            User: ${user.first_name} ${user.last_name}
            Email: ${user.email}
            Training: ${training.training_type}
            Date: ${new Date(training.training_date).toLocaleString()}
            Children: ${credit.child_count}
            Children Ages: ${finalChildrenAges}
            Mobile: ${finalMobile}
            Photo Consent: ${finalPhotoConsent ? 'Agreed' : 'Declined'}
            Notes: ${finalNote || 'None'}
            Booking ID: ${bookingId}
            Credit ID: ${creditId}
            Original cancelled session cleared: ${originalSessionId || 'N/A'}
          `.trim(),
        };

        // User email
        const userMailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: 'Booking Confirmation (Credit)',
          text: `
            Hello ${user.first_name},
            
            Your booking has been confirmed using your credit!
            
            Details:
            - Training: ${training.training_type}
            - Date: ${new Date(training.training_date).toLocaleString()}
            - Children: ${credit.child_count}
            - Children Ages: ${finalChildrenAges}
            - Mobile: ${finalMobile || 'Not provided'}
            
            Your original cancelled session has been cleared.
            
            Thank you for using your credit!
            
            Best regards,
            Nitracik Team
          `.trim(),
        };

        await Promise.all([
          transporter.sendMail(adminMailOptions),
          transporter.sendMail(userMailOptions),
        ]);

        console.log('[DEBUG] Confirmation emails sent successfully');
      }
    } catch (emailError) {
      console.error('[DEBUG] Error sending confirmation emails:', emailError.message);
      // Don't fail the booking if email fails
    }

    // Commit transaction
    console.log('[DEBUG] Committing transaction');
    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Booking created successfully using credit',
      bookingId: bookingId
    });
  } catch (error) {
    console.error('[DEBUG] Error using credit:', error.message, error.stack);
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Error using credit: ' + error.message });
  } finally {
    console.log('[DEBUG] Releasing client');
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
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `New Contact Form Message from ${name}`,
      text: `
        Name: ${name}
        Email: ${email}
        Message: ${message}
        
        Sent from Nitracik contact form.
      `.trim(),
      replyTo: email
    };

    await transporter.sendMail(mailOptions);

    // Send confirmation email to user
    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Thank you for contacting Nitracik',
      text: `
        Dear ${name},
        
        Thank you for contacting Nitracik! We have received your message and will get back to you as soon as possible.
        
        Your message:
        "${message}"
        
        Best regards,
        Nitracik Team
      `.trim()
    };

    await transporter.sendMail(userMailOptions);

    res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ message: 'Failed to send message. Please try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // ---------- SMTP TEST (Render SMTP block diagnosis) ----------
  const dns = require("dns");
  const net = require("net");

  // MX lookup test (DNS check)
  dns.resolveMx("gmail.com", (err, addresses) => {
    if (err) {
      console.log("MX lookup failed:", err);
    } else {
      console.log("MX lookup OK:", addresses);
    }
  });

  // Try to open a TCP connection to smtp.gmail.com:587
  const socket = net.createConnection(587, "smtp.gmail.com");
  socket.setTimeout(5000);

  socket.on("connect", () => {
    console.log("SMTP port test: Able to connect to smtp.gmail.com:587");
    socket.destroy();
  });

  socket.on("timeout", () => {
    console.log("SMTP port test: TIMEOUT — Render is blocking SMTP");
    socket.destroy();
  });

  socket.on("error", (err) => {
    console.log("SMTP port test error:", err.message);
  });
  // -------------------------------------------------------------
});
