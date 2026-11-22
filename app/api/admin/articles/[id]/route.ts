import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session?.user as any)?.role !== 'admin') return null;
  return session;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const data = await req.json();
    const updated = await prisma.article.update({ where: { id: params.id }, data });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Erreur' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    await prisma.article.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Delete article error:', err);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
