import { PageLayout } from '@/components/page-layout';
import { Comparator } from './_components/comparator';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Comparateur' };

export default async function ComparateurPage() {
  let vehicles: any[] = [];
  try {
    vehicles = await prisma.vehicle.findMany({ where: { available: true, published: true }, orderBy: { name: 'asc' } });
  } catch {}

  return (
    <PageLayout>
      <Comparator vehicles={JSON.parse(JSON.stringify(vehicles ?? []))} />
    </PageLayout>
  );
}
