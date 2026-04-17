const isDeliveryDisabledForTesting = () => {
  const value = process.env.DISABLE_OUTBOUND_NOTIFICATIONS;

  if (value == null) return true;
  return String(value).toLowerCase() === 'true';
};

module.exports = {
  isDeliveryDisabledForTesting,
};