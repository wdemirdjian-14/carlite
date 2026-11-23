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
  if (!article) return { title: 'Article' };
  return {
    title: article.title,
    description: (article.excerpt || article.title).slice(0, 160),
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: { type: 'article', title: article.title, url: `/articles/${article.slug}`, images: article.imageUrl ? [article.imageUrl] : undefined },
  };
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
