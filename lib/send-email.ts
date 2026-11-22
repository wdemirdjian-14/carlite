import nodemailer from 'nodemailer';

// Envoi d'emails via SMTP (OVH, Gmail Workspace, Brevo, Mailjet, etc.).
// Variables : SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_FROM.
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!process.env.SMTP_HOST) {
    console.error('SMTP_HOST non configuré : email non envoyé');
    return { success: false, error: 'SMTP not configured' };
  }
  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || `CARLITE <${process.env.SMTP_USER}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo || undefined,
    });
    return { success: true };
  } catch (e: any) {
    console.error('Email send error:', e?.message);
    return { success: false, error: e?.message };
  }
}
