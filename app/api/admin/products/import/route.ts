export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdmin } from '@/lib/admin-session';
import { computeChanges, readSheet } from '@/lib/product-sheet';

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Import d'un listing produits (multipart : file + mode).
 *  - mode=preview : renvoie les changements détectés, sans rien modifier ;
 *  - mode=apply   : applique les changements (transaction) et les enregistre dans l'historique.
 * Le fichier est relu à l'application : ce qui est appliqué correspond à l'état actuel de la base.
 */
export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  try {
    const form = await request.formData();
    const file = form.get('file');
    const mode = form.get('mode') === 'apply' ? 'apply' : 'preview';
    if (!(file instanceof File)) return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Fichier trop lourd (5 Mo max.)' }, { status: 413 });

    const rows = await readSheet(file.name, Buffer.from(await file.arrayBuffer()));
    const products = await prisma.accessory.findMany({
      select: { id: true, name: true, slug: true, category: true, published: true, quantity: true, purchasePrice: true, price: true, stockStatus: true },
    });
    const result = computeChanges(rows, new Map(products.map((p) => [p.id, p])));

    if (mode === 'preview' || result.changes.length === 0) {
      return NextResponse.json({ mode: 'preview', fileName: file.name, ...result });
    }

    const log = await prisma.$transaction(async (tx) => {
      for (const c of result.changes) {
        await tx.accessory.update({ where: { id: c.id }, data: c.after });
      }
      return tx.productImport.create({
        data: {
          fileName: file.name.slice(0, 200),
          authorName: admin.name,
          authorEmail: admin.email,
          rowsRead: result.read,
          rowsChanged: result.changes.length,
          changes: result.changes as any,
        },
      });
    });
    return NextResponse.json({ mode: 'apply', importId: log.id, fileName: file.name, ...result });
  } catch (e: any) {
    console.error('Import produits :', e);
    return NextResponse.json({ error: e?.message || 'Import impossible' }, { status: 400 });
  }
}

// Historique des imports (les 30 derniers)
export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  const imports = await prisma.productImport.findMany({ orderBy: { createdAt: 'desc' }, take: 30 });
  return NextResponse.json(imports);
}
