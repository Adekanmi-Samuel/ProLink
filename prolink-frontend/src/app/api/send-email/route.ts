import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { to, subject, html, text, secret, isNotification } = await req.json();

    // Verify secret to prevent abuse
    if (secret !== 'PROLINK_INTERNAL_SECRET_888') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use notification account for notifications, verify account for transactional (verification, password reset)
    const useNotificationAccount = isNotification === true;
    const smtpUser = useNotificationAccount
      ? (process.env.SMTP_NOTIFICATIONS_USER || 'prolink.notifications@gmail.com')
      : (process.env.SMTP_USER || 'prolink.verify@gmail.com');
    const smtpPass = useNotificationAccount
      ? (process.env.SMTP_NOTIFICATIONS_PASS || 'tmibuibxgiekzael')
      : (process.env.SMTP_PASS || 'aacjcuqkwdtnyccg');

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 10000,
    });

    const info = await transporter.sendMail({
      from: `"ProLink" <${smtpUser}>`,
      to,
      subject,
      text,
      html,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('[Vercel Email API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
