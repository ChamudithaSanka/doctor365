const DEFAULT_APPOINTMENT_SERVICE_URL = 'http://localhost:5004';

const markAppointmentAsPaid = async ({ appointmentId, patientId, paymentOrderId }) => {
  const appointmentServiceUrl = process.env.APPOINTMENT_SERVICE_URL || DEFAULT_APPOINTMENT_SERVICE_URL;
  const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!internalToken) {
    console.warn('INTERNAL_SERVICE_TOKEN is not configured; skipping appointment payment sync');
    return null;
  }

  try {
    const response = await fetch(`${appointmentServiceUrl}/api/appointments/internal/mark-paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': internalToken,
      },
      body: JSON.stringify({
        appointmentId,
        patientId,
        paymentOrderId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Appointment payment sync failed:', error);
      return null;
    }

    const data = await response.json();
    return data?.data || null;
  } catch (error) {
    console.error('Failed to sync appointment payment status:', error.message);
    return null;
  }
};

module.exports = {
  markAppointmentAsPaid,
};
