import { PageLayout } from '@/components/page-layout';
import { ArticleList } from './_components/article-list';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Articles & Actualités' };

export default async function ArticlesPage() {
  let articles: any[] = [];
  try {
    const now = new Date();
    articles = await prisma.article.findMany({
      where: {
        published: true,
        OR: [
          { publishDate: null },
          { publishDate: { lte: now } },
        ],
      },
      orderBy: { publishDate: 'desc' },
    });
  } catch {}

  return (
    <PageLayout>
      <ArticleList articles={articles ?? []} />
    </PageLayout>
  );
}
