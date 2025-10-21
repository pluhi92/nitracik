require('dotenv').config({ path: './cred.env' });
console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);

const PORT = process.env.PORT || 5000;

console.log('PORT:', PORT);
console.log('DB_USER:', process.env.DB_USER);

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
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
  origin: 'http://localhost:3000',
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
        u.id AS user_id,
        u.first_name,
        u.last_name,
        u.email,
        b.number_of_children,
        SUM(b.number_of_children) OVER (PARTITION BY ta.id) AS total_children,
        (ta.max_participants - SUM(b.number_of_children) OVER (PARTITION BY ta.id)) AS available_spots
      FROM training_availability ta
      LEFT JOIN bookings b ON ta.id = b.training_id
      LEFT JOIN users u ON b.user_id = u.id
      WHERE ta.training_date >= NOW()
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

app.post('/api/admin/payment-report', isAuthenticated, async (req, res) => {
  // Check if user is admin (assuming ADMIN_EMAIL is in env and session has user email)
  const userEmail = req.session.email; // Ensure this is set in isAuthenticated middleware
  if (userEmail !== process.env.ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { startDate, endDate } = req.body;
  const currentDate = new Date(); // Use current system date and time: 10:05 AM CEST, June 18, 2025

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

    // Fetch payments for sessions (excluding those paid with season tickets)
    const sessionPayments = await client.query(
      `SELECT u.last_name, u.first_name, 'reservation' AS order_type, b.amount_paid, b.payment_time 
       FROM bookings b 
       JOIN users u ON b.user_id = u.id 
       LEFT JOIN season_ticket_usage stu ON b.id = stu.booking_id 
       WHERE b.payment_time BETWEEN $1 AND $2 AND stu.season_ticket_id IS NULL`,
      [startDate, endDateWithTime]
    );

    // Fetch payments for season tickets
    const seasonTicketPayments = await client.query(
      `SELECT u.last_name, u.first_name, 'season ticket' AS order_type, st.amount_paid, st.payment_time 
       FROM season_tickets st 
       JOIN users u ON st.user_id = u.id 
       WHERE st.payment_time BETWEEN $1 AND $2`,
      [startDate, endDateWithTime]
    );

    // Combine and sort results by payment_time
    const payments = [...sessionPayments.rows, ...seasonTicketPayments.rows].sort((a, b) => new Date(a.payment_time) - new Date(b.payment_time));
    console.log('Fetched and sorted payments:', payments); // Debug log

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 }); // This sets equal margins on all sides
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

    // Table setup - Calculate to ensure equal left/right margins
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const columnWidths = [120, 120, 100, 100, 150]; // Adjusted widths
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
        doc.text(p.payment_time ? new Date(p.payment_time).toLocaleString() : 'N/A', leftMargin + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + cellPadding, y + cellPadding, { width: columnWidths[4] - cellPadding * 2 });
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
      // Center the "no records" message as well
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
    const result = await pool.query(
      `SELECT id, training_type, training_date, max_participants
       FROM training_availability
       WHERE training_date >= NOW()
       ORDER BY training_date ASC`
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
      `INSERT INTO bookings (user_id, training_id, number_of_children, amount_paid, payment_time, booked_at)
       VALUES ($1, $2, $3, 0, NULL, NOW()) RETURNING id`,
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
          session_id, booked_at, children_ages, photo_consent, mobile, note, accompanying_person
        ) VALUES ($1, $2, $3, $4, NULL, $5, NOW(), $6, $7, $8, $9, $10)
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
       FROM bookings WHERE training_id = $1`,
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
    const result = await pool.query(
      `SELECT b.id AS booking_id, t.training_type, t.training_date
       FROM bookings b
       JOIN training_availability t ON b.training_id = t.id
       WHERE b.user_id = $1
       ORDER BY t.training_date ASC`,
      [userId]
    );
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
      if (booking.credit_id) {
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

// New endpoint for admin to cancel an entire session (all bookings for a training_id)
app.post('/api/admin/cancel-session', async (req, res) => {
  const { trainingId, reason, forceCancel } = req.body; // Added forceCancel
  const userId = req.session.userId;

  console.log('[DEBUG] Request body:', req.body);
  console.log('[DEBUG] Session userId:', userId);

  if (!userId) {
    console.log('[DEBUG] Unauthorized: No userId in session');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const client = await pool.connect();

  try {
    // Verify user is admin
    console.log('[DEBUG] Verifying admin status for userId:', userId);
    const userResult = await client.query('SELECT email, role FROM users WHERE id = $1', [userId]);
    console.log('[DEBUG] User query result:', userResult.rows);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      console.log('[DEBUG] Admin check failed');
      return res.status(403).json({ error: 'Only admins can cancel sessions' });
    }

    // ✅ NEW: Check if session is within 10 hours (but allow override with forceCancel)
    console.log('[DEBUG] Checking session timing for trainingId:', trainingId);
    const trainingResult = await client.query(
      'SELECT training_date FROM training_availability WHERE id = $1',
      [trainingId]
    );
    
    if (trainingResult.rows.length > 0) {
      const trainingDateTime = new Date(trainingResult.rows[0].training_date);
      const currentTime = new Date();
      const hoursDifference = (trainingDateTime - currentTime) / (1000 * 60 * 60);
      
      console.log('[DEBUG] Session timing check:', {
        trainingDate: trainingDateTime,
        currentTime: currentTime,
        hoursDifference: hoursDifference,
        forceCancel: forceCancel
      });
      
      if (hoursDifference <= 10 && !forceCancel) {
        console.log('[DEBUG] Session within 10 hours, forceCancel not set');
        return res.status(400).json({ 
          error: 'Session is within 10 hours. Use forceCancel=true to override',
          hoursUntilSession: hoursDifference,
          trainingDate: trainingDateTime
        });
      }
      
      if (hoursDifference <= 10 && forceCancel) {
        console.log('[DEBUG] Session within 10 hours, but forceCancel is true - proceeding');
      }
    } else {
      console.log('[DEBUG] Training session not found for timing check');
    }

    // Start transaction
    console.log('[DEBUG] Starting transaction');
    await client.query('BEGIN');

    // Fetch all bookings for this training session
    console.log('[DEBUG] Fetching bookings for trainingId:', trainingId);
    const bookingsResult = await client.query(
      `SELECT b.id, b.user_id, b.training_id, b.number_of_children, b.children_ages, 
              b.photo_consent, b.mobile, b.note, b.accompanying_person,
              b.amount_paid, b.payment_intent_id, b.payment_time, b.credit_id,
              ta.training_type, ta.training_date, ta.max_participants,
              u.email, u.first_name, u.last_name
       FROM bookings b
       JOIN training_availability ta ON b.training_id = ta.id
       JOIN users u ON b.user_id = u.id
       WHERE b.training_id = $1`,
      [trainingId]
    );
    console.log('[DEBUG] Bookings fetched:', bookingsResult.rows);

    const bookings = bookingsResult.rows;
    const canceledBookings = [];
    const errors = [];

    // Process each booking
    for (const booking of bookings) {
      console.log('[DEBUG] Processing booking:', booking.id);
      try {
        // Check if booking was made with season ticket
        console.log('[DEBUG] Checking season ticket usage for booking:', booking.id);
        const seasonTicketUsageResult = await client.query(
          'SELECT season_ticket_id FROM season_ticket_usage WHERE booking_id = $1',
          [booking.id]
        );
        console.log('[DEBUG] Season ticket usage:', seasonTicketUsageResult.rows);

        let refundData = null;

        // Process refund for paid bookings (not season tickets or credits)
        if (seasonTicketUsageResult.rows.length === 0 && !booking.credit_id && booking.amount_paid > 0 && booking.payment_intent_id && booking.payment_intent_id !== 'null') {
          console.log('[DEBUG] Attempting refund for booking:', booking.id);
          try {
            const refund = await stripe.refunds.create({
              payment_intent: booking.payment_intent_id,
              amount: Math.round(Number(booking.amount_paid) * 100), // Ensure number
              reason: 'requested_by_customer',
              metadata: {
                booking_id: booking.id,
                user_id: booking.user_id,
                admin_cancellation: 'true',
                reason: reason || 'Admin initiated cancellation'
              }
            });
            refundData = refund;
            console.log('[DEBUG] Refund processed for booking', booking.id, ':', refund.id);

            // Store refund record
            console.log('[DEBUG] Inserting refund record for booking:', booking.id);
            await client.query(
              'INSERT INTO refunds (booking_id, refund_id, amount, status, reason, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
              [booking.id, refund.id, booking.amount_paid, refund.status, `Admin cancellation: ${reason}`]
            );
          } catch (refundError) {
            console.error('[DEBUG] Refund creation error for booking', booking.id, ':', refundError.message);
            refundData = { error: refundError.message };
          }
        }

        // Return season ticket entries if applicable
        if (seasonTicketUsageResult.rows.length > 0) {
          const seasonTicketId = seasonTicketUsageResult.rows[0].season_ticket_id;
          console.log('[DEBUG] Updating season ticket:', seasonTicketId);
          await client.query(
            'UPDATE season_tickets SET entries_remaining = entries_remaining + $1 WHERE id = $2',
            [booking.number_of_children || 1, seasonTicketId]
          );

          console.log('[DEBUG] Deleting season ticket usage for booking:', booking.id);
          await client.query(
            'DELETE FROM season_ticket_usage WHERE booking_id = $1',
            [booking.id]
          );
        }

        // ✅ NEW: Handle credit-based booking reversal
        else if (booking.credit_id) {
          console.log('[DEBUG] Reversing credit usage for credit:', booking.credit_id);
          await client.query(
            'UPDATE credits SET status = $1, used_at = NULL WHERE id = $2',
            ['unused', booking.credit_id]
          );
        }

        // Insert credit for future use (for all booking types)
        console.log('[DEBUG] Inserting credit for booking:', booking.id);
        await client.query(
          `INSERT INTO credits (
     user_id, session_id, child_count, companion_count, children_ages, 
     photo_consent, mobile, note, training_type, original_date, reason, status
   ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'unused')`,
          [
            booking.user_id,
            booking.training_id,
            booking.number_of_children,
            booking.accompanying_person ? 1 : 0,
            booking.children_ages,
            booking.photo_consent,
            booking.mobile,
            booking.note,
            booking.training_type,
            booking.training_date,
            reason,
          ]
        );

        // Delete the booking
        console.log('[DEBUG] Deleting booking:', booking.id);
        await client.query('DELETE FROM bookings WHERE id = $1', [booking.id]);

        // Validate email before sending
        if (!booking.email) {
          console.error('[DEBUG] No email for booking:', booking.id);
          errors.push(`No email address for booking ${booking.id}`);
          continue;
        }

        // Send email notification
        console.log('[DEBUG] Sending email for booking:', booking.id);
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: booking.email,
          subject: 'Session Cancelled by Admin - Credit Issued',
          text: `
            Hello ${booking.first_name || 'User'},
            
            Your ${booking.training_type || 'session'} training session on ${new Date(booking.training_date).toLocaleString()} 
            has been cancelled by the administrator.
            
            Reason: ${reason || 'No reason provided'}
            
            ${seasonTicketUsageResult.rows.length > 0 ?
              `Season Ticket: ${booking.number_of_children || 1} entries have been returned to your season ticket.` :
              booking.credit_id ?
                `Credit: Your original credit has been returned to your account.` :
              refundData && refundData.id ?
                `Refund Information: €${booking.amount_paid || 0} has been refunded. Refund ID: ${refundData.id}` :
                refundData && refundData.error ?
                  `Refund Status: Could not process refund automatically. Please contact support. Error: ${refundData.error}` :
                  'A credit has been issued for future use.'
            }
            
            If you have any questions, please contact us.
            
            Best regards,
            Nitracik Team
          `.trim(),
        };

        await transporter.sendMail(mailOptions);
        console.log('[DEBUG] Email sent successfully to:', booking.email);

        canceledBookings.push(booking.id);
      } catch (bookingError) {
        console.error('[DEBUG] Error processing booking', booking.id, ':', bookingError.message);
        errors.push(`Failed to process booking ${booking.id}: ${bookingError.message}`);
      }
    }

    // Check if training_availability exists before deletion
    console.log('[DEBUG] Checking training_availability for deletion:', trainingId);
    const trainingExists = await client.query('SELECT id FROM training_availability WHERE id = $1', [trainingId]);
    if (trainingExists.rows.length > 0) {
      console.log('[DEBUG] Deleting training_availability:', trainingId);
      await client.query('DELETE FROM training_availability WHERE id = $1', [trainingId]);
    } else {
      console.log('[DEBUG] training_availability not found for id:', trainingId);
      errors.push(`Training availability ${trainingId} not found`);
    }

    // Commit transaction
    console.log('[DEBUG] Committing transaction');
    await client.query('COMMIT');

    console.log('[DEBUG] Response: Success, canceled bookings:', canceledBookings, 'errors:', errors);
    res.json({
      success: true,
      message: 'Session cancelled successfully',
      canceledBookings: canceledBookings.length,
      errors: errors.length > 0 ? errors : null,
      forceCancelUsed: forceCancel || false // Added to response
    });

  } catch (error) {
    console.error('[DEBUG] Outer error cancelling session:', error.message, error.stack);
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to cancel session: ' + error.message });
  } finally {
    console.log('[DEBUG] Releasing client');
    client.release();
  }
});

// New endpoint to use credit
app.post('/api/bookings/use-credit', async (req, res) => {
  const { creditId, trainingId } = req.body;
  const userId = req.session.userId;

  console.log('[DEBUG] Use credit request:', { creditId, trainingId, userId });

  if (!userId) {
    console.log('[DEBUG] Unauthorized: No userId in session');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Fetch the credit
    console.log('[DEBUG] Fetching credit:', creditId);
    const creditResult = await client.query(
      `SELECT user_id, child_count, companion_count, children_ages, 
              photo_consent, mobile, note, training_type, status
       FROM credits WHERE id = $1 AND user_id = $2 AND status = 'unused'`,
      [creditId, userId]
    );

    if (creditResult.rows.length === 0) {
      console.log('[DEBUG] Credit not found or not usable');
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Credit not found or not usable' });
    }

    const credit = creditResult.rows[0];

    // Verify training availability
    console.log('[DEBUG] Verifying training availability:', trainingId);
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

    // Check participant count
    console.log('[DEBUG] Checking participant count for trainingId:', trainingId);
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

    // Insert new booking
    console.log('[DEBUG] Inserting new booking for trainingId:', trainingId);
    await client.query(
      `INSERT INTO bookings (
        user_id, training_id, number_of_children, children_ages, 
        photo_consent, mobile, note, accompanying_person, 
        amount_paid, payment_intent_id, payment_time, credit_id, 
        session_id, booked_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
      [
        credit.user_id,
        trainingId,
        credit.child_count || 1, // Matches default in schema
        credit.children_ages || '',
        credit.photo_consent,
        credit.mobile || '',
        credit.note || '',
        credit.companion_count ? true : false,
        0, // amount_paid: 0 for credit-based booking
        null, // payment_intent_id: null for credit-based booking
        null, // payment_time: null for credit-based booking
        creditId, // credit_id: tracks which credit was used
        null, // session_id: null for credit-based booking
      ]
    );

    // Mark credit as used
    console.log('[DEBUG] Marking credit as used:', creditId);
    await client.query(
      `UPDATE credits SET status = 'used', used_at = NOW() WHERE id = $1`,
      [creditId]
    );

    // Commit transaction
    console.log('[DEBUG] Committing transaction');
    await client.query('COMMIT');

    res.json({ success: true, message: 'Booking created successfully using credit' });
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});