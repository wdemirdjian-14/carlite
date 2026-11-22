import { PageLayout } from '@/components/page-layout';
import { Configurator } from './_components/configurator';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Configurateur' };

export default async function ConfigurateurPage() {
  let vehicles: any[] = [];
  try {
    const include = {
      configCategories: {
        orderBy: { order: 'asc' as const },
        include: { options: { where: { active: true }, orderBy: { order: 'asc' as const } } },
      },
      configRules: { orderBy: { order: 'asc' as const } },
    };
    vehicles = await prisma.vehicle.findMany({
      where: { available: true, published: true, hasConfigurator: true },
      include,
      orderBy: { basePrice: 'asc' },
    });
    // Fallback: if no vehicle has the configurator explicitly enabled yet, show all available ones
    if (!vehicles || vehicles.length === 0) {
      vehicles = await prisma.vehicle.findMany({
        where: { available: true, published: true },
        include,
        orderBy: { basePrice: 'asc' },
      });
    }
  } catch {}

  return (
    <PageLayout>
      <Configurator vehicles={JSON.parse(JSON.stringify(vehicles ?? []))} />
    </PageLayout>
  );
}
