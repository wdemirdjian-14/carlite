import { PageLayout } from '@/components/page-layout';
import { HomeContent } from './_components/home-content';
import { prisma } from '@/lib/prisma';
import { getFeaturedPromotions } from '@/lib/promotions';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let vehicles: any[] = [];
  let articles: any[] = [];
  let usedVehicles: any[] = [];
  let promotions: any[] = [];
  try {
    const now = new Date();
    [vehicles, articles, usedVehicles] = await Promise.all([
      prisma.vehicle.findMany({
        where: { featured: true, available: true, published: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      prisma.article.findMany({
        where: {
          published: true,
          OR: [
            { publishDate: null },
            { publishDate: { lte: now } },
          ],
        },
        orderBy: { publishDate: 'desc' },
        take: 3,
      }),
      prisma.usedVehicle.findMany({
        where: { featured: true, available: true, published: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ]);
    promotions = await getFeaturedPromotions();
  } catch {}

  return (
    <PageLayout>
      <HomeContent vehicles={vehicles ?? []} articles={articles ?? []} usedVehicles={JSON.parse(JSON.stringify(usedVehicles ?? []))} promotions={JSON.parse(JSON.stringify(promotions ?? []))} />
    </PageLayout>
  );
}
