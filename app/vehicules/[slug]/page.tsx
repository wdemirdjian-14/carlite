import { PageLayout } from '@/components/page-layout';
import { VehicleDetail } from './_components/vehicle-detail';
import { prisma } from '@/lib/prisma';
import { getPromoMaps } from '@/lib/promotions';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function VehicleDetailPage({ params }: { params: { slug: string } }) {
  let vehicle: any = null;
  let compatibleParts: any[] = [];
  try {
    vehicle = await prisma.vehicle.findUnique({
      where: { slug: params?.slug },
      include: { colors: true, wheels: true, options: true },
    });
    if (vehicle?.id) {
      compatibleParts = await prisma.accessory.findMany({
        where: { inStock: true, published: true, compatibleVehicleIds: { has: vehicle.id } },
        orderBy: { name: 'asc' },
      });
    }
  } catch {}
  if (!vehicle || vehicle.published === false) notFound();

  let promo: any = null;
  try {
    const { byVehicle } = await getPromoMaps();
    promo = byVehicle[vehicle.id] ?? null;
  } catch {}

  return (
    <PageLayout>
      <VehicleDetail vehicle={JSON.parse(JSON.stringify({ ...vehicle, promo }))} compatibleParts={JSON.parse(JSON.stringify(compatibleParts ?? []))} />
    </PageLayout>
  );
}
