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
    next();
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
      throw new Error('Missing required fields');
    }

    // Verify season ticket
    const ticketResult = await client.query(
      `SELECT entries_remaining, expiry_date FROM season_tickets WHERE id = $1 AND user_id = $2`,
      [seasonTicketId, userId]
    );
    if (ticketResult.rows.length === 0) {
      throw new Error('Season ticket not found');
    }
    const ticket = ticketResult.rows[0];
    if (ticket.entries_remaining < childrenCount) {
      throw new Error('Not enough entries remaining');
    }
    if (new Date(ticket.expiry_date) < new Date()) {
      throw new Error('Season ticket has expired');
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

    // Insert booking
    const bookingResult = await client.query(
      `INSERT INTO bookings (user_id, training_id, number_of_children, booked_at)
       VALUES ($1, $2, $3, NOW()) RETURNING id`,
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
    res.status(500).json({ error: error.message });
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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: `${trainingType} Training Session` },
          unit_amount: totalPrice * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-canceled`,
      metadata: {
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
        type: 'training_session',
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Payment session error:', error);
    res.status(500).json({ error: 'Failed to create payment session' });
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
    console.log('Webhook Event Received:', event.type);
  } catch (err) {
    console.error('Webhook Signature Verification Failed:', err.message);
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
          `INSERT INTO season_tickets (user_id, entries_total, entries_remaining, purchase_date, expiry_date, stripe_payment_id)
           VALUES ($1, $2, $2, NOW(), $3, $4) RETURNING *`,
          [userId, entries, expiryDate, session.id]
        );

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

        const insertResult = await client.query(
          `INSERT INTO bookings (user_id, training_id, number_of_children, booked_at)
           VALUES ($1, $2, $3, NOW()) RETURNING *`,
          [userId, training.id, childrenCount]
        );

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
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Webhook processing error:', error);
    } finally {
      client.release();
    }
  }

  res.json({ received: true });
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
        res.json({ message: 'Login successful', userId: user.id });
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

app.delete('/api/bookings/:bookingId', isAuthenticated, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const bookingId = req.params.bookingId;

    // Fetch booking details including number_of_children
    const bookingResult = await client.query(
      'SELECT user_id, number_of_children FROM bookings WHERE id = $1',
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      throw new Error('Booking not found');
    }

    const booking = bookingResult.rows[0];
    if (booking.user_id !== req.session.userId) {
      throw new Error('Unauthorized');
    }

    // Check if booking was made with a season ticket
    const usageResult = await client.query(
      'SELECT season_ticket_id FROM season_ticket_usage WHERE booking_id = $1',
      [bookingId]
    );

    if (usageResult.rows.length > 0) {
      const seasonTicketId = usageResult.rows[0].season_ticket_id;
      // Increment entries_remaining in season_tickets
      await client.query(
        'UPDATE season_tickets SET entries_remaining = entries_remaining + $1 WHERE id = $2',
        [booking.number_of_children, seasonTicketId]
      );
      // Delete season ticket usage record
      await client.query(
        'DELETE FROM season_ticket_usage WHERE booking_id = $1',
        [bookingId]
      );
    }

    // Delete the booking
    await client.query(
      'DELETE FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, req.session.userId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Booking canceled successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error canceling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  } finally {
    client.release();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});