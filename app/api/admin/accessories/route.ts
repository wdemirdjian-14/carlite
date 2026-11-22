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
    const { name, slug, description, price, category, imageUrl, inStock, gallery, compatibleVehicleIds, compatibleUsedVehicleIds } = body ?? {};
    const quantity = Number.isFinite(parseInt(body?.quantity)) ? Math.max(0, parseInt(body?.quantity)) : 0;
    const derivedStock = body?.stockStatus ?? (quantity > 0 ? 'available' : 'out_of_stock');
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Le nom est obligatoire' }, { status: 400 });
    }
    const cleanSlug = (input: string) => input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const finalSlug = slug?.trim()
      ? cleanSlug(slug.trim())
      : `${cleanSlug(name.trim()) || 'produit'}-${Date.now().toString(36)}`;
    const accessory = await prisma.accessory.create({
      data: {
        name: name?.trim(),
        slug: finalSlug,
        description: (description?.trim() || name.trim()),
        price: parseFloat(price) || 0,
        category: category ?? 'Général',
        imageUrl: imageUrl ?? '/images/placeholder.jpg',
        gallery: Array.isArray(gallery) ? gallery : [],
        compatibleVehicleIds: Array.isArray(compatibleVehicleIds) ? compatibleVehicleIds : [],
        compatibleUsedVehicleIds: Array.isArray(compatibleUsedVehicleIds) ? compatibleUsedVehicleIds : [],
        inStock: inStock !== false,
        published: body?.published !== false,
        stockStatus: derivedStock,
        quantity,
        keepVisible: body?.keepVisible !== false,
      },
    });
    return NextResponse.json(accessory, { status: 201 });
  } catch (error: any) {
    console.error('Create accessory error:', error);
    return NextResponse.json({ error: error?.message ?? 'Erreur' }, { status: 500 });
  }
}
