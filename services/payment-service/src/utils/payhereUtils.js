const crypto = require('crypto');

const md5Upper = (value) => crypto.createHash('md5').update(value).digest('hex').toUpperCase();

const formatAmount = (value) => Number(value).toFixed(2);

const generateCheckoutHash = ({ merchantId, orderId, amount, currency, merchantSecret }) => {
  const secretHash = md5Upper(merchantSecret);
  return md5Upper(`${merchantId}${orderId}${amount}${currency}${secretHash}`);
};

const generateNotifySignature = ({
  merchantId,
  orderId,
  amount,
  currency,
  statusCode,
  merchantSecret,
}) => {
  const secretHash = md5Upper(merchantSecret);
  return md5Upper(`${merchantId}${orderId}${amount}${currency}${statusCode}${secretHash}`);
};

const getPayHereActionUrl = (isSandbox) => {
  return isSandbox ? 'https://sandbox.payhere.lk/pay/checkout' : 'https://www.payhere.lk/pay/checkout';
};

const mapPayHereStatusCode = (statusCode) => {
  const code = Number(statusCode);

  if (code === 2) return 'paid';
  if (code === 0) return 'pending';
  if (code === -3) return 'refunded';
  return 'failed';
};

module.exports = {
  formatAmount,
  generateCheckoutHash,
  generateNotifySignature,
  getPayHereActionUrl,
  mapPayHereStatusCode,
};
