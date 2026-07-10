const express = require('express');
const router = express.Router();
const Otp = require('../models/Otp');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const { sendEmail, sendSMS } = require('../services/brevo');
const jwt = require('jsonwebtoken');

// ── Send OTP ──
router.post('/send', async (req, res) => {
  try {
    const { method, identifier, purpose = 'password-reset' } = req.body; // purpose: password-reset | email-verification

    if (!method || !identifier) {
      return res.status(400).json({ success: false, message: 'Method and identifier are required' });
    }

    if (!['email', 'phone'].includes(method)) {
      return res.status(400).json({ success: false, message: 'Method must be "email" or "phone"' });
    }

    if (!['email-verification', 'password-reset'].includes(purpose)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP purpose' });
    }

    if (purpose === 'email-verification' && method !== 'email') {
      return res.status(400).json({ success: false, message: 'Email verification requires email OTP' });
    }

    if (purpose === 'password-reset' && method !== 'email') {
      return res.status(400).json({ success: false, message: 'Password reset is available by email only' });
    }

    const normalizedIdentifier = method === 'email'
      ? identifier.toLowerCase().trim()
      : identifier.trim();

    const user = method === 'email'
      ? await User.findOne({ email: normalizedIdentifier })
      : await User.findOne({ phone: normalizedIdentifier.replace(/\D/g, '') });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    if (purpose === 'email-verification' && user.emailVerified) {
      return res.json({
        success: true,
        message: 'Email is already verified',
        data: { masked: maskIdentifier(normalizedIdentifier, method), alreadyVerified: true },
      });
    }

    // Generate 6-digit OTP
    const otpCode = Otp.generate();

    // Store OTP with 5-minute expiry
    await Otp.create({
      identifier: normalizedIdentifier,
      method,
      otp: otpCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      purpose,
    });

    // Send OTP via Brevo
    const isConfigured = process.env.BREVO_API_KEY && process.env.BREVO_API_KEY !== 'your_brevo_api_key_here';

    if (isConfigured) {
      try {
        if (method === 'email') {
          await sendEmail({
            to: identifier,
            subject: purpose === 'email-verification'
              ? 'Verify your EcoSmart AI email'
              : 'Your EcoSmart AI Password Reset OTP',
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h1 style="color: #1b5030; font-size: 24px;">EcoSmart AI</h1>
                </div>
                <div style="background: #f6fcf4; border-radius: 16px; padding: 32px; text-align: center;">
                  <h2 style="color: #1b5030; margin-bottom: 8px;">${purpose === 'email-verification' ? 'Verify Your Email' : 'Password Reset'}</h2>
                  <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px;">
                    Use the OTP below to continue. It expires in 5 minutes.
                  </p>
                  <div style="background: #ffffff; border-radius: 12px; padding: 16px 32px; display: inline-block;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1b5030;">${otpCode}</span>
                  </div>
                </div>
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
                  If you didn't request this, you can safely ignore this email.
                </p>
              </div>
            `,
          });
        } else {
          await sendSMS({
            to: identifier,
          content: `Your EcoSmart AI OTP is: ${otpCode}. It expires in 5 minutes.`,
          });
        }
      } catch (brevoError) {
        // Log Brevo error but don't fail the request — OTP is still stored
        console.error('Brevo send failed (OTP still stored for dev use):', brevoError.message);
      }
    }

    // Always log to console for development
    console.log(`\n🔐 ${purpose} OTP for ${method} (${identifier}): ${otpCode}\n`);

    // Mask identifier for response
    const masked = maskIdentifier(identifier, method);

    res.json({
      success: true,
      message: `OTP sent to your ${method}`,
      data: {
        masked,
        // In development, always return the OTP since email/SMS may not actually send
        ...(process.env.NODE_ENV !== 'production' && { devOtp: otpCode }),
      },
    });
  } catch (error) {
    console.error('OTP send error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Verify OTP ──
router.post('/verify', async (req, res) => {
  try {
    const { method, identifier, otp, purpose = 'password-reset' } = req.body;

    if (!method || !identifier || !otp) {
      return res.status(400).json({ success: false, message: 'Method, identifier, and OTP are required' });
    }

    if (!['email-verification', 'password-reset'].includes(purpose)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP purpose' });
    }

    const normalizedIdentifier = method === 'email'
      ? identifier.toLowerCase().trim()
      : identifier.trim();

    // Find matching unverified OTP (without expiry check first)
    const otpDoc = await Otp.findOne({
      identifier: normalizedIdentifier,
      method,
      otp,
      purpose,
      verified: false,
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      // OTP doesn't match any record — wrong code
      return res.status(400).json({ success: false, message: 'Wrong OTP', code: 'invalid_otp' });
    }

    if (otpDoc.expiresAt < new Date()) {
      // OTP found but expired
      return res.status(400).json({ success: false, message: 'Expired code', code: 'expired_otp' });
    }

    // Mark as verified
    otpDoc.verified = true;
    await otpDoc.save();

    if (purpose === 'email-verification') {
      const user = await User.findOne({ email: normalizedIdentifier });
      if (!user) {
        return res.status(404).json({ success: false, message: 'No account found with this email' });
      }

      user.emailVerified = true;
      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      return res.json({
        success: true,
        message: 'Email verified successfully',
        data: {
          verified: true,
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
    }

    if (purpose === 'password-reset' && method !== 'email') {
      return res.status(400).json({ success: false, message: 'Password reset is available by email only' });
    }

    let resetToken = null;
    const user = await User.findOne({ email: normalizedIdentifier });
    if (user) {
      resetToken = await PasswordResetToken.generate(user._id);
    }

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: { verified: true, resetToken },
    });
  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Helper: Mask identifier for display ──
function maskIdentifier(identifier, method) {
  if (method === 'email') {
    const [local, domain] = identifier.split('@');
    if (!domain) return identifier;
    const maskedLocal = local.length <= 2
      ? local[0] + '*'.repeat(local.length - 1)
      : local[0] + '*'.repeat(Math.min(local.length - 2, 4)) + local.slice(-1);
    return `${maskedLocal}@${domain}`;
  } else {
    // Phone: show first 3 and last 2 digits
    const clean = identifier.replace(/\D/g, '');
    if (clean.length <= 3) return identifier;
    return clean.slice(0, 3) + '••••' + clean.slice(-2);
  }
}

module.exports = router;
