export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/send-email';

export async function POST(request: Request) {
  try {
    const body = await request?.json?.();
    const { prenom, telephone } = body ?? {};

    if (!prenom?.trim() || !telephone?.trim()) {
      return NextResponse.json({ success: false, message: 'Veuillez remplir tous les champs.' }, { status: 400 });
    }

    // Save to DB as a callback request
    await prisma.testDriveRequest.create({
      data: {
        firstName: prenom?.trim(),
        lastName: '',
        email: '',
        phone: telephone?.trim(),
        type: 'callback',
        message: 'Demande de rappel téléphonique',
      },
    });

    // Send email notification to wd@carlite.fr
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h2 style="color: #4ade80; margin: 0; font-size: 22px;">📞 Demande de rappel téléphonique</h2>
          <p style="color: #d1d5db; margin: 8px 0 0; font-size: 14px;">Un visiteur souhaite être rappelé</p>
        </div>
        <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-size: 14px; width: 120px;">Prénom</td>
              <td style="padding: 10px 0; color: #111827; font-size: 14px; font-weight: 600;">${prenom ?? ''}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Téléphone</td>
              <td style="padding: 10px 0; color: #111827; font-size: 14px;"><a href="tel:${telephone ?? ''}" style="color: #16a34a; text-decoration: none; font-weight: 600;">${telephone ?? ''}</a></td>
            </tr>
          </table>
        </div>
        <p style="color: #9ca3af; font-size: 11px; margin-top: 16px; text-align: center;">
          Envoyé depuis le site CARLITE
        </p>
      </div>
    `;

    const result = await sendEmail({
      to: process.env.EMAIL_TO_LEADS || 'wd@carlite.fr',
      subject: `[CARLITE] Demande de rappel - ${prenom ?? ''}`,
      html: htmlBody,
    });

    if (!result.success) {
      console.error('Callback email send failed:', result);
    }

    return NextResponse.json({ success: true, message: 'Votre demande de rappel a bien été enregistrée. Nous vous rappellerons rapidement.' });
  } catch (error: any) {
    console.error('Callback error:', error);
    return NextResponse.json({ success: false, message: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 });
  }
}
