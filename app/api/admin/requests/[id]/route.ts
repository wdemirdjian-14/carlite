export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdmin } from '@/lib/admin-session';
import { isRequestStatus, statusLabel } from '@/lib/requests';

// Changement de statut d'une demande, consigné dans son journal (qui, quand, avant → après).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  try {
    const body = await request.json().catch(() => ({}));
    const status = body?.status;
    if (!isRequestStatus(status)) return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });

    const current = await prisma.testDriveRequest.findUnique({ where: { id: params.id }, select: { status: true } });
    if (!current) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    if (current.status === status) {
      const same = await prisma.testDriveRequest.findUnique({ where: { id: params.id }, include: { notes: { orderBy: { createdAt: 'asc' } } } });
      return NextResponse.json(same);
    }

    const [, updated] = await prisma.$transaction([
      prisma.requestNote.create({
        data: {
          requestId: params.id,
          kind: 'status',
          content: `Statut : ${statusLabel(current.status)} → ${statusLabel(status)}`,
          authorId: admin.id,
          authorName: admin.name,
          authorEmail: admin.email,
        },
      }),
      prisma.testDriveRequest.update({
        where: { id: params.id },
        data: {
          status,
          archivedAt: status === 'archived' ? new Date() : null,
          archivedBy: status === 'archived' ? admin.email : null,
        },
        include: { notes: { orderBy: { createdAt: 'asc' } } },
      }),
    ]);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Request status error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
