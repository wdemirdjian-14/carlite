import { PageLayout } from '@/components/page-layout';
import { AccessoryList } from './_components/accessory-list';
import { prisma } from '@/lib/prisma';
import { getPromoMaps } from '@/lib/promotions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pièces détachées & Accessoires' };

export default async function AccessoiresPage() {
  let accessories: any[] = [];
  let categories: any[] = [];
  try {
    [accessories, categories] = await Promise.all([
      prisma.accessory.findMany({ where: { inStock: true, published: true, NOT: { stockStatus: 'out_of_stock', keepVisible: false } }, orderBy: { name: 'asc' } }),
      prisma.partCategory.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] }),
    ]);
    const { byAccessory } = await getPromoMaps();
    accessories = accessories.map((a: any) => ({ ...a, promo: byAccessory[a.id] ?? null }));
  } catch {}

  return (
    <PageLayout>
      <div className="max-w-[1200px] mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">Pièces détachées & Accessoires</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Trouvez la pièce détachée ou l'accessoire qu'il vous faut pour votre véhicule CARLITE, classés par catégorie.</p>
        </div>
        <AccessoryList accessories={JSON.parse(JSON.stringify(accessories ?? []))} categories={JSON.parse(JSON.stringify(categories ?? []))} />
      </div>
    </PageLayout>
  );
}
