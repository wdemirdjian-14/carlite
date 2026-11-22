export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session?.user as any)?.role !== 'admin') return null;
  return session;
}

export async function POST(request: Request) {
  try {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    const body = await request?.json?.();
    const { categoryId, name, priceModifier, description, imageUrl, colorHex, active } = body ?? {};
    if (!name?.trim() || !categoryId) return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    const count = await prisma.configOption.count({ where: { categoryId } });
    const opt = await prisma.configOption.create({
      data: {
        categoryId,
        name: name.trim(),
        priceModifier: parseFloat(priceModifier) || 0,
        description: description ?? '',
        imageUrl: imageUrl ?? '',
        colorHex: colorHex ?? '',
        active: active === undefined ? true : !!active,
        order: typeof body?.order === 'number' ? body.order : count,
      },
    });
    return NextResponse.json(opt, { status: 201 });
  } catch (error: any) {
    console.error('Create config option error:', error);
    return NextResponse.json({ error: error?.message ?? 'Erreur' }, { status: 500 });
  }
}
