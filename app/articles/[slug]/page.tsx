import { PageLayout } from '@/components/page-layout';
import { ArticleDetail } from './_components/article-detail';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  let article: any = null;
  try {
    article = await prisma.article.findUnique({ where: { slug: params.slug } });
  } catch {}
  return { title: article?.title ?? 'Article' };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  let article: any = null;
  let related: any[] = [];
  try {
    article = await prisma.article.findUnique({ where: { slug: params.slug } });
    if (article) {
      const now = new Date();
      related = await prisma.article.findMany({
        where: {
          published: true,
          id: { not: article.id },
          category: article.category,
          OR: [
            { publishDate: null },
            { publishDate: { lte: now } },
          ],
        },
        take: 3,
        orderBy: { publishDate: 'desc' },
      });
    }
  } catch {}

  if (!article) return notFound();

  return (
    <PageLayout>
      <ArticleDetail article={article} related={related ?? []} />
    </PageLayout>
  );
}
