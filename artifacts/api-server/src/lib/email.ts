import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

export function isEmailConfigured() {
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

if (!isEmailConfigured()) {
  console.warn(
    "\n⚠️  SMTP не настроен! Письма не будут отправляться.\n" +
    "   Добавьте секреты: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS\n"
  );
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST ?? "smtp.gmail.com",
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

const FROM = process.env.SMTP_FROM ?? `"English Learning" <${SMTP_USER}>`;
const APP_URL = process.env.APP_URL ?? `https://${process.env.REPLIT_DEV_DOMAIN}`;

export async function sendVerificationCode(to: string, code: string) {
  if (!isEmailConfigured()) {
    console.error(`[EMAIL] SMTP не настроен. Код ${code} для ${to} НЕ отправлен.`);
    return;
  }
  try {
    await transporter.sendMail({
      from: FROM,
      to,
      subject: `${code} — ваш код подтверждения English Learning`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#7c3aed;margin-bottom:8px">Подтвердите регистрацию</h2>
          <p style="color:#444;margin-bottom:24px">
            Вы создали аккаунт в приложении <strong>English Learning</strong>.<br>
            Введите этот код в приложении для подтверждения:
          </p>
          <div style="background:#f5f3ff;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px">
            <span style="font-size:42px;font-weight:900;letter-spacing:10px;color:#7c3aed">${code}</span>
          </div>
          <p style="color:#888;font-size:13px">Код действителен 15 минут. Если вы не регистрировались — просто проигнорируйте это письмо.</p>
        </div>
      `,
    });
    console.log(`[EMAIL] Код отправлен на ${to}`);
  } catch (err) {
    console.error(`[EMAIL] Ошибка отправки на ${to}:`, err);
  }
}

export async function sendPasswordResetEmail(to: string, token: string) {
  if (!isEmailConfigured()) {
    console.error(`[EMAIL] SMTP не настроен. Письмо сброса пароля для ${to} НЕ отправлено.`);
    return;
  }
  const link = `${APP_URL}/reset-password?token=${token}`;
  try {
    await transporter.sendMail({
      from: FROM,
      to,
      subject: "Сброс пароля — English Learning",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#7c3aed">Сброс пароля</h2>
          <p>Мы получили запрос на сброс пароля для вашего аккаунта в <strong>English Learning</strong>.</p>
          <p>Нажмите кнопку ниже, чтобы задать новый пароль:</p>
          <a href="${link}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;margin:16px 0">
            Сбросить пароль
          </a>
          <p style="color:#888;font-size:13px">Ссылка действительна 1 час.</p>
        </div>
      `,
    });
    console.log(`[EMAIL] Письмо сброса пароля отправлено на ${to}`);
  } catch (err) {
    console.error(`[EMAIL] Ошибка отправки сброса на ${to}:`, err);
  }
}
