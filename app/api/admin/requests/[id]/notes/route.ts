export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdmin } from '@/lib/admin-session';

// Ajout d'une note de suivi, datée et signée par l'admin connecté. Les notes ne sont ni modifiables ni supprimables.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  try {
    const body = await request.json().catch(() => ({}));
    const content = String(body?.content ?? '').trim();
    if (!content) return NextResponse.json({ error: 'Note vide' }, { status: 400 });
    if (content.length > 5000) return NextResponse.json({ error: 'Note trop longue (5000 caractères max.)' }, { status: 400 });

    const exists = await prisma.testDriveRequest.findUnique({ where: { id: params.id }, select: { id: true, status: true } });
    if (!exists) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });

    const note = await prisma.requestNote.create({
      data: { requestId: params.id, kind: 'note', content, authorId: admin.id, authorName: admin.name, authorEmail: admin.email },
    });
    // Une demande « À traiter » qui reçoit une note passe automatiquement « En cours » (consigné dans le journal)
    let status = exists.status;
    if (exists.status === 'pending') {
      await prisma.$transaction([
        prisma.testDriveRequest.update({ where: { id: params.id }, data: { status: 'in_progress' } }),
        prisma.requestNote.create({
          data: { requestId: params.id, kind: 'status', content: 'Statut : À traiter → En cours (première note)', authorId: admin.id, authorName: admin.name, authorEmail: admin.email },
        }),
      ]);
      status = 'in_progress';
    }
    const notes = await prisma.requestNote.findMany({ where: { requestId: params.id }, orderBy: { createdAt: 'asc' } });
    return NextResponse.json({ note, notes, status });
  } catch (error) {
    console.error('Request note error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
