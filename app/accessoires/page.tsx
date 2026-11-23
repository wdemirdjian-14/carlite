import { Suspense } from 'react';
import { PageLayout } from '@/components/page-layout';
import { PartsExplorer } from './_components/parts-explorer';
import { prisma } from '@/lib/prisma';
import { getCompatibilityTargets, getVisibleParts } from '@/lib/catalog';
import { Truck, Wrench, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Pièces détachées pour véhicules électriques',
  description:
    'Chargeurs, batteries lithium, convertisseurs DC/DC, éclairage LED, afficheurs : recherchez parmi les pièces détachées CARLITE pour quadricycles, golfettes et utilitaires électriques.',
  alternates: { canonical: '/accessoires' },
};

export default async function AccessoiresPage() {
  const parts = await getVisibleParts();
  let categories: string[] = [];
  try {
    categories = (await prisma.partCategory.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] })).map((c) => c.name);
  } catch {}
  const targets = await getCompatibilityTargets(parts);

  return (
    <PageLayout>
      <div className="max-w-[1240px] mx-auto px-4 pt-6 lg:pt-10">
        <div className="mb-4 lg:mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-strong">Atelier CARLITE</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[0.95] mt-2">
              Pièces détachées
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl">
              Quadricycles, golfettes, utilitaires : trouvez la pièce par mot-clé, type, tension, marque ou budget.
            </p>
          </div>
          <ul className="hidden sm:flex flex-wrap gap-2 text-sm">
            <li className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-muted"><Wrench className="h-4 w-4" /> Conseil technique</li>
            <li className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-muted"><Truck className="h-4 w-4" /> Expédition France</li>
            <li className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-muted"><ShieldCheck className="h-4 w-4" /> Pièces vérifiées</li>
          </ul>
        </div>
        <Suspense fallback={<div className="h-96" />}>
          <PartsExplorer parts={parts} categories={categories} targets={targets} />
        </Suspense>
      </div>
    </PageLayout>
  );
}
