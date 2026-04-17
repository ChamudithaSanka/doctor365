const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatAmount = ({ amount, currency }) => {
  const numericAmount = Number(amount);
  const displayCurrency = String(currency || 'USD').toUpperCase();

  if (Number.isNaN(numericAmount)) {
    return `${displayCurrency} ${amount ?? 'Not provided'}`;
  }

  try {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${displayCurrency} ${numericAmount.toFixed(2)}`;
  }
};

const getPaymentTheme = (status) => {
  if (status === 'paid') {
    return {
      headerLabel: 'Payment successful',
      banner: '#16a34a',
      accent: '#f0fdf4',
      border: '#bbf7d0',
      summary: 'Your payment has been received successfully.',
    };
  }

  if (status === 'refunded') {
    return {
      headerLabel: 'Payment refunded',
      banner: '#2563eb',
      accent: '#eff6ff',
      border: '#bfdbfe',
      summary: 'Your payment has been refunded.',
    };
  }

  return {
    headerLabel: 'Payment update',
    banner: '#dc2626',
    accent: '#fef2f2',
    border: '#fecaca',
    summary: 'There was an issue with your payment.',
  };
};

const buildPaymentEmailHtml = ({ metadata = {}, title, message }) => {
  const status = String(metadata.status || '').toLowerCase() || 'failed';
  const theme = getPaymentTheme(status);
  const amount = formatAmount({ amount: metadata.amount, currency: metadata.currency });
  const orderId = metadata.orderId || 'Not provided';
  const appointmentId = metadata.appointmentId || 'Not provided';
  const statusLabel = status.replace(/_/g, ' ') || 'Not provided';

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
                <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(theme.summary)}</p>
                <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#475569;">${escapeHtml(message || 'Your payment event was processed by Doctor365.')}</p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${theme.border};border-radius:12px;background:${theme.accent};">
                  <tr>
                    <td style="padding:14px 16px;border-bottom:1px solid ${theme.border};">
                      <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">Amount</div>
                      <div style="font-size:15px;color:#0f172a;font-weight:600;margin-top:4px;">${escapeHtml(amount)}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px;border-bottom:1px solid ${theme.border};">
                      <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">Order ID</div>
                      <div style="font-size:15px;color:#0f172a;font-weight:600;margin-top:4px;">${escapeHtml(orderId)}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px;border-bottom:1px solid ${theme.border};">
                      <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">Appointment ID</div>
                      <div style="font-size:15px;color:#0f172a;font-weight:600;margin-top:4px;">${escapeHtml(appointmentId)}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px;">
                      <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">Status</div>
                      <div style="font-size:15px;color:#0f172a;font-weight:600;margin-top:4px;text-transform:capitalize;">${escapeHtml(statusLabel)}</div>
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
  buildPaymentEmailHtml,
};
