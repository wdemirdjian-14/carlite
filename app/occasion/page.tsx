import { PageLayout } from '@/components/page-layout';
import { UsedVehicleList } from './_components/used-vehicle-list';
import { prisma } from '@/lib/prisma';
import { getPromoMaps } from '@/lib/promotions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Véhicules d\'occasion' };

export default async function OccasionPage() {
  let usedVehicles: any[] = [];
  try {
    usedVehicles = await prisma.usedVehicle.findMany({ where: { available: true, published: true, NOT: { stockStatus: 'out_of_stock', keepVisible: false } }, orderBy: { createdAt: 'desc' } });
    const { byUsed } = await getPromoMaps();
    usedVehicles = usedVehicles.map((v: any) => ({ ...v, promo: byUsed[v.id] ?? null }));
  } catch {}

  return (
    <PageLayout>
      <div className="max-w-[1200px] mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">Véhicules d’occasion</h1>
          <p className="text-muted-foreground max-w-md mx-auto">Des véhicules électriques certifiés, au meilleur prix.</p>
        </div>
        <UsedVehicleList vehicles={usedVehicles ?? []} />
      </div>
    </PageLayout>
  );
}
