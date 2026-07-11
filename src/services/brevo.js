const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Ecosmart';
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'louisdiaz43@gmail.com';
const BREVO_API_URL = 'https://api.brevo.com/v3';

/**
 * Send a transactional email via Brevo REST API.
 */
async function sendEmail({ to, subject, htmlContent }) {
  if (!BREVO_API_KEY || BREVO_API_KEY === 'your_brevo_api_key_here') {
    console.log('⚠️  Brevo API key not configured — email not sent');
    return null;
  }

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
