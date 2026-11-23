import { PageLayout } from '@/components/page-layout';
import { VehicleDetail } from './_components/vehicle-detail';
import { prisma } from '@/lib/prisma';
import { getPromoMaps } from '@/lib/promotions';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/site/json-ld';
import { absUrl, breadcrumbJsonLd, vehicleJsonLd } from '@/lib/seo';
import { formatEuro } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  let v: any = null;
  try {
    v = await prisma.vehicle.findUnique({ where: { slug: params.slug } });
  } catch {}
  if (!v || !v.published) return { title: 'Véhicule introuvable' };
  return {
    title: `${v.name} – ${v.category || 'véhicule électrique'} ${v.permitType ? v.permitType.toLowerCase() : ''}`.trim(),
    description: `${v.name}${v.tagline ? ` : ${v.tagline}` : ''}. ${v.basePrice > 0 ? `À partir de ${formatEuro(v.basePrice)} € HT. ` : ''}Vendu en kit non monté, assemblage par un partenaire en France.`.slice(0, 160),
    alternates: { canonical: `/vehicules/${v.slug}` },
    openGraph: { title: v.name, url: `/vehicules/${v.slug}`, images: v.imageUrl ? [absUrl(v.imageUrl)!] : undefined },
  };
}

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
      <JsonLd
        data={[
          vehicleJsonLd(vehicle, promo?.discountedPrice > 0 ? promo.discountedPrice : vehicle.basePrice),
          breadcrumbJsonLd([{ name: 'Accueil', path: '/' }, { name: 'Véhicules neufs', path: '/vehicules' }, { name: vehicle.name, path: `/vehicules/${vehicle.slug}` }]),
        ]}
      />
      <VehicleDetail vehicle={JSON.parse(JSON.stringify({ ...vehicle, promo }))} compatibleParts={JSON.parse(JSON.stringify(compatibleParts ?? []))} />
    </PageLayout>
  );
}
