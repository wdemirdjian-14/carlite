'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X, ArrowDownUp, BellRing } from 'lucide-react';
import { FacetGroup, ToggleRow, type FacetOption } from '@/components/site/facet';
import { BottomSheet } from '@/components/site/bottom-sheet';
import { UsedCard, usedPrice } from '@/components/site/used-card';
import { LeadModal } from '@/components/lead-modal';
import { formatEuro } from '@/lib/pricing';
import { cn } from '@/lib/utils';

const SORTS = [
  { value: 'recent', label: 'Les plus récents' },
  { value: 'prix-asc', label: 'Prix croissant' },
  { value: 'prix-desc', label: 'Prix décroissant' },
  { value: 'km', label: 'Kilométrage' },
];

type F = { budget: string; km: string; annee: string; places: string[]; permis: string[]; etat: string[]; promo: boolean; tri: string };

const read = (sp: URLSearchParams): F => ({
  budget: sp.get('budget') ?? '',
  km: sp.get('km') ?? '',
  annee: sp.get('annee') ?? '',
  places: sp.get('places')?.split(',').filter(Boolean) ?? [],
  permis: sp.get('permis')?.split(',').filter(Boolean) ?? [],
  etat: sp.get('etat')?.split(',').filter(Boolean) ?? [],
  promo: sp.get('promo') === '1',
  tri: sp.get('tri') ?? 'recent',
});

const write = (f: F) => {
  const sp = new URLSearchParams();
  if (f.budget) sp.set('budget', f.budget);
  if (f.km) sp.set('km', f.km);
  if (f.annee) sp.set('annee', f.annee);
  (['places', 'permis', 'etat'] as const).forEach((k) => f[k].length && sp.set(k, f[k].join(',')));
  if (f.promo) sp.set('promo', '1');
  if (f.tri !== 'recent') sp.set('tri', f.tri);
  return sp.toString();
};

const permitOf = (v: any) => v.permitType || v.homologation || 'Non précisé';

export function UsedExplorer({ vehicles }: { vehicles: any[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [f, setF] = useState<F>(() => read(new URLSearchParams(sp.toString())));
  const [sheet, setSheet] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const qs = write(f);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [f, pathname, router]);

  // Bornes réelles du stock pour proposer des paliers utiles
  const prices = vehicles.map(usedPrice).filter((p) => p > 0);
  const maxPrice = Math.max(0, ...prices);
  const budgetSteps = [5000, 7500, 10000, 15000, 20000, 30000].filter((b, i, arr) => b < maxPrice || arr[i - 1] < maxPrice);
  const kmSteps = [5000, 10000, 20000, 50000];
  const years = [...new Set(vehicles.map((v) => v.year))].sort((a, b) => b - a);

  const tests = {
    budget: (v: any) => !f.budget || usedPrice(v) <= Number(f.budget),
    km: (v: any) => !f.km || v.mileage <= Number(f.km),
    annee: (v: any) => !f.annee || v.year >= Number(f.annee),
    places: (v: any) => !f.places.length || f.places.includes(String(v.seats)),
    permis: (v: any) => !f.permis.length || f.permis.includes(permitOf(v)),
    etat: (v: any) => !f.etat.length || f.etat.includes(v.condition),
    promo: (v: any) => !f.promo || !!v.promo || v.originalPrice > v.price,
  };
  type K = keyof typeof tests;
  const pass = (v: any, except?: K) => (Object.keys(tests) as K[]).every((k) => k === except || tests[k](v));

  const results = useMemo(() => {
    const r = vehicles.filter((v) => pass(v));
    if (f.tri === 'prix-asc') r.sort((a, b) => usedPrice(a) - usedPrice(b));
    else if (f.tri === 'prix-desc') r.sort((a, b) => usedPrice(b) - usedPrice(a));
    else if (f.tri === 'km') r.sort((a, b) => a.mileage - b.mileage);
    else r.sort((a, b) => Number(b.featured) - Number(a.featured) || b.year - a.year || +new Date(b.createdAt) - +new Date(a.createdAt));
    return r;
  }, [vehicles, f]);

  const facet = (key: 'places' | 'permis' | 'etat', val: (v: any) => string, label?: (s: string) => string): FacetOption[] => {
    const all = [...new Set([...vehicles.map(val), ...f[key]])];
    return all
      .map((value) => ({ value, label: label ? label(value) : value, count: vehicles.filter((v) => pass(v, key) && val(v) === value).length }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr', { numeric: true }));
  };
  const toggle = (key: 'places' | 'permis' | 'etat', v: string) =>
    setF((p) => ({ ...p, [key]: p[key].includes(v) ? p[key].filter((x) => x !== v) : [...p[key], v] }));

  const chips = [
    ...(f.budget ? [{ label: `≤ ${formatEuro(Number(f.budget))} €`, clear: () => setF((p) => ({ ...p, budget: '' })) }] : []),
    ...(f.km ? [{ label: `≤ ${formatEuro(Number(f.km))} km`, clear: () => setF((p) => ({ ...p, km: '' })) }] : []),
    ...(f.annee ? [{ label: `${f.annee} et +`, clear: () => setF((p) => ({ ...p, annee: '' })) }] : []),
    ...f.places.map((v) => ({ label: `${v} places`, clear: () => toggle('places', v) })),
    ...f.permis.map((v) => ({ label: v, clear: () => toggle('permis', v) })),
    ...f.etat.map((v) => ({ label: v, clear: () => toggle('etat', v) })),
    ...(f.promo ? [{ label: 'Bonnes affaires', clear: () => setF((p) => ({ ...p, promo: false })) }] : []),
  ];
  const clearAll = () => setF((p) => ({ ...read(new URLSearchParams()), tri: p.tri }));

  const Steps = ({ title, value, steps, fmt, onChange }: { title: string; value: string; steps: number[]; fmt: (n: number) => string; onChange: (v: string) => void }) => (
    <div className="py-4 border-b border-border">
      <p className="text-sm font-semibold mb-3">{title}</p>
      <div className="flex flex-wrap gap-2">
        {steps.map((s) => {
          const on = value === String(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(on ? '' : String(s))}
              className={cn('h-9 px-3 rounded-full border text-sm', on ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-foreground/40')}
            >
              {fmt(s)}
            </button>
          );
        })}
      </div>
    </div>
  );

  const panel = (
    <div>
      {budgetSteps.length > 0 && <Steps title="Budget maximum (HT)" value={f.budget} steps={budgetSteps} fmt={(n) => `${formatEuro(n)} €`} onChange={(v) => setF((p) => ({ ...p, budget: v }))} />}
      <Steps title="Kilométrage maximum" value={f.km} steps={kmSteps} fmt={(n) => `${formatEuro(n)} km`} onChange={(v) => setF((p) => ({ ...p, km: v }))} />
      {years.length > 1 && <Steps title="Année minimum" value={f.annee} steps={years} fmt={(n) => `${n}`} onChange={(v) => setF((p) => ({ ...p, annee: v }))} />}
      <FacetGroup title="Places" options={facet('places', (v) => String(v.seats), (s) => `${s} places`)} selected={f.places} onToggle={(v) => toggle('places', v)} />
      <FacetGroup title="Permis / homologation" options={facet('permis', permitOf)} selected={f.permis} onToggle={(v) => toggle('permis', v)} />
      <FacetGroup title="État" options={facet('etat', (v) => v.condition || 'Non précisé')} selected={f.etat} onToggle={(v) => toggle('etat', v)} />
      <ToggleRow label="Bonnes affaires" hint="Prix remisé ou promotion en cours" checked={f.promo} onChange={(v) => setF((p) => ({ ...p, promo: v }))} />
    </div>
  );

  return (
    <div>
      {/* Raccourcis budget, toujours visibles */}
      <div className="sticky top-16 z-30 -mx-4 px-4 py-3 bg-background/90 backdrop-blur-xl border-b border-border lg:static lg:m-0 lg:p-0 lg:bg-transparent lg:border-0">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button onClick={() => setSheet(true)} className="lg:hidden shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4" /> Filtres {chips.length > 0 && <span className="h-5 min-w-5 px-1 rounded-full bg-brand text-brand-foreground text-[11px] flex items-center justify-center">{chips.length}</span>}
          </button>
          {budgetSteps.slice(0, 4).map((b) => (
            <button
              key={b}
              onClick={() => setF((p) => ({ ...p, budget: p.budget === String(b) ? '' : String(b) }))}
              className={cn('shrink-0 h-10 px-4 rounded-full border text-sm font-medium', f.budget === String(b) ? 'bg-brand text-brand-foreground border-brand' : 'border-border bg-background')}
            >
              Moins de {formatEuro(b)} €
            </button>
          ))}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10 mt-4 lg:mt-6">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-extrabold">Filtres</h2>
              {chips.length > 0 && <button onClick={clearAll} className="text-sm underline underline-offset-4 text-muted-foreground">Tout effacer</button>}
            </div>
            {panel}
          </div>
        </aside>
        <section aria-live="polite">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm">
              <span className="font-display text-xl font-extrabold">{results.length}</span>{' '}
              <span className="text-muted-foreground">véhicule{results.length > 1 ? 's' : ''} disponible{results.length > 1 ? 's' : ''}</span>
            </p>
            <label className="flex items-center gap-1.5 text-sm">
              <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
              <select value={f.tri} onChange={(e) => setF((p) => ({ ...p, tri: e.target.value }))} className="bg-transparent font-medium focus:outline-none cursor-pointer" aria-label="Trier">
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
          </div>
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {chips.map((c) => (
                <button key={c.label} onClick={c.clear} className="inline-flex items-center gap-1 h-8 pl-3 pr-2 rounded-full bg-muted text-sm">{c.label} <X className="h-3.5 w-3.5" /></button>
              ))}
            </div>
          )}
          {results.length ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {results.map((v, i) => <UsedCard key={v.id} v={v} priority={i < 2} />)}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border p-10 text-center">
              <p className="font-display text-xl font-extrabold">Aucun véhicule ne correspond… pour l’instant.</p>
              <p className="text-sm text-muted-foreground mt-1">Nos occasions partent vite et de nouvelles arrivent chaque mois.</p>
            </div>
          )}
          <div className="mt-10 rounded-3xl bg-brand text-brand-foreground p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex gap-4">
              <BellRing className="h-8 w-8 shrink-0" />
              <div>
                <p className="font-display text-xl sm:text-2xl font-extrabold tracking-tight">Soyez prévenu en premier</p>
                <p className="text-sm opacity-80 mt-1">Décrivez le véhicule recherché : on vous appelle dès qu’il arrive en stock. Reprise de votre véhicule possible.</p>
              </div>
            </div>
            <button onClick={() => setAlertOpen(true)} className="h-12 px-6 rounded-full bg-ink text-white font-semibold shrink-0">Créer mon alerte</button>
          </div>
        </section>
      </div>

      <BottomSheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="Filtres"
        footer={
          <div className="flex gap-2">
            <button onClick={clearAll} className="h-12 px-5 rounded-2xl border border-border font-medium">Effacer</button>
            <button onClick={() => setSheet(false)} className="flex-1 h-12 rounded-2xl bg-brand text-brand-foreground font-semibold">
              Voir {results.length} véhicule{results.length > 1 ? 's' : ''}
            </button>
          </div>
        }
      >
        {panel}
      </BottomSheet>
      <LeadModal
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        type="information"
        title="Alerte occasion"
        subtitle="Précisez modèle, budget, nombre de places… Nous vous prévenons dès qu’un véhicule correspond."
        subject="Alerte véhicule d'occasion"
        productName="Recherche de véhicule d'occasion"
        context={`Critères sélectionnés : ${chips.map((c) => c.label).join(', ') || 'aucun'}`}
      />
    </div>
  );
}
