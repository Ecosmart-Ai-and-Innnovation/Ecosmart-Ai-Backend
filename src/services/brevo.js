const nodemailer = require('nodemailer');

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SMTP_KEY = process.env.BREVO_SMTP_KEY;
const BREVO_SMTP_USER = process.env.BREVO_SMTP_USER;
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Ecosmart';
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'louisdiaz43@gmail.com';
const BREVO_API_URL = 'https://api.brevo.com/v3';

// ── Nodemailer transport via Brevo SMTP ──
let transporter = null;

function getTransporter() {
  if (!transporter && BREVO_SMTP_KEY && BREVO_SMTP_KEY !== 'your_smtp_key_here') {
    transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: BREVO_SMTP_USER || BREVO_SENDER_EMAIL,
        pass: BREVO_SMTP_KEY,
      },
    });
  }
  return transporter;
}

/**
 * Send a transactional email via Brevo REST API, with SMTP fallback.
 */
async function sendEmail({ to, subject, htmlContent }) {
  if (BREVO_API_KEY && BREVO_API_KEY !== 'your_brevo_api_key_here') {
    const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: BREVO_SENDER_NAME,
          email: BREVO_SENDER_EMAIL,
        },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Brevo email API error:', data);
      throw new Error(data.message || 'Failed to send email via Brevo');
    }

    console.log(`📧 Email sent to ${to} via Brevo API`);
    return data;
  }

  const transport = getTransporter();

  if (!transport) {
    console.log('⚠️  Brevo email not configured — email not sent');
    return null;
  }

  try {
    const info = await transport.sendMail({
      from: `"${BREVO_SENDER_NAME}" <${BREVO_SENDER_EMAIL}>`,
      to,
      subject,
      html: htmlContent,
    });

    console.log(`📧 Email sent to ${to} — messageId: ${info.messageId}`);
    return { messageId: info.messageId };
  } catch (error) {
    console.error('Nodemailer error:', error.message);
    throw new Error('Failed to send email');
  }
}

/**
 * Send a transactional SMS via Brevo REST API
 */
async function sendSMS({ to, content }) {
  if (!BREVO_API_KEY || BREVO_API_KEY === 'your_brevo_api_key_here') {
    console.log('⚠️  Brevo API key not configured — SMS not sent');
    return null;
  }

  const response = await fetch(`${BREVO_API_URL}/transactionalSMS/sms`, {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: 'EcoSmart',
      recipient: to,
      content,
      type: 'transactional',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Brevo SMS error:', data);
    throw new Error(data.message || 'Failed to send SMS via Brevo');
  }

  console.log(`📱 SMS sent to ${to}`);
  return data;
}

module.exports = { sendEmail, sendSMS };
