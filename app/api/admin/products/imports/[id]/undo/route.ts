export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdmin } from '@/lib/admin-session';
import type { Change } from '@/lib/product-sheet';

/**
 * Annule un import : chaque produit reprend ses valeurs d'avant l'import, SAUF s'il a été modifié
 * depuis (sa valeur actuelle n'est plus celle posée par l'import) — il est alors laissé tel quel et signalé.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  const imp = await prisma.productImport.findUnique({ where: { id: params.id } });
  if (!imp) return NextResponse.json({ error: 'Import introuvable' }, { status: 404 });
  if (imp.undoneAt) return NextResponse.json({ error: 'Cet import a déjà été annulé' }, { status: 409 });

  const changes = (imp.changes as unknown as Change[]) ?? [];
  const restored: string[] = [];
  const skipped: string[] = [];
  await prisma.$transaction(async (tx) => {
    for (const c of changes) {
      const cur = await tx.accessory.findUnique({
        where: { id: c.id },
        select: { quantity: true, purchasePrice: true, price: true, stockStatus: true },
      });
      if (!cur) {
        skipped.push(`${c.name} (supprimé)`);
        continue;
      }
      const untouched = c.fields.every((f) => (cur as any)[f] === (c.after as any)[f]);
      if (!untouched) {
        skipped.push(`${c.name} (modifié depuis l'import)`);
        continue;
      }
      const data: Record<string, unknown> = {};
      c.fields.forEach((f) => (data[f] = (c.before as any)[f]));
      await tx.accessory.update({ where: { id: c.id }, data });
      restored.push(c.name);
    }
    await tx.productImport.update({ where: { id: imp.id }, data: { undoneAt: new Date(), undoneBy: admin.email } });
  });
  return NextResponse.json({ restored: restored.length, skipped });
}
