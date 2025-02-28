require('dotenv').config({ path: './cred.env' }); // Ensure this line is at the top
console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);

// Define PORT here
const PORT = process.env.PORT || 5000;

console.log('PORT:', PORT); // Debug log
console.log('DB_USER:', process.env.DB_USER); // Debug log

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { v4: uuidv4 } = require('uuid'); // For generating verification tokens

// Initialize the Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://192.168.68.63:3000',
  credentials: true,
  // allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Session setup
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'user_sessions'
  }),
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false, // Do not save uninitialized sessions
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
}));

const isAdmin = async (req, res, next) => {
  try {
    console.log('[DEBUG] Session userId:', req.session.userId); // Check session
    const userResult = await pool.query(
      'SELECT email, role FROM users WHERE id = $1',
      [req.session.userId]
    );
    console.log('[DEBUG] User query result:', userResult.rows[0]); // Log user data

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

// Training Availability Endpoints
app.post('/api/set-training', isAdmin, async (req, res) => {
  try {
    const { trainingType, trainingDate, maxParticipants } = req.body;
    console.log('Received training data:', req.body);

    // Debug: Log the parsed trainingDate
    console.log('Parsed trainingDate:', new Date(trainingDate));

    // Debug: Log the maxParticipants value
    console.log('maxParticipants:', maxParticipants);

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

// Booking Endpoint
app.post('/api/book-training', isAuthenticated, async (req, res) => {
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
      note
    } = req.body;

    // Convert 12-hour time to 24-hour format
    const [time, modifier] = selectedTime.split(' ');
    let [hours, minutes] = time.split(':');
    if (modifier === 'PM' && hours !== '12') hours = parseInt(hours) + 12;
    if (modifier === 'AM' && hours === '12') hours = '00';

    const trainingDateTime = new Date(`${selectedDate}T${hours}:${minutes}`);

    // Fetch the training session
    const trainingResult = await pool.query(
      `SELECT * FROM training_availability
       WHERE training_type = $1 AND training_date = $2`,
      [trainingType, trainingDateTime]
    );

    if (trainingResult.rows.length === 0) {
      return res.status(400).json({ error: 'Training not available' });
    }

    const training = trainingResult.rows[0];

    // Check current bookings for this training session
    const bookingsResult = await pool.query(
      `SELECT COUNT(*) AS booked_count
       FROM bookings
       WHERE training_id = $1`,
      [training.id]
    );

    const bookedCount = parseInt(bookingsResult.rows[0].booked_count, 10);
    const maxParticipants = training.max_participants;

    if (bookedCount >= maxParticipants) {
      return res.status(400).json({ error: 'This training session is full. Please choose another date or time.' });
    }

    // Insert booking
    await pool.query(
      `INSERT INTO bookings (user_id, training_id, booked_at)
       VALUES ($1, $2, NOW())`,
      [userId, training.id]
    );

    // Fetch user details for email
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    // Admin email
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
      `.trim()
    };

    // User email
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
      `.trim()
    };

    // Send emails
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(userMailOptions)
    ]);

    res.status(201).json({ message: 'Training booked successfully. Emails sent!' });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Failed to process booking' });
  }
});


// Middleware to log session data for debugging
app.use((req, res, next) => {
  console.log('Session data:', req.session);
  next();
});

// Validate environment variables
function validateEnvVariables() {
  const requiredEnvVars = ['EMAIL_USER', 'EMAIL_PASS', 'DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing ${envVar} in environment variables.`);
      process.exit(1);
    }
  }
}

validateEnvVariables();


// Email transporter setup
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

//testing send email function
app.get('/api/test-email', async (req, res) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL, // Or hardcode your email for testing
      subject: 'Test Email',
      text: 'This is a test email from Nitracik.'
    });
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

// Function to send email
async function sendEmail(mailOptions) {
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${mailOptions.to}`);
  } catch (error) {
    console.error(`Error sending email to ${mailOptions.to}:`, error);
    throw error;
  }
}

// Validate email format
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate mobile number format
function validateMobile(mobile) {
  const mobileRegex = /^\d{10,15}$/; // Simple mobile number validation
  return mobileRegex.test(mobile);
}

// User registration endpoint
app.post('/api/register', async (req, res) => {
  const { firstName, lastName, email, password, address } = req.body;

  try {
    // Check if the email already exists
    const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email is already registered. Please use a different one.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a verification token
    const verificationToken = uuidv4();
    console.log('Generated token:', verificationToken);

    // Insert the new user into the database
    const result = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password, address, verification_token, verified) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [firstName, lastName, email, hashedPassword, address, verificationToken, false]
    );

    // Send verification email
    const verificationLink = `http://localhost:3000/verify-email?token=${verificationToken}`;
    console.log('Verification link:', verificationLink);

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

// Forgot Password Endpoint
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Generate a reset token
    const resetToken = uuidv4();

    // Save the reset token in the database
    await pool.query('UPDATE users SET reset_token = $1 WHERE id = $2', [
      resetToken,
      user.rows[0].id,
    ]);

    // Send the reset link to the user's email
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

// Reset Password Endpoint
app.post('/api/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Check if the token is valid
    const user = await pool.query('SELECT * FROM users WHERE reset_token = $1', [token]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password and clear the reset token
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

// Email verification endpoint
app.get('/api/verify-email', async (req, res) => {
  const { token } = req.query;

  try {
    // Find the user with the matching verification token
    const result = await pool.query('SELECT * FROM users WHERE verification_token = $1', [token]);
    console.log('Token from request:', token);
    console.log('Query result:', result.rows);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'You have successfully verified your email address' });
    }

    const user = result.rows[0];

    // Mark the user as verified
    await pool.query('UPDATE users SET verified = true, verification_token = NULL WHERE id = $1', [user.id]);

    res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ message: 'Failed to verify email', error: error.message });
  }
});

// User login endpoint (updated to check if email is verified)
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
        req.session.userId = user.id; // Set userId in the session
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


// User logout endpoint
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Failed to logout', error: err.message });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Fetch user data by ID
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
    const { trainingType, selectedDate, selectedTime } = req.query;

    const [time, modifier] = selectedTime.split(' ');
    let [hours, minutes] = time.split(':');
    if (modifier === 'PM' && hours !== '12') hours = parseInt(hours) + 12;
    if (modifier === 'AM' && hours === '12') hours = '00';

    const trainingDateTime = new Date(`${selectedDate}T${hours}:${minutes}`);

    const trainingResult = await pool.query(
      `SELECT * FROM training_availability
       WHERE training_type = $1 AND training_date = $2`,
      [trainingType, trainingDateTime]
    );

    if (trainingResult.rows.length === 0) {
      return res.json({ isFull: true }); // No session found
    }

    const training = trainingResult.rows[0];
    const bookingsResult = await pool.query(
      `SELECT COUNT(*) AS booked_count
       FROM bookings
       WHERE training_id = $1`,
      [training.id]
    );

    const bookedCount = parseInt(bookingsResult.rows[0].booked_count, 10);
    const isFull = bookedCount >= training.max_participants;

    res.json({ isFull });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

app.post('/api/verify-password', isAuthenticated, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.session.userId;

    // Fetch user's hashed password from the database
    const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Compare passwords
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

    // Fetch bookings for the user
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

setInterval(async () => {
  try {
    // Delete expired bookings
    await pool.query(`
      DELETE FROM bookings
      WHERE training_id IN (
        SELECT id FROM training_availability WHERE training_date <= NOW()
      )
    `);

    // Delete expired training sessions (optional)
    await pool.query('DELETE FROM training_availability WHERE training_date <= NOW()');

    console.log('✅ Cleaned up expired bookings and training sessions');
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}, 24 * 60 * 60 * 1000);

app.delete('/api/bookings/:bookingId', isAuthenticated, async (req, res) => {
  try {
    const bookingId = req.params.bookingId;

    // Debug: Log the booking ID being deleted
    console.log('Deleting booking with ID:', bookingId);

    // Delete the booking
    const deleteResult = await pool.query('DELETE FROM bookings WHERE id = $1 RETURNING *', [bookingId]);

    // Debug: Log the result of the deletion
    console.log('Delete result:', deleteResult.rows);

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.status(200).json({ message: 'Booking canceled successfully' });
  } catch (error) {
    console.error('Error canceling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Delete user account
app.delete('/api/users/:id', isAuthenticated, async (req, res) => {
  const client = await pool.connect(); // Get a client from the pool

  try {
    const userId = req.params.id;

    // Verify user owns the account
    if (req.session.userId !== parseInt(userId)) {
      return res.status(403).json({ error: 'Unauthorized to delete this account' });
    }

    // Fetch user email before deletion
    console.log('Fetching user email for ID:', userId);
    const userResult = await client.query('SELECT email FROM users WHERE id = $1', [userId]);
    const userEmail = userResult.rows[0]?.email;
    console.log('User email:', userEmail);

    if (!userEmail) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Start a transaction
    await client.query('BEGIN');

    // Delete related bookings
    await client.query('DELETE FROM bookings WHERE user_id = $1', [userId]);

    // Delete related sessions
    await client.query('DELETE FROM user_sessions WHERE sess->>\'userId\' = $1', [userId]);

    // Delete the user
    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    // Commit the transaction
    await client.query('COMMIT');

    // Send confirmation email
    console.log('Sending confirmation email to:', userEmail);
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Account Deletion Confirmation',
      text: `
        Your account has been successfully deleted. 
        Thank you for being part of our trainings. 
        We hope to see you again in the future!
      `,
    };

    await transporter.sendMail(mailOptions);

    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
      res.clearCookie('connect.sid'); // Clear session cookie
      res.status(200).json({ message: 'Account deleted successfully' });
    });

  } catch (error) {
    // Rollback the transaction on error
    await client.query('ROLLBACK');
    console.error('Account deletion error:', error);
    res.status(500).json({ error: 'Failed to delete account', details: error.message });
  } finally {
    // Release the client back to the pool
    client.release();
  }
});

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
  console.log('Session data in isAuthenticated:', req.session); // Debug log
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
}



pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Database connected:', res.rows[0]);
});

// Start the server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));