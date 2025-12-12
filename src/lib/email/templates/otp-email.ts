const brand = {
  appName: 'HealthCare',
  teal600: '#0d9488', // tailwind teal-600
  teal700: '#0f766e', // tailwind teal-700
  slate950: '#020617', // tailwind slate-950
  slate700: '#334155', // tailwind slate-700
  slate200: '#e2e8f0', // tailwind slate-200
  slate50: '#f8fafc', // tailwind slate-50
};

export function buildOtpEmailHtml(params: {
  code: string;
  recipientEmail: string;
  expiresMinutes: number;
}) {
  const { code, recipientEmail, expiresMinutes } = params;

  const subject = `${brand.appName} — Your verification code`;

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:${brand.slate50};font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:${brand.slate950};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;border:1px solid ${brand.slate200};background:#ffffff;">
            <tr>
              <td style="padding:18px 18px;border-bottom:1px solid ${brand.slate200};">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="vertical-align:middle;">
                      <div style="display:inline-block;border:1px solid ${brand.slate200};padding:8px 10px;font-weight:800;letter-spacing:-0.02em;color:${brand.teal700};">
                        HC
                      </div>
                      <span style="margin-left:10px;font-weight:700;font-size:14px;color:${brand.slate950};">${brand.appName}</span>
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${brand.slate700};">
                        Email OTP
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 18px 0 18px;">
                <p style="margin:0;font-size:18px;font-weight:800;letter-spacing:-0.02em;">
                  Verify your sign-in
                </p>
                <p style="margin:10px 0 0 0;font-size:14px;line-height:22px;color:${brand.slate700};">
                  Use the code below to continue. This code expires in <strong>${expiresMinutes} minutes</strong>.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:18px;">
                <div style="border-left:4px solid ${brand.teal600};background:${brand.slate50};padding:18px;">
                  <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${brand.slate700};">
                    Verification code
                  </p>
                  <p style="margin:10px 0 0 0;font-size:28px;font-weight:900;letter-spacing:0.22em;color:${brand.slate950};">
                    ${code}
                  </p>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:0 18px 18px 18px;">
                <p style="margin:0;font-size:13px;line-height:20px;color:${brand.slate700};">
                  Requested for <strong>${escapeHtml(recipientEmail)}</strong>.
                  If you didn’t request this, you can ignore this email.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:12px 18px;border-top:1px solid ${brand.slate200};background:#ffffff;">
                <p style="margin:0;font-size:12px;line-height:18px;color:${brand.slate700};">
                  For security: never share this code. ${brand.appName} support will never ask for it.
                </p>
              </td>
            </tr>

            <tr>
              <td style="height:6px;background:${brand.teal600};"></td>
            </tr>
          </table>

          <p style="margin:12px 0 0 0;font-size:12px;color:${brand.slate700};">
            Sent by ${brand.appName}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${brand.appName} verification code: ${code} (expires in ${expiresMinutes} minutes)`;

  return { subject, html, text };
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


