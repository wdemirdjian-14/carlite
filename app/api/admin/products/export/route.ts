export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdmin } from '@/lib/admin-session';
import { buildCsv, buildXlsx } from '@/lib/product-sheet';

// Export du listing des pièces détachées (toutes, publiées ou non) : ?format=xlsx (défaut) ou csv
export async function GET(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  const format = new URL(request.url).searchParams.get('format') === 'csv' ? 'csv' : 'xlsx';
  const products = await prisma.accessory.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, slug: true, category: true, published: true, quantity: true, purchasePrice: true, price: true, stockStatus: true },
  });
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '').replace(/^(\d{8})(\d{4})$/, '$1-$2');
  const name = `carlite-produits-${stamp}.${format}`;
  const body = format === 'csv' ? buildCsv(products) : await buildXlsx(products);
  return new Response(body as any, {
    headers: {
      'Content-Type': format === 'csv' ? 'text/csv; charset=utf-8' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'no-store',
    },
  });
}
