const Otp = require('../models/Otp');
const { sendEmail } = require('./brevo');

// Shared by /api/auth/register, /api/auth/forgot-password, and /api/otp/send
// so the "auto-send on register" and "resend" flows can work together. 
async function generateAndSendEmailOtp({ email, purpose }) {
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
    console.error(`Email OTP send failed for ${normalizedEmail} (purpose: ${purpose}):`, error);
  }

  console.log(`\n ${purpose} OTP for email (${normalizedEmail}): ${otpCode}\n`);

  return otpCode;
}

module.exports = { generateAndSendEmailOtp };
