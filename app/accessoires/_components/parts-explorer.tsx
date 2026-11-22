'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X, ArrowDownUp, PackageSearch } from 'lucide-react';
import { FacetGroup, ToggleRow, type FacetOption } from '@/components/site/facet';
import { BottomSheet } from '@/components/site/bottom-sheet';
import { PartCard } from '@/components/site/part-card';
import { LeadModal } from '@/components/lead-modal';
import { normalize, scoreText, tokenize } from '@/lib/search';
import { effectivePrice, isPriceOnRequest, partBrand, partCategory, partType, partVoltages, OTHER_CATEGORY } from '@/lib/parts';
import { cn } from '@/lib/utils';

type Target = { id: string; name: string; kind: 'neuf' | 'occasion' };

const SORTS = [
  { value: 'pertinence', label: 'Pertinence' },
  { value: 'recent', label: 'Nouveautés' },
  { value: 'prix-asc', label: 'Prix croissant' },
  { value: 'prix-desc', label: 'Prix décroissant' },
  { value: 'az', label: 'A → Z' },
];
const PAGE = 24;

// Filtres stockés dans l'URL (partageables, conservés au retour arrière)
type Filters = {
  q: string;
  cat: string[];
  type: string[];
  volt: string[];
  marque: string[];
  veh: string[];
  min: string;
  max: string;
  devis: boolean; // inclure les pièces « sur devis » quand un prix est filtré
  stock: boolean; // en stock uniquement
  promo: boolean;
  tri: string;
};

function readFilters(sp: URLSearchParams): Filters {
  const list = (k: string) => (sp.get(k) ? sp.get(k)!.split(',').filter(Boolean) : []);
  return {
    q: sp.get('q') ?? '',
    cat: list('cat'),
    type: list('type'),
    volt: list('volt'),
    marque: list('marque'),
    veh: list('veh'),
    min: sp.get('min') ?? '',
    max: sp.get('max') ?? '',
    devis: sp.get('devis') !== '0',
    stock: sp.get('stock') === '1',
    promo: sp.get('promo') === '1',
    tri: sp.get('tri') ?? 'pertinence',
  };
}

function writeFilters(f: Filters): string {
  const sp = new URLSearchParams();
  if (f.q.trim()) sp.set('q', f.q.trim());
  (['cat', 'type', 'volt', 'marque', 'veh'] as const).forEach((k) => f[k].length && sp.set(k, f[k].join(',')));
  if (f.min) sp.set('min', f.min);
  if (f.max) sp.set('max', f.max);
  if (!f.devis) sp.set('devis', '0');
  if (f.stock) sp.set('stock', '1');
  if (f.promo) sp.set('promo', '1');
  if (f.tri !== 'pertinence') sp.set('tri', f.tri);
  return sp.toString();
}

type Indexed = {
  part: any;
  cat: string;
  type: string;
  volts: string[];
  brand: string | null;
  vehicles: string[];
  price: number;
  onRequest: boolean;
  nName: string;
  nMeta: string;
  nDesc: string;
};

export function PartsExplorer({ parts, categories, targets }: { parts: any[]; categories: string[]; targets: Target[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [f, setF] = useState<Filters>(() => readFilters(new URLSearchParams(sp.toString())));
  const [qInput, setQInput] = useState(f.q);
  const [sheet, setSheet] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const [askOpen, setAskOpen] = useState(false);
  const firstRender = useRef(true);

  // Index de recherche calculé une fois
  const index: Indexed[] = useMemo(
    () =>
      parts.map((p) => {
        const price = effectivePrice(p);
        const cat = partCategory(p);
        const type = partType(p);
        const brand = partBrand(p);
        return {
          part: p,
          cat,
          type,
          volts: partVoltages(p).map(String),
          brand,
          vehicles: [...(p.compatibleVehicleIds ?? []), ...(p.compatibleUsedVehicleIds ?? [])],
          price,
          onRequest: isPriceOnRequest(price),
          nName: normalize(p.name),
          nMeta: normalize(`${cat} ${type} ${brand ?? ''}`),
          nDesc: normalize(p.description),
        };
      }),
    [parts]
  );

  // Synchronisation de l'URL (sans recharger la page ni remonter en haut)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const qs = writeFilters(f);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    setShown(PAGE);
  }, [f, pathname, router]);

  // Saisie : on filtre après une courte pause
  useEffect(() => {
    const t = setTimeout(() => setF((prev) => (prev.q === qInput ? prev : { ...prev, q: qInput })), 220);
    return () => clearTimeout(t);
  }, [qInput]);

  const tokens = useMemo(() => tokenize(f.q), [f.q]);

  // Chaque critère, isolable pour calculer les compteurs des autres facettes
  const tests = useMemo(() => {
    const min = f.min ? Number(f.min) : null;
    const max = f.max ? Number(f.max) : null;
    return {
      cat: (x: Indexed) => !f.cat.length || f.cat.includes(x.cat),
      type: (x: Indexed) => !f.type.length || f.type.includes(x.type),
      volt: (x: Indexed) => !f.volt.length || x.volts.some((v) => f.volt.includes(v)),
      marque: (x: Indexed) => !f.marque.length || (!!x.brand && f.marque.includes(x.brand)),
      veh: (x: Indexed) => !f.veh.length || x.vehicles.some((v) => f.veh.includes(v)),
      price: (x: Indexed) => {
        if (min == null && max == null) return true;
        if (x.onRequest) return f.devis;
        return (min == null || x.price >= min) && (max == null || x.price <= max);
      },
      stock: (x: Indexed) => !f.stock || (x.part.stockStatus ?? 'available') === 'available',
      promo: (x: Indexed) => !f.promo || !!x.part.promo,
    };
  }, [f]);

  const scored = useMemo(
    () =>
      index
        .map((x) => ({
          x,
          s: scoreText(tokens, [
            { text: x.nName, weight: 5 },
            { text: x.nMeta, weight: 3 },
            { text: x.nDesc, weight: 1 },
          ]),
        }))
        .filter((r) => r.s > 0),
    [index, tokens]
  );

  const passAll = useCallback(
    (x: Indexed, except?: keyof typeof tests) =>
      (Object.keys(tests) as (keyof typeof tests)[]).every((k) => k === except || tests[k](x)),
    [tests]
  );

  const results = useMemo(() => {
    const r = scored.filter(({ x }) => passAll(x));
    const byPrice = (a: Indexed, b: Indexed, dir: 1 | -1) => {
      if (a.onRequest !== b.onRequest) return a.onRequest ? 1 : -1; // « sur devis » toujours à la fin
      return (a.price - b.price) * dir;
    };
    switch (f.tri) {
      case 'prix-asc':
        return r.sort((a, b) => byPrice(a.x, b.x, 1));
      case 'prix-desc':
        return r.sort((a, b) => byPrice(a.x, b.x, -1));
      case 'az':
        return r.sort((a, b) => a.x.part.name.localeCompare(b.x.part.name, 'fr'));
      case 'recent':
        return r.sort((a, b) => +new Date(b.x.part.createdAt) - +new Date(a.x.part.createdAt));
      default:
        return r.sort((a, b) => b.s - a.s || Number(!!b.x.part.promo) - Number(!!a.x.part.promo) || +new Date(b.x.part.updatedAt) - +new Date(a.x.part.updatedAt));
    }
  }, [scored, passAll, f.tri]);

  // Compteurs de facettes (en tenant compte de tous les autres filtres)
  const facet = useCallback(
    (key: 'cat' | 'type' | 'volt' | 'marque' | 'veh', values: (x: Indexed) => string[], order?: string[], label?: (v: string) => string): FacetOption[] => {
      const counts = new Map<string, number>();
      for (const { x } of scored) {
        if (!passAll(x, key)) continue;
        for (const v of values(x)) counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      const all = new Set<string>([...index.flatMap((x) => values(x)), ...f[key]]);
      return [...all]
        .map((v) => ({ value: v, label: label ? label(v) : v, count: counts.get(v) ?? 0 }))
        .sort((a, b) => {
          if (order) {
            const ia = order.indexOf(a.value);
            const ib = order.indexOf(b.value);
            if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
          }
          return b.count - a.count || a.label.localeCompare(b.label, 'fr');
        });
    },
    [scored, passAll, index, f]
  );

  const catOptions = facet('cat', (x) => [x.cat], [...categories, OTHER_CATEGORY]);
  const typeOptions = facet('type', (x) => [x.type]);
  const voltOptions = facet('volt', (x) => x.volts, undefined, (v) => `${v} V`).sort((a, b) => Number(a.value) - Number(b.value));
  const brandOptions = facet('marque', (x) => (x.brand ? [x.brand] : []));
  const targetName = (id: string) => targets.find((t) => t.id === id)?.name ?? 'Véhicule';
  const vehOptions = facet('veh', (x) => x.vehicles.filter((id) => targets.some((t) => t.id === id)), undefined, targetName);

  const toggle = (key: 'cat' | 'type' | 'volt' | 'marque' | 'veh', v: string) =>
    setF((p) => ({ ...p, [key]: p[key].includes(v) ? p[key].filter((x) => x !== v) : [...p[key], v] }));

  const activeChips: { label: string; clear: () => void }[] = [
    ...f.cat.map((v) => ({ label: v, clear: () => toggle('cat', v) })),
    ...f.type.map((v) => ({ label: v, clear: () => toggle('type', v) })),
    ...f.volt.map((v) => ({ label: `${v} V`, clear: () => toggle('volt', v) })),
    ...f.marque.map((v) => ({ label: v, clear: () => toggle('marque', v) })),
    ...f.veh.map((v) => ({ label: `Compatible ${targetName(v)}`, clear: () => toggle('veh', v) })),
    ...(f.min || f.max
      ? [{ label: `${f.min || 0} – ${f.max || '∞'} € HT`, clear: () => setF((p) => ({ ...p, min: '', max: '' })) }]
      : []),
    ...(f.stock ? [{ label: 'En stock', clear: () => setF((p) => ({ ...p, stock: false })) }] : []),
    ...(f.promo ? [{ label: 'Promotions', clear: () => setF((p) => ({ ...p, promo: false })) }] : []),
  ];
  const filterCount = activeChips.length;
  const clearAll = () => {
    setQInput('');
    setF((p) => ({ ...readFilters(new URLSearchParams()), tri: p.tri }));
  };

  const filtersPanel = (
    <div>
      <FacetGroup title="Type de pièce" options={typeOptions} selected={f.type} onToggle={(v) => toggle('type', v)} />
      <FacetGroup title="Catégorie" options={catOptions} selected={f.cat} onToggle={(v) => toggle('cat', v)} />
      {vehOptions.length > 0 && <FacetGroup title="Compatible avec" options={vehOptions} selected={f.veh} onToggle={(v) => toggle('veh', v)} />}
      <FacetGroup title="Tension" options={voltOptions} selected={f.volt} onToggle={(v) => toggle('volt', v)} />
      <FacetGroup title="Marque" options={brandOptions} selected={f.marque} onToggle={(v) => toggle('marque', v)} initialVisible={6} />
      <div className="py-4 border-b border-border">
        <p className="text-sm font-semibold mb-3">Budget (€ HT)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Min"
            value={f.min}
            onChange={(e) => setF((p) => ({ ...p, min: e.target.value }))}
            className="w-full h-11 px-3 rounded-xl border border-input bg-background text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <span className="text-muted-foreground">–</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Max"
            value={f.max}
            onChange={(e) => setF((p) => ({ ...p, max: e.target.value }))}
            className="w-full h-11 px-3 rounded-xl border border-input bg-background text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        {(f.min || f.max) && (
          <ToggleRow label="Inclure les pièces sur devis" checked={f.devis} onChange={(v) => setF((p) => ({ ...p, devis: v }))} />
        )}
      </div>
      <div className="py-2">
        <ToggleRow label="En stock uniquement" hint="Expédition / retrait immédiat" checked={f.stock} onChange={(v) => setF((p) => ({ ...p, stock: v }))} />
        <ToggleRow label="Promotions" checked={f.promo} onChange={(v) => setF((p) => ({ ...p, promo: v }))} />
      </div>
    </div>
  );

  return (
    <div>
      {/* Barre de recherche collante */}
      <div className="sticky top-16 z-30 -mx-4 px-4 py-3 bg-background/90 backdrop-blur-xl border-b border-border lg:static lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:border-0 lg:backdrop-blur-none">
        <div className="flex gap-2">
          <label className="flex-1 flex items-center gap-2 h-12 lg:h-14 px-4 rounded-2xl bg-muted focus-within:ring-2 focus-within:ring-brand">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Chargeur 48V, phare LED, Curtis…"
              className="flex-1 min-w-0 bg-transparent outline-none text-base placeholder:text-muted-foreground"
              enterKeyHint="search"
              aria-label="Rechercher une pièce"
            />
            {qInput && (
              <button onClick={() => setQInput('')} className="p-1 rounded-full hover:bg-background" aria-label="Effacer la recherche">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
          <button
            onClick={() => setSheet(true)}
            className="lg:hidden relative h-12 w-12 shrink-0 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center"
            aria-label="Filtres"
          >
            <SlidersHorizontal className="h-5 w-5" />
            {filterCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-brand text-brand-foreground text-[11px] font-bold flex items-center justify-center">
                {filterCount}
              </span>
            )}
          </button>
        </div>

        {/* Raccourcis par type : défilement horizontal sur mobile */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap">
          {typeOptions
            .filter((o) => o.count > 0 || f.type.includes(o.value))
            .map((o) => {
              const on = f.type.includes(o.value);
              return (
                <button
                  key={o.value}
                  onClick={() => toggle('type', o.value)}
                  className={cn(
                    'shrink-0 h-9 px-4 rounded-full text-sm font-medium border transition-colors',
                    on ? 'bg-brand text-brand-foreground border-brand' : 'bg-background border-border hover:border-foreground/40'
                  )}
                >
                  {o.label} <span className="opacity-60 text-xs ml-0.5">{o.count}</span>
                </button>
              );
            })}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-10 mt-4 lg:mt-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 no-scrollbar">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-extrabold">Filtres</h2>
              {filterCount > 0 && (
                <button onClick={clearAll} className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground">
                  Tout effacer
                </button>
              )}
            </div>
            {filtersPanel}
          </div>
        </aside>

        <section aria-live="polite">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-sm">
              <span className="font-display text-xl font-extrabold">{results.length}</span>{' '}
              <span className="text-muted-foreground">pièce{results.length > 1 ? 's' : ''}{f.q && ` pour « ${f.q} »`}</span>
            </p>
            <label className="relative flex items-center gap-1.5 text-sm">
              <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
              <select
                value={f.tri}
                onChange={(e) => setF((p) => ({ ...p, tri: e.target.value }))}
                className="appearance-none bg-transparent font-medium pr-1 focus:outline-none cursor-pointer"
                aria-label="Trier"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeChips.map((c) => (
                <button key={c.label} onClick={c.clear} className="inline-flex items-center gap-1 h-8 pl-3 pr-2 rounded-full bg-muted text-sm hover:bg-muted/70">
                  {c.label} <X className="h-3.5 w-3.5" />
                </button>
              ))}
              <button onClick={clearAll} className="h-8 px-2 text-sm underline underline-offset-4 text-muted-foreground">
                Tout effacer
              </button>
            </div>
          )}

          {results.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-8 sm:p-12 text-center">
              <PackageSearch className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-3 font-display text-xl font-extrabold">Pas encore en ligne… mais sûrement en stock.</p>
              <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                Notre atelier dispose de nombreuses pièces non référencées sur le site. Dites-nous ce que vous cherchez, on vous répond sous 24 h.
              </p>
              <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
                <button onClick={() => setAskOpen(true)} className="h-11 px-5 rounded-full bg-brand text-brand-foreground font-semibold">
                  Demander cette pièce
                </button>
                {filterCount > 0 && (
                  <button onClick={clearAll} className="h-11 px-5 rounded-full border border-border font-medium">
                    Effacer les filtres
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4">
                {results.slice(0, shown).map(({ x }, i) => (
                  <PartCard key={x.part.id} part={x.part} label={x.cat !== OTHER_CATEGORY ? x.cat : x.type} priority={i < 4} />
                ))}
              </div>
              {shown < results.length && (
                <div className="mt-8 text-center">
                  <button onClick={() => setShown((s) => s + PAGE)} className="h-12 px-6 rounded-full border border-border font-semibold hover:bg-muted">
                    Afficher plus ({results.length - shown} restantes)
                  </button>
                </div>
              )}
              <div className="mt-10 rounded-3xl bg-primary text-primary-foreground p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div>
                  <p className="font-display text-xl sm:text-2xl font-extrabold tracking-tight">Vous ne trouvez pas votre pièce ?</p>
                  <p className="text-sm opacity-70 mt-1">Envoyez-nous la référence ou une photo, notre atelier la trouve pour vous.</p>
                </div>
                <button onClick={() => setAskOpen(true)} className="h-12 px-6 rounded-full bg-brand text-brand-foreground font-semibold shrink-0">
                  Demander une pièce
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      <BottomSheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="Filtres"
        footer={
          <div className="flex gap-2">
            <button onClick={clearAll} className="h-12 px-5 rounded-2xl border border-border font-medium" disabled={!filterCount}>
              Effacer
            </button>
            <button onClick={() => setSheet(false)} className="flex-1 h-12 rounded-2xl bg-brand text-brand-foreground font-semibold">
              Voir {results.length} résultat{results.length > 1 ? 's' : ''}
            </button>
          </div>
        }
      >
        {filtersPanel}
      </BottomSheet>

      <LeadModal
        open={askOpen}
        onClose={() => setAskOpen(false)}
        type="information"
        title="Demander une pièce"
        subtitle="Indiquez la pièce recherchée dans le message : un conseiller vous rappelle avec une proposition."
        subject="Recherche de pièce détachée"
        productName={f.q ? `Recherche : ${f.q}` : 'Pièce détachée'}
        context={`Recherche : ${f.q || '-'}\nFiltres : ${activeChips.map((c) => c.label).join(', ') || 'aucun'}`}
      />
    </div>
  );
}
