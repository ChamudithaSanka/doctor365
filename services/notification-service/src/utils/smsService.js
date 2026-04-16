const twilio = require('twilio');
const { isDeliveryDisabledForTesting } = require('./deliveryControl');

let client;

const getClient = () => {
  if (client) {
    return client;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials are not configured');
  }

  client = twilio(accountSid, authToken);

  return client;
};

const sendSmsNotification = async ({ to, body }) => {
  if (!to) {
    throw new Error('Recipient phone number is required');
  }

  if (isDeliveryDisabledForTesting()) {
    return;
  }

  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!from) {
    throw new Error('Twilio phone number is not configured');
  }

  await getClient().messages.create({
    from,
    to,
    body,
  });
};

module.exports = {
  sendSmsNotification,
};