const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (value) => {
  if (!value) return 'Not provided';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not provided';

  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'full',
  }).format(date);
};

const getEmailTheme = (type) => {
  if (type === 'appointment.cancelled') {
    return {
      headerLabel: 'Cancelled appointment',
      banner: '#dc2626',
      accent: '#fef2f2',
      border: '#fecaca',
    };
  }

  if (type === 'appointment.reminder') {
    return {
      headerLabel: 'Appointment reminder',
      banner: '#d97706',
      accent: '#fffbeb',
      border: '#fde68a',
    };
  }

  return {
    headerLabel: 'Appointment booked',
    banner: '#2563eb',
    accent: '#eff6ff',
    border: '#bfdbfe',
  };
};

const getSummaryLine = ({ type, recipientRole, doctorName, patientName }) => {
  if (type === 'appointment.cancelled') {
    return recipientRole === 'doctor'
      ? `${patientName} cancelled the appointment.`
      : `Your appointment with ${doctorName} has been cancelled.`;
  }

  if (type === 'appointment.reminder') {
    return recipientRole === 'doctor'
      ? `You have an upcoming appointment to prepare for.`
      : `You have an appointment coming up soon with ${doctorName}.`;
  }

  return recipientRole === 'doctor'
    ? `${patientName} booked an appointment with you.`
    : `Your appointment with ${doctorName} has been booked successfully.`;
};

const getIntroText = ({ type, message }) => {
  if (type === 'appointment.cancelled') {
    return message || 'The appointment has been cancelled and the schedule has been updated.';
  }

  if (type === 'appointment.reminder') {
    return message || 'This is a reminder for your upcoming appointment.';
  }

  return message || 'Your appointment has been confirmed.';
};

const buildAppointmentEmailHtml = ({ type = 'appointment.booked', metadata = {}, title, message }) => {
  const recipientRole = metadata.recipientRole === 'doctor' ? 'doctor' : 'patient';
  const theme = getEmailTheme(type);
  const doctorName = metadata.doctorName || 'Your doctor';
  const patientName = metadata.patientName || metadata.patientEmail || 'Patient';
  const appointmentDate = formatDate(metadata.appointmentDate);
  const appointmentTime = metadata.appointmentTime || 'Not provided';
  const appointmentReason = metadata.reason || 'Not provided';

  const summaryLine = getSummaryLine({
    type,
    recipientRole,
    doctorName,
    patientName,
  });

  const introText = getIntroText({ type, message });
  const detailLabel = type === 'appointment.reminder' ? 'Upcoming details' : 'Appointment details';
  const detailReasonLabel = type === 'appointment.cancelled' ? 'Cancelled reason' : 'Reason';

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title || theme.headerLabel)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f6fb;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid ${theme.border};box-shadow:0 12px 36px rgba(15,23,42,0.08);">
            <tr>
              <td style="padding:22px 24px;background:linear-gradient(135deg,${theme.banner} 0%,#0ea5e9 100%);color:#ffffff;">
                <div style="font-size:12px;letter-spacing:1.2px;text-transform:uppercase;opacity:0.85;">Doctor365</div>
                <h1 style="margin:8px 0 0 0;font-size:24px;line-height:1.3;">${escapeHtml(theme.headerLabel)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(summaryLine)}</p>
                <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#475569;">${escapeHtml(introText)}</p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${theme.border};border-radius:12px;background:${theme.accent};">
                  <tr>
                    <td style="padding:14px 16px;border-bottom:1px solid ${theme.border};">
                      <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">Doctor</div>
                      <div style="font-size:15px;color:#0f172a;font-weight:600;margin-top:4px;">${escapeHtml(doctorName)}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px;border-bottom:1px solid ${theme.border};">
                      <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">Date &amp; time</div>
                      <div style="font-size:15px;color:#0f172a;font-weight:600;margin-top:4px;">${escapeHtml(appointmentDate)} at ${escapeHtml(appointmentTime)}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px;">
                      <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">${escapeHtml(detailReasonLabel)}</div>
                      <div style="font-size:15px;color:#0f172a;font-weight:600;margin-top:4px;">${escapeHtml(appointmentReason)}</div>
                    </td>
                  </tr>
                </table>

                <p style="margin:20px 0 0 0;font-size:13px;line-height:1.6;color:#64748b;">
                  This is an automated email from Doctor365. Keep this message for your records.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const buildAppointmentBookedEmailHtml = (args) => buildAppointmentEmailHtml({ ...args, type: 'appointment.booked' });
const buildAppointmentCancelledEmailHtml = (args) => buildAppointmentEmailHtml({ ...args, type: 'appointment.cancelled' });
const buildAppointmentReminderEmailHtml = (args) => buildAppointmentEmailHtml({ ...args, type: 'appointment.reminder' });

module.exports = {
  buildAppointmentBookedEmailHtml,
  buildAppointmentCancelledEmailHtml,
  buildAppointmentReminderEmailHtml,
};
