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

const formatRoleTitle = (role) => {
  if (role === 'doctor') return 'New appointment booked';
  return 'Appointment confirmed';
};

const buildAppointmentBookedEmailHtml = ({ metadata = {}, title, message }) => {
  const recipientRole = metadata.recipientRole === 'doctor' ? 'doctor' : 'patient';
  const heading = formatRoleTitle(recipientRole);

  const doctorName = metadata.doctorName || 'Your doctor';
  const patientName = metadata.patientName || metadata.patientEmail || 'Patient';
  const appointmentDate = formatDate(metadata.appointmentDate);
  const appointmentTime = metadata.appointmentTime || 'Not provided';
  const appointmentReason = metadata.reason || 'Not provided';

  const summaryLine =
    recipientRole === 'doctor'
      ? `${patientName} booked an appointment with you.`
      : `Your appointment with ${doctorName} has been booked successfully.`;

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title || heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f6fb;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dbe4f0;box-shadow:0 12px 36px rgba(15,23,42,0.08);">
            <tr>
              <td style="padding:22px 24px;background:linear-gradient(135deg,#1d4ed8 0%,#0ea5e9 100%);color:#ffffff;">
                <div style="font-size:12px;letter-spacing:1.2px;text-transform:uppercase;opacity:0.85;">Doctor365</div>
                <h1 style="margin:8px 0 0 0;font-size:24px;line-height:1.3;">${escapeHtml(heading)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(summaryLine)}</p>
                <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#475569;">${escapeHtml(message || '')}</p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
                  <tr>
                    <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;">
                      <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">Doctor</div>
                      <div style="font-size:15px;color:#0f172a;font-weight:600;margin-top:4px;">${escapeHtml(doctorName)}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;">
                      <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">Date & time</div>
                      <div style="font-size:15px;color:#0f172a;font-weight:600;margin-top:4px;">${escapeHtml(appointmentDate)} at ${escapeHtml(appointmentTime)}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px;">
                      <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">Reason</div>
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

module.exports = {
  buildAppointmentBookedEmailHtml,
};
