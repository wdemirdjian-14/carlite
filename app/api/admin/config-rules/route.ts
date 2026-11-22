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

export async function POST(request: Request) {
  try {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    const body = await request?.json?.();
    const { vehicleId, ruleType, triggerOptionId, targetOptionId, message } = body ?? {};
    if (!vehicleId || !triggerOptionId || !targetOptionId) return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    const rule = await prisma.configRule.create({
      data: {
        vehicleId,
        ruleType: VALID.includes(ruleType) ? ruleType : 'incompatible',
        triggerOptionId,
        targetOptionId,
        message: message ?? '',
      },
    });
    return NextResponse.json(rule, { status: 201 });
  } catch (error: any) {
    console.error('Create config rule error:', error);
    return NextResponse.json({ error: error?.message ?? 'Erreur' }, { status: 500 });
  }
}
