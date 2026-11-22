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
    const updated = await prisma.usedVehicle.update({
      where: { id: params?.id },
      data: body ?? {},
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    await prisma.usedVehicle.delete({ where: { id: params?.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete used vehicle error:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
