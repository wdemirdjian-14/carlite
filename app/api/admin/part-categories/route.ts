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

export async function GET() {
  try {
    const cats = await prisma.partCategory.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] });
    return NextResponse.json(cats);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    const body = await request?.json?.();
    const { name, description, order, isAccessory } = body ?? {};
    if (!name?.trim()) return NextResponse.json({ error: 'Nom obligatoire' }, { status: 400 });
    const slug = (name as string).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now().toString(36);
    const cat = await prisma.partCategory.create({
      data: {
        name: name.trim(),
        slug,
        description: description ?? '',
        order: parseInt(order) || 0,
        isAccessory: !!isAccessory,
      },
    });
    return NextResponse.json(cat, { status: 201 });
  } catch (error: any) {
    console.error('Create part category error:', error);
    return NextResponse.json({ error: error?.message ?? 'Erreur' }, { status: 500 });
  }
}
