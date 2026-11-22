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
    if (body?.title !== undefined) data.title = String(body.title).trim();
    if (body?.discountedPrice !== undefined) data.discountedPrice = parseFloat(body.discountedPrice) || 0;
    if (body?.badge !== undefined) data.badge = String(body.badge).trim() || 'Offre spéciale';
    if (body?.description !== undefined) data.description = body.description ?? '';
    if (body?.active !== undefined) data.active = !!body.active;
    if (body?.featured !== undefined) data.featured = !!body.featured;
    if (body?.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body?.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;
    if (typeof body?.target === 'string' && body.target.includes(':')) {
      const [t, id] = body.target.split(':');
      data.targetType = t;
      data.vehicleId = t === 'vehicle' ? id : null;
      data.accessoryId = t === 'accessory' ? id : null;
      data.usedVehicleId = t === 'used' ? id : null;
    }
    const updated = await prisma.promotion.update({ where: { id: params?.id }, data });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update promotion error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    await prisma.promotion.delete({ where: { id: params?.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete promotion error:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
