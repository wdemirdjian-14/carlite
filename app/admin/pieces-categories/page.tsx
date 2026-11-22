import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdminPartCategories } from './_components/admin-part-categories';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminPartCategoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session?.user as any)?.role !== 'admin') redirect('/login');

  let categories: any[] = [];
  try {
    categories = await prisma.partCategory.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] });
  } catch {}

  return <AdminPartCategories categories={JSON.parse(JSON.stringify(categories ?? []))} />;
}
