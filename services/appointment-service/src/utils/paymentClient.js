const DEFAULT_PAYMENT_SERVICE_URL = 'http://localhost:5006';

const refundPaymentForAppointment = async (appointmentId, patientId, paymentOrderId) => {
  const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || DEFAULT_PAYMENT_SERVICE_URL;
  const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!internalToken) {
    console.warn('INTERNAL_SERVICE_TOKEN is not configured; skipping payment refund');
    return null;
  }

  if (!paymentOrderId) {
    console.info('No payment order ID for appointment; skipping refund');
    return null;
  }

  try {
    const response = await fetch(`${paymentServiceUrl}/payments/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': internalToken,
      },
      body: JSON.stringify({
        appointmentId,
        patientId,
        paymentOrderId,
        reason: 'appointment_cancelled',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Payment refund failed:', error);
      return null;
    }

    const data = await response.json();
    return data?.data || null;
  } catch (error) {
    console.error('Failed to process payment refund:', error.message);
    return null;
  }
};

module.exports = {
  refundPaymentForAppointment,
};
