const isDeliveryDisabledForTesting = () => {
  const value = process.env.DISABLE_OUTBOUND_NOTIFICATIONS || true;

  return typeof value === 'string' && value.toLowerCase() === 'true';
};

module.exports = {
  isDeliveryDisabledForTesting,
};