export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    const body = await request?.json?.();
    const { name, slug, description, category, basePrice, imageUrl, range, topSpeed, battery, chargeTime, ...rest } = body ?? {};
    if (!name?.trim() || !slug?.trim() || !description?.trim() || !category?.trim()) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }
    const vehicle = await prisma.vehicle.create({
      data: {
        name: name?.trim(),
        slug: slug?.trim()?.toLowerCase()?.replace(/\s+/g, '-'),
        description: description?.trim(),
        category: category?.trim(),
        basePrice: parseFloat(basePrice) || 0,
        imageUrl: imageUrl ?? '/images/placeholder.jpg',
        range: parseInt(range) || 0,
        topSpeed: parseInt(topSpeed) || 0,
        battery: battery ?? '',
        chargeTime: chargeTime ?? '',
        tagline: rest?.tagline ?? null,
        permitType: rest?.permitType ?? 'Sans permis',
        motorPower: rest?.motorPower ?? '',
        seats: parseInt(rest?.seats) || 2,
        weight: parseInt(rest?.weight) || 700,
        dimensions: rest?.dimensions ?? '',
        warranty: rest?.warranty ?? '2 ans',
        featured: !!rest?.featured,
        available: rest?.available !== false,
        published: rest?.published !== false,
        hasConfigurator: !!rest?.hasConfigurator,
        configIntro: rest?.configIntro ?? null,
        montageAvailable: !!rest?.montageAvailable,
        montagePrice: parseFloat(rest?.montagePrice) || 0,
        montageLabel: rest?.montageLabel ?? 'Montage chez un partenaire',
        stockStatus: rest?.stockStatus ?? 'available',
        keepVisible: rest?.keepVisible !== false,
      },
    });
    return NextResponse.json(vehicle, { status: 201 });
  } catch (error: any) {
    console.error('Create vehicle error:', error);
    return NextResponse.json({ error: error?.message ?? 'Erreur' }, { status: 500 });
  }
}
