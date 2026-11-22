import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AdminArticles } from './_components/admin-articles';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin - Articles' };

export default async function AdminArticlesPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session?.user as any)?.role !== 'admin') redirect('/login');

  let articles: any[] = [];
  try {
    articles = await prisma.article.findMany({ orderBy: { publishDate: 'asc' } });
  } catch {}

  return <AdminArticles articles={articles ?? []} />;
}
