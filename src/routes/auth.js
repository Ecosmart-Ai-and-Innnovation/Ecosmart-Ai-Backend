const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const auth = require('../middleware/auth');
const PasswordResetToken = require('../models/PasswordResetToken');
const Otp = require('../models/Otp');
const { sendEmail } = require('../services/brevo');

const router = express.Router();

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts per window
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many reset requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password validation (relaxed for hackathon)
function validatePassword(password) {
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
}

// Email format validation
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendEmailOtp({ email, purpose }) {
  const normalizedEmail = email.toLowerCase().trim();
  const otpCode = Otp.generate();

  await Otp.create({
    identifier: normalizedEmail,
    method: 'email',
    otp: otpCode,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    purpose,
  });

  try {
    await sendEmail({
      to: normalizedEmail,
      subject: purpose === 'email-verification'
        ? 'Verify your EcoSmart AI email'
        : 'Your EcoSmart AI Password Reset OTP',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #1b5030; font-size: 24px; text-align: center;">EcoSmart AI</h1>
          <div style="background: #f6fcf4; border-radius: 16px; padding: 32px; text-align: center;">
            <h2 style="color: #1b5030; margin-bottom: 8px;">${purpose === 'email-verification' ? 'Verify Your Email' : 'Password Reset'}</h2>
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px;">Use the OTP below. It expires in 5 minutes.</p>
            <div style="background: #ffffff; border-radius: 12px; padding: 16px 32px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1b5030;">${otpCode}</span>
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Email OTP send failed (OTP still stored for dev use):', error.message);
  }

  console.log(`\n🔐 ${purpose} OTP for email (${normalizedEmail}): ${otpCode}\n`);

  return otpCode;
}

// ── Sign Up ──
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const publicRole = ['individual', 'recycler'].includes(role) ? role : 'individual';

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || '',
      role: publicRole,
      password: hashedPassword,
      emailVerified: false,
    });

    await sendEmailOtp({ email: user.email, purpose: 'email-verification' });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Sign In ──
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Determine if email field contains an email or phone number
    const isEmail = email.includes('@');
    let user;

    if (isEmail) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid email' });
      }
    } else {
      // Treat as phone — search by phone
      user = await User.findOne({ phone: email.replace(/\D/g, '') });
      if (!user) {
        return res.status(400).json({ success: false, message: 'Phone number does not exist' });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before signing in',
        code: 'email_not_verified',
        data: {
          email: user.email,
          role: user.role,
          emailVerified: false,
        },
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Get Current User ──
router.get('/me', auth, async (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      emailVerified: req.user.emailVerified,
      createdAt: req.user.createdAt,
    },
  });
});

// ── Forgot Password (generates reset token) ──
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ success: false, message: 'No account found with this email' });
    }

    await sendEmailOtp({ email: user.email, purpose: 'password-reset' });

    res.json({
      success: true,
      message: 'Reset code sent to your email',
      data: { email: user.email },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Reset Password ──
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and password are required' });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    // Verify the token against the stored hash
    const resetDoc = await PasswordResetToken.verify(token);
    if (!resetDoc) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await User.findByIdAndUpdate(resetDoc.userId, { password: hashedPassword });

    // Delete the used token
    await resetDoc.deleteOne();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
  }
});

module.exports = router;
