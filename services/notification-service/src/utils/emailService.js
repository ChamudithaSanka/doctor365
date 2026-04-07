const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD;

  if (!user || !pass) {
    throw new Error('Gmail credentials are not configured');
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });

  return transporter;
};

const sendEmailNotification = async ({ to, subject, text, metadata = {} }) => {
  if (!to) {
    throw new Error('Recipient email is required');
  }

  const sender = process.env.SENDER_EMAIL || process.env.GMAIL_USER;

  if (!sender) {
    throw new Error('Sender email is not configured');
  }

  const html = metadata.emailHtml || `<p>${text}</p>`;

  await getTransporter().sendMail({
    from: sender,
    to,
    subject,
    text,
    html,
  });
};

module.exports = {
  sendEmailNotification,
};