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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    const body = await request?.json?.();
    const data: Record<string, any> = {};
    if (body?.name !== undefined) data.name = String(body.name).trim();
    if (body?.icon !== undefined) data.icon = body.icon;
    if (body?.description !== undefined) data.description = body.description;
    if (body?.selectionType !== undefined && ['radio', 'checkbox', 'dropdown'].includes(body.selectionType)) data.selectionType = body.selectionType;
    if (body?.required !== undefined) data.required = !!body.required;
    if (body?.order !== undefined) data.order = parseInt(body.order) || 0;
    const updated = await prisma.configCategory.update({
      where: { id: params?.id },
      data,
      include: { options: { orderBy: { order: 'asc' } } },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update config category error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    await prisma.configCategory.delete({ where: { id: params?.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
