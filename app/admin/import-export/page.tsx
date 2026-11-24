import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ImportExport } from './_components/import-export';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Import / export produits' };

export default async function ImportExportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') redirect('/login');
  let imports: any[] = [];
  let stats = { total: 0, withPurchase: 0, onRequest: 0 };
  try {
    const [list, total, withPurchase, onRequest] = await Promise.all([
      prisma.productImport.findMany({ orderBy: { createdAt: 'desc' }, take: 30 }),
      prisma.accessory.count(),
      prisma.accessory.count({ where: { purchasePrice: { not: null } } }),
      prisma.accessory.count({ where: { price: { lte: 0 } } }),
    ]);
    imports = list;
    stats = { total, withPurchase, onRequest };
  } catch {}
  return <ImportExport initialImports={JSON.parse(JSON.stringify(imports))} stats={stats} />;
}
