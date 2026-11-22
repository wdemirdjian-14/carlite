import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { QuickStock } from './_components/quick-stock';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Stock rapide' };

export default async function StockRapidePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session?.user as any)?.role !== 'admin') redirect('/login');

  let categories: any[] = [];
  try {
    categories = await prisma.partCategory.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true },
    });
  } catch {}

  return <QuickStock categories={JSON.parse(JSON.stringify(categories ?? []))} />;
}
