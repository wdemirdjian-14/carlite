import { PageLayout } from '@/components/page-layout';
import { VehicleList } from './_components/vehicle-list';
import { prisma } from '@/lib/prisma';
import { getPromoMaps } from '@/lib/promotions';
import { Wrench } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Véhicules neufs' };

export default async function VehiculesPage() {
  let vehicles: any[] = [];
  try {
    vehicles = await prisma.vehicle.findMany({ where: { available: true, published: true, NOT: { stockStatus: 'out_of_stock', keepVisible: false } }, orderBy: { basePrice: 'asc' } });
    const { byVehicle } = await getPromoMaps();
    vehicles = vehicles.map((v: any) => ({ ...v, promo: byVehicle[v.id] ?? null }));
  } catch {}

  return (
    <PageLayout>
      <div className="max-w-[1200px] mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">Nos véhicules</h1>
          <p className="text-muted-foreground max-w-md mx-auto">Quadricycles légers, voiturettes et utilitaires électriques. Avec ou sans permis.</p>
        </div>
        <div className="flex items-start gap-3 max-w-3xl mx-auto mb-12 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
          <Wrench className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/90">
            Nos véhicules sont disponibles en kit, avec <span className="font-semibold">montage en option chez nos partenaires</span>.
          </p>
        </div>
        <VehicleList vehicles={vehicles ?? []} />
      </div>
    </PageLayout>
  );
}
