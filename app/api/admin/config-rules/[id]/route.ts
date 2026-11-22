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

const VALID = ['requires', 'incompatible', 'show', 'hide'];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    const body = await request?.json?.();
    const data: Record<string, any> = {};
    if (body?.ruleType !== undefined && VALID.includes(body.ruleType)) data.ruleType = body.ruleType;
    if (body?.triggerOptionId !== undefined) data.triggerOptionId = body.triggerOptionId;
    if (body?.targetOptionId !== undefined) data.targetOptionId = body.targetOptionId;
    if (body?.message !== undefined) data.message = body.message;
    const updated = await prisma.configRule.update({ where: { id: params?.id }, data });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update config rule error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    await prisma.configRule.delete({ where: { id: params?.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
