export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, escapeHtml } from '@/lib/send-email';

export async function POST(request: Request) {
  try {
    const body = await request?.json?.();
    const {
      firstName,
      lastName,
      phone,
      email,
      type,
      subject,
      context,
      productName,
    } = body ?? {};

    const leadType = type === 'quote' ? 'quote' : 'information';

    if (!firstName?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Veuillez renseigner au minimum votre nom et votre téléphone.' },
        { status: 400 }
      );
    }

    const fullMessage = [
      productName ? `Produit / véhicule : ${productName}` : '',
      context ? `\n${context}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    await prisma.testDriveRequest.create({
      data: {
        firstName: firstName?.trim() ?? '',
        lastName: lastName?.trim() ?? '',
        email: email?.trim() ?? '',
        phone: phone?.trim() ?? '',
        type: leadType,
        vehicleName: productName?.trim() || null,
        message: fullMessage || (leadType === 'quote' ? 'Demande de devis' : 'Demande de renseignement'),
      },
    });

    const isQuote = leadType === 'quote';
    const heading = isQuote ? '📝 Nouvelle demande de devis' : 'ℹ️ Demande de renseignement produit';
    const contextHtml = (context ?? '')
      .split('\n')
      .filter((l: string) => l.trim())
      .map((l: string) => `<div style="padding:2px 0;color:#111827;font-size:14px;">${escapeHtml(l)}</div>`)
      .join('');

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h2 style="color: #4ade80; margin: 0; font-size: 22px;">${heading}</h2>
          <p style="color: #d1d5db; margin: 8px 0 0; font-size: 14px;">${productName ? escapeHtml(productName) : 'Site CARLITE'}</p>
        </div>
        <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom:16px;">
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 130px;">Nom</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${escapeHtml(firstName)} ${escapeHtml(lastName)}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Téléphone</td><td style="padding: 8px 0;"><a href="tel:${escapeHtml(phone)}" style="color: #16a34a; text-decoration: none; font-weight: 600;">${escapeHtml(phone)}</a></td></tr>
            ${email ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td><td style="padding: 8px 0;"><a href="mailto:${escapeHtml(email)}" style="color: #16a34a; text-decoration: none; font-weight: 600;">${escapeHtml(email)}</a></td></tr>` : ''}
          </table>
          ${contextHtml ? `<div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:14px;"><div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">Détails</div>${contextHtml}</div>` : ''}
        </div>
        <p style="color: #9ca3af; font-size: 11px; margin-top: 16px; text-align: center;">Envoyé depuis le site CARLITE</p>
      </div>
    `;

    const result = await sendEmail({
      to: process.env.EMAIL_TO_LEADS || 'wd@carlite.fr',
      subject: subject || (isQuote ? `[CARLITE] Demande de devis` : `[CARLITE] Demande de renseignement`),
      html: htmlBody,
      replyTo: email || undefined,
    });

    if (!result.success) {
      console.error('Lead email send failed:', result);
    }

    return NextResponse.json({
      success: true,
      message: isQuote
        ? 'Votre demande de devis a bien été envoyée. Nous revenons vers vous rapidement.'
        : 'Votre demande a bien été envoyée. Nous vous recontactons rapidement.',
    });
  } catch (error: any) {
    console.error('Lead error:', error);
    return NextResponse.json({ success: false, message: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 });
  }
}
