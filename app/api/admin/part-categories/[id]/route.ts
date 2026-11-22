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
    if (body?.description !== undefined) data.description = body.description;
    if (body?.order !== undefined) data.order = parseInt(body.order) || 0;
    if (body?.isAccessory !== undefined) data.isAccessory = !!body.isAccessory;
    const updated = await prisma.partCategory.update({ where: { id: params?.id }, data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    await prisma.partCategory.delete({ where: { id: params?.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
