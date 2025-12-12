import { mailer } from '@/lib/email/mailer';
import { buildOtpEmailHtml } from '@/lib/email/templates/otp-email';
import { env } from '@/lib/env';

export async function sendOtpEmail(params: {
  to: string;
  code: string;
  expiresMinutes: number;
}) {
  const { to, code, expiresMinutes } = params;
  const { subject, html, text } = buildOtpEmailHtml({
    code,
    recipientEmail: to,
    expiresMinutes,
  });

  await mailer.sendMail({
    from: `"HealthCare" <${env.GMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}
