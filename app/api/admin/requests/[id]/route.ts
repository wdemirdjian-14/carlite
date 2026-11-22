export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    const body = await request?.json?.();
    const status = body?.status ?? 'treated';
    const updated = await prisma.testDriveRequest.update({
      where: { id: params?.id },
      data: { status },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
