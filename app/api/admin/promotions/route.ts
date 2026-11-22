export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function parseTarget(body: any) {
  // Accept either explicit targetType+ids, or a combined "type:id" target string
  let targetType = body?.targetType ?? 'vehicle';
  let vehicleId: string | null = body?.vehicleId ?? null;
  let accessoryId: string | null = body?.accessoryId ?? null;
  let usedVehicleId: string | null = body?.usedVehicleId ?? null;
  if (typeof body?.target === 'string' && body.target.includes(':')) {
    const [t, id] = body.target.split(':');
    targetType = t;
    vehicleId = t === 'vehicle' ? id : null;
    accessoryId = t === 'accessory' ? id : null;
    usedVehicleId = t === 'used' ? id : null;
  }
  return { targetType, vehicleId, accessoryId, usedVehicleId };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    const promotions = await prisma.promotion.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(promotions);
  } catch (error: any) {
    console.error('List promotions error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    const body = await request?.json?.();
    const { title, discountedPrice, badge, description, active, featured, startDate, endDate } = body ?? {};
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Le titre est obligatoire' }, { status: 400 });
    }
    const { targetType, vehicleId, accessoryId, usedVehicleId } = parseTarget(body);
    const promotion = await prisma.promotion.create({
      data: {
        title: title?.trim(),
        targetType,
        vehicleId,
        accessoryId,
        usedVehicleId,
        discountedPrice: parseFloat(discountedPrice) || 0,
        badge: badge?.trim() || 'Offre spéciale',
        description: description ?? '',
        active: active !== false,
        featured: !!featured,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });
    return NextResponse.json(promotion, { status: 201 });
  } catch (error: any) {
    console.error('Create promotion error:', error);
    return NextResponse.json({ error: error?.message ?? 'Erreur' }, { status: 500 });
  }
}
