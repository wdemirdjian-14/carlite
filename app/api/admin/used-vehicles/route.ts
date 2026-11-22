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
    const { name, slug, description, price, originalPrice, year, mileage, range, battery, color, condition, imageUrl, available, seats, homologation, permitType, features, gallery, featured } = body ?? {};
    if (!name?.trim() || !slug?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }
    const usedVehicle = await prisma.usedVehicle.create({
      data: {
        name: name?.trim(),
        slug: slug?.trim()?.toLowerCase()?.replace(/\s+/g, '-'),
        description: description?.trim(),
        price: parseFloat(price) || 0,
        originalPrice: parseFloat(originalPrice) || 0,
        year: parseInt(year) || new Date().getFullYear(),
        mileage: parseInt(mileage) || 0,
        range: parseInt(range) || 0,
        battery: battery ?? '',
        color: color ?? '',
        condition: condition ?? 'Bon état',
        imageUrl: imageUrl ?? '/images/placeholder.jpg',
        seats: parseInt(seats) || 2,
        homologation: homologation ?? '',
        permitType: permitType ?? '',
        features: Array.isArray(features) ? features : [],
        gallery: Array.isArray(gallery) ? gallery : [],
        featured: !!featured,
        available: available !== false,
        published: body?.published !== false,
        stockStatus: body?.stockStatus ?? 'available',
        keepVisible: body?.keepVisible !== false,
      },
    });
    return NextResponse.json(usedVehicle, { status: 201 });
  } catch (error: any) {
    console.error('Create used vehicle error:', error);
    return NextResponse.json({ error: error?.message ?? 'Erreur' }, { status: 500 });
  }
}
