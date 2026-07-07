import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { to, subject, html, text, secret, isNotification, attachments } = await req.json();

    // Verify secret to prevent abuse
    if (secret !== (process.env.EMAIL_API_SECRET || 'PROLINK_INTERNAL_SECRET_888')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use notification account for notifications, verify account for transactional (verification, password reset)
    const useNotificationAccount = isNotification === true;
    const smtpUser = useNotificationAccount
      ? process.env.SMTP_NOTIFICATIONS_USER
      : process.env.SMTP_USER;
    const smtpPass = useNotificationAccount
      ? (process.env.SMTP_NOTIFICATIONS_PASS || 'tmibuibxgiekzael')
      : (process.env.SMTP_PASS || 'aacjcuqkwdtnyccg');

    if (!smtpUser || !smtpPass) {
      throw new Error('SMTP credentials are not configured in environment variables.');
    }

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
      attachments,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('[Vercel Email API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
