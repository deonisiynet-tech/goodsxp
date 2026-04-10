import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const APP_NAME = 'GoodsXP';

/**
 * Надіслати лист для відновлення пароля
 */
export async function sendResetPasswordEmail(email: string, resetToken: string): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  const { error } = await resend.emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: `Відновлення пароля — ${APP_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Відновлення пароля</title>
      </head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f4f4f5;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding:32px 32px 0;text-align:center;">
                    <h1 style="margin:0;font-size:24px;font-weight:600;color:#18181b;">🔐 Відновлення пароля</h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:24px 32px;">
                    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3f3f46;">
                      Ви запросили відновлення пароля для вашого облікового запису <strong>${APP_NAME}</strong>.
                    </p>
                    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#3f3f46;">
                      Натисніть на кнопку нижче, щоб скинути пароль:
                    </p>
                    <!-- CTA Button -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:8px 0 32px;">
                          <a href="${resetLink}"
                             style="display:inline-block;padding:14px 32px;background-color:#7c3aed;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;border-radius:8px;">
                            Скинути пароль
                          </a>
                        </td>
                      </tr>
                    </table>
                    <!-- Fallback link -->
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#71717a;">
                      Якщо кнопка не працює, скопіюйте це посилання у браузер:<br>
                      <a href="${resetLink}" style="color:#7c3aed;word-break:break-all;">${resetLink}</a>
                    </p>
                    <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#71717a;">
                      ⏰ Це посилання дійсне <strong>15 хвилин</strong>.<br>
                      Якщо ви не запитували скидання пароля — проігноруйте цей лист.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding:24px 32px 32px;text-align:center;border-top:1px solid #e4e4e7;">
                    <p style="margin:0;font-size:12px;color:#a1a1aa;">
                      © ${new Date().getFullYear()} ${APP_NAME}. Усі права захищені.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
Відновлення пароля — ${APP_NAME}

Ви запросили відновлення пароля.

Натисніть на посилання нижче, щоб скинути пароль:

${resetLink}

Це посилання дійсне 15 хвилин.
Якщо ви не запитували скидання пароля — проігноруйте цей лист.

© ${new Date().getFullYear()} ${APP_NAME}
    `.trim(),
  });

  if (error) {
    console.error('❌ Resend error:', error);
    throw new Error(`Не вдалося надіслати email: ${error.message}`);
  }

  console.log(`✅ Email відправлено на ${email}`);
}
