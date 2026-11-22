export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/send-email';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { nom, prenom, email, telephone, description } = data ?? {};

    if (!nom?.trim() || !prenom?.trim() || !email?.trim() || !telephone?.trim()) {
      return NextResponse.json({ success: false, message: 'Veuillez remplir tous les champs obligatoires.' }, { status: 400 });
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h2 style="color: #4ade80; margin: 0; font-size: 22px;">⚡ Nouvelle demande de contact expert</h2>
          <p style="color: #d1d5db; margin: 8px 0 0; font-size: 14px;">Un visiteur souhaite discuter d'un projet de véhicule électrique</p>
        </div>
        <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-size: 14px; width: 120px; vertical-align: top;">Nom</td>
              <td style="padding: 10px 0; color: #111827; font-size: 14px; font-weight: 600;">${nom ?? ''}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-size: 14px; vertical-align: top;">Prénom</td>
              <td style="padding: 10px 0; color: #111827; font-size: 14px; font-weight: 600;">${prenom ?? ''}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-size: 14px; vertical-align: top;">Email</td>
              <td style="padding: 10px 0; color: #111827; font-size: 14px;"><a href="mailto:${email ?? ''}" style="color: #16a34a; text-decoration: none;">${email ?? ''}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-size: 14px; vertical-align: top;">Téléphone</td>
              <td style="padding: 10px 0; color: #111827; font-size: 14px;"><a href="tel:${telephone ?? ''}" style="color: #16a34a; text-decoration: none;">${telephone ?? ''}</a></td>
            </tr>
            ${(description?.trim?.()) ? `
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-size: 14px; vertical-align: top;">Projet</td>
              <td style="padding: 10px 0; color: #111827; font-size: 14px;">
                <div style="background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #16a34a;">
                  ${description}
                </div>
              </td>
            </tr>
            ` : ''}
          </table>
        </div>
        <p style="color: #9ca3af; font-size: 11px; margin-top: 16px; text-align: center;">
          Envoyé depuis le site CARLITE le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    `;

    const result = await sendEmail({
      to: process.env.EMAIL_TO_CONTACT || 'contact@carlite.fr',
      subject: `[CARLITE] Demande de contact expert - ${prenom ?? ''} ${nom ?? ''}`,
      html: htmlBody,
      replyTo: email,
    });

    if (!result.success) {
      console.error('Email send failed:', result);
      return NextResponse.json({ success: false, message: 'Erreur lors de l\'envoi. Veuillez réessayer.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Votre demande a bien été envoyée. Un expert vous contactera rapidement.' });
  } catch (error: any) {
    console.error('Contact expert error:', error);
    return NextResponse.json({ success: false, message: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 });
  }
}
