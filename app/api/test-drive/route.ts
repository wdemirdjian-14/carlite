export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request?.json?.();
    const { firstName, lastName, email, phone, vehicleId, vehicleName, message, type } = body ?? {};
    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }
    const req = await prisma.testDriveRequest.create({
      data: {
        firstName: firstName ?? '',
        lastName: lastName ?? '',
        email: email ?? '',
        phone: phone ?? '',
        vehicleId: vehicleId ?? null,
        vehicleName: vehicleName ?? null,
        message: message ?? null,
        type: type ?? 'test_drive',
      },
    });
    return NextResponse.json({ id: req?.id, message: 'Demande enregistrée avec succès' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur lors de l\'enregistrement' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const requests = await prisma.testDriveRequest.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(requests ?? []);
  } catch {
    return NextResponse.json([]);
  }
}
