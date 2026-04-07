const DEFAULT_NOTIFICATION_SERVICE_URL = 'http://localhost:5007';

const sendInternalNotification = async ({
  userId,
  type,
  title,
  message,
  metadata = {},
  recipientEmail,
  recipientPhone,
  channels = { inApp: true },
}) => {
  const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || DEFAULT_NOTIFICATION_SERVICE_URL;
  const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!internalToken) {
    console.warn('INTERNAL_SERVICE_TOKEN is not configured; skipping notification delivery');
    return;
  }

  try {
    await fetch(`${notificationServiceUrl}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': internalToken,
      },
      body: JSON.stringify({
        userId,
        type,
        title,
        message,
        channels,
        recipientEmail,
        recipientPhone,
        metadata,
      }),
    });
  } catch (error) {
    console.error('Failed to send internal notification:', error.message);
  }
};

module.exports = {
  sendInternalNotification,
};