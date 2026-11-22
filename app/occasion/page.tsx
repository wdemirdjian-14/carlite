import { Suspense } from 'react';
import { PageLayout } from '@/components/page-layout';
import { UsedExplorer } from './_components/used-explorer';
import { getVisibleUsedVehicles } from '@/lib/catalog';
import { ShieldCheck, Wrench, Repeat } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: "Véhicules électriques d'occasion",
  description: "Quadricycles, voiturettes sans permis et golfettes électriques d'occasion, contrôlés et préparés par l'atelier CARLITE.",
};

export default async function OccasionPage() {
  const vehicles = await getVisibleUsedVehicles();
  return (
    <PageLayout>
      <div className="max-w-[1240px] mx-auto px-4 pt-6 lg:pt-10">
        <div className="mb-4 lg:mb-8 grid lg:grid-cols-[1fr_auto] gap-6 lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-strong">Occasions certifiées atelier</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[0.95] mt-2">
              Occasion, <span className="italic font-bold">mais</span> révisée.
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl">
              Chaque véhicule passe par notre atelier : batterie testée, freins, éclairage, pneus. Vous roulez l’esprit tranquille, moins cher.
            </p>
          </div>
          <ul className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
            {[
              { Icon: ShieldCheck, t: 'Contrôle', s: 'atelier' },
              { Icon: Wrench, t: 'Pièces', s: 'disponibles' },
              { Icon: Repeat, t: 'Reprise', s: 'possible' },
            ].map(({ Icon, t, s }) => (
              <li key={t} className="flex flex-col items-start gap-1 p-3 rounded-2xl bg-muted">
                <Icon className="h-5 w-5" />
                <span className="font-semibold">{t}</span>
                <span className="text-muted-foreground -mt-1">{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <Suspense fallback={<div className="h-96" />}>
          <UsedExplorer vehicles={vehicles} />
        </Suspense>
      </div>
    </PageLayout>
  );
}
