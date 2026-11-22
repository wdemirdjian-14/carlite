import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { getVisibleParts, getVisibleUsedVehicles, getVisibleVehicles } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/accessoires`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/vehicules`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/occasion`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/configurateur`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/articles`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/comparateur`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/recharge`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];
  const [parts, used, vehicles] = await Promise.all([getVisibleParts(), getVisibleUsedVehicles(), getVisibleVehicles()]);
  let articles: { slug: string; updatedAt: Date }[] = [];
  try {
    articles = await prisma.article.findMany({ where: { published: true, OR: [{ publishDate: null }, { publishDate: { lte: now } }] }, select: { slug: true, updatedAt: true } });
  } catch {}
  return [
    ...pages,
    ...vehicles.map((v: any) => ({ url: `${base}/vehicules/${v.slug}`, lastModified: new Date(v.updatedAt), priority: 0.8 })),
    ...used.map((v: any) => ({ url: `${base}/occasion/${v.slug}`, lastModified: new Date(v.updatedAt), priority: 0.7 })),
    ...parts.map((p: any) => ({ url: `${base}/accessoires/${p.slug}`, lastModified: new Date(p.updatedAt), priority: 0.6 })),
    ...articles.map((a) => ({ url: `${base}/articles/${a.slug}`, lastModified: a.updatedAt, priority: 0.5 })),
  ];
}
