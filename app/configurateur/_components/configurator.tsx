'use client';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Settings, ChevronRight, Wrench,
  Palette, Package, Battery, Sofa, Zap, ShieldCheck,
} from 'lucide-react';
import { SectionWrapper } from '@/components/section-wrapper';
import { PriceTag } from '@/components/price-tag';
import { euroHT, formatEuro, htToTtc } from '@/lib/pricing';
import { LeadModal } from '@/components/lead-modal';

const ICON_MAP: Record<string, any> = { Palette, Package, Battery, Sofa, Wrench, Settings, Zap, ShieldCheck };

type SelMap = Record<string, string[]>; // categoryId -> option ids

function buildDefaults(vehicle: any): SelMap {
  const map: SelMap = {};
  for (const c of (vehicle?.configCategories ?? [])) {
    const opts = (c.options ?? []).filter((o: any) => o.active !== false);
    if ((c.selectionType === 'radio' || c.selectionType === 'dropdown') && c.required && opts.length > 0) {
      map[c.id] = [opts[0].id];
    } else {
      map[c.id] = [];
    }
  }
  return map;
}

export function Configurator({ vehicles }: { vehicles: any[] }) {
  const searchParams = useSearchParams();
  const preselectedSlug = searchParams?.get?.('vehicule') ?? '';
  const safe = vehicles ?? [];

  const initialIdx = safe?.findIndex?.((v: any) => v?.slug === preselectedSlug);
  const [selectedVehicleIdx, setSelectedVehicleIdx] = useState(initialIdx >= 0 ? initialIdx : 0);
  const vehicle = safe?.[selectedVehicleIdx] ?? null;

  const [selected, setSelected] = useState<SelMap>(() => buildDefaults(safe?.[initialIdx >= 0 ? initialIdx : 0] ?? null));
  const [montageSelected, setMontageSelected] = useState(false);
  const [devisOpen, setDevisOpen] = useState(false);

  const categories: any[] = useMemo(
    () => [...(vehicle?.configCategories ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [vehicle]
  );
  const rules: any[] = vehicle?.configRules ?? [];

  const optCatOf = (optId: string) => categories.find((c) => (c.options ?? []).some((o: any) => o.id === optId));

  const selectedIdsRaw = useMemo(() => new Set(Object.values(selected).flat()), [selected]);

  const isVisible = (optId: string) => {
    const showRules = rules.filter((r) => r.ruleType === 'show' && r.targetOptionId === optId);
    if (showRules.length > 0 && !showRules.some((r) => selectedIdsRaw.has(r.triggerOptionId))) return false;
    const hideRules = rules.filter((r) => r.ruleType === 'hide' && r.targetOptionId === optId);
    if (hideRules.some((r) => selectedIdsRaw.has(r.triggerOptionId))) return false;
    return true;
  };

  // Selected options that are both visible and active (used for price + summary)
  const effectiveSelected = useMemo(() => {
    const res: any[] = [];
    for (const c of categories) {
      for (const o of (c.options ?? [])) {
        if ((selected[c.id] ?? []).includes(o.id) && o.active !== false && isVisible(o.id)) {
          res.push({ ...o, categoryName: c.name });
        }
      }
    }
    return res;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, selected, rules]);

  const selectedColorOpt = effectiveSelected.find((o) => o.colorHex);

  const montagePrice = (vehicle?.montageAvailable && montageSelected) ? (vehicle?.montagePrice ?? 0) : 0;

  const totalPrice = useMemo(() => {
    const base = vehicle?.basePrice ?? 0;
    const opts = effectiveSelected.reduce((acc, o) => acc + (o?.priceModifier ?? 0), 0);
    return base + opts + montagePrice;
  }, [vehicle, effectiveSelected, montagePrice]);

  const switchVehicle = (i: number) => {
    setSelectedVehicleIdx(i);
    setSelected(buildDefaults(safe?.[i] ?? null));
    setMontageSelected(false);
  };

  const applyRules = (map: SelMap, changedId: string): { map: SelMap; msgs: string[] } => {
    const msgs: string[] = [];
    const sel = new Set(Object.values(map).flat());
    if (sel.has(changedId)) {
      // incompatible -> remove the conflicting option
      for (const r of rules.filter((r) => r.ruleType === 'incompatible')) {
        let other: string | null = null;
        if (r.triggerOptionId === changedId) other = r.targetOptionId;
        else if (r.targetOptionId === changedId) other = r.triggerOptionId;
        if (other && sel.has(other)) {
          const oc = optCatOf(other);
          if (oc) { map[oc.id] = (map[oc.id] ?? []).filter((x) => x !== other); sel.delete(other); }
          if (r.message) msgs.push(r.message);
        }
      }
      // requires -> ensure target is selected
      for (const r of rules.filter((r) => r.ruleType === 'requires' && r.triggerOptionId === changedId)) {
        const t = r.targetOptionId;
        if (!sel.has(t)) {
          const tc = optCatOf(t);
          if (tc) {
            map[tc.id] = tc.selectionType === 'checkbox' ? [...(map[tc.id] ?? []), t] : [t];
            sel.add(t);
            if (r.message) msgs.push(r.message);
          }
        }
      }
    }
    return { map, msgs };
  };

  const selectOption = (cat: any, optId: string) => {
    const next: SelMap = { ...selected };
    const cur = next[cat.id] ?? [];
    if (cat.selectionType === 'checkbox') {
      next[cat.id] = cur.includes(optId) ? cur.filter((x) => x !== optId) : [...cur, optId];
    } else {
      // radio: allow deselect if not required
      next[cat.id] = cur.includes(optId) ? (cat.required ? [optId] : []) : [optId];
    }
    const { map, msgs } = applyRules(next, optId);
    setSelected({ ...map });
    msgs.forEach((m) => toast.info(m));
  };

  const selectDropdown = (cat: any, optId: string) => {
    const next: SelMap = { ...selected };
    next[cat.id] = optId ? [optId] : [];
    const { map, msgs } = optId ? applyRules(next, optId) : { map: next, msgs: [] };
    setSelected({ ...map });
    msgs.forEach((m) => toast.info(m));
  };

  if (safe.length === 0) {
    return <div className="max-w-[1200px] mx-auto px-4 py-20 text-center text-muted-foreground">Aucun véhicule disponible pour la configuration.</div>;
  }

  const priceLabel = (p: number) => (p === 0 ? 'Inclus' : `${p > 0 ? '+' : ''}${p.toLocaleString('fr-FR')} € HT`);

  const configSummary = useMemo(() => {
    const lines: string[] = [];
    lines.push(`Véhicule : ${vehicle?.name ?? ''} (${vehicle?.category ?? ''})`);
    lines.push(`Prix de base : ${euroHT(vehicle?.basePrice)}`);
    const grouped: Record<string, string[]> = {};
    for (const o of effectiveSelected) {
      const cat = o.categoryName ?? 'Options';
      const mod = (o.priceModifier ?? 0) !== 0 ? ` (${o.priceModifier > 0 ? '+' : ''}${formatEuro(o.priceModifier)} € HT)` : ' (inclus)';
      (grouped[cat] = grouped[cat] ?? []).push(`${o.name}${mod}`);
    }
    for (const [cat, items] of Object.entries(grouped)) {
      lines.push(`${cat} : ${items.join(', ')}`);
    }
    if (montagePrice > 0) lines.push(`${vehicle?.montageLabel ?? 'Montage'} : +${formatEuro(montagePrice)} € HT`);
    lines.push(`Total : ${formatEuro(totalPrice)} € HT (soit ${formatEuro(htToTtc(totalPrice))} € TTC)`);
    return lines.join('\n');
  }, [vehicle, effectiveSelected, montagePrice, totalPrice]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-12">
      <SectionWrapper>
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">Configurateur</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">{vehicle?.configIntro?.trim() ? vehicle.configIntro : 'Personnalisez votre véhicule CARLITE : couleur, équipements et options sur mesure.'}</p>
        </div>
      </SectionWrapper>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left: Config options */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle selector */}
          <div className="bg-card rounded-xl p-5 shadow-[var(--shadow-md)]">
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><Settings className="h-4 w-4 text-green-600" /> Modèle</h3>
            <div className="space-y-2">
              {safe.map((v: any, i: number) => (
                <button
                  key={v?.id ?? i}
                  onClick={() => switchVehicle(i)}
                  className={`w-full text-left p-3 rounded-lg transition-colors flex items-center justify-between ${
                    i === selectedVehicleIdx ? 'bg-gray-900 text-white' : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <div>
                    <div className="font-medium text-sm">{v?.name ?? ''}</div>
                    <div className={`text-xs ${i === selectedVehicleIdx ? 'text-gray-300' : 'text-muted-foreground'}`}>{v?.category} • {euroHT(v?.basePrice)}</div>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic categories */}
          {categories.map((cat: any) => {
            const Icon = ICON_MAP[cat.icon] ?? Package;
            const opts = (cat.options ?? []).filter((o: any) => o.active !== false && isVisible(o.id));
            if (opts.length === 0) return null;
            const curSel = selected[cat.id] ?? [];
            const hasSel = opts.some((o: any) => curSel.includes(o.id));
            return (
              <div key={cat.id} className="bg-card rounded-xl p-5 shadow-[var(--shadow-md)]">
                <h3 className="font-display font-semibold mb-1 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-green-600" /> {cat.name}
                  {cat.required && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/20 text-red-600 font-normal">requis</span>}
                </h3>
                {cat.description && <p className="text-xs text-muted-foreground mb-3">{cat.description}</p>}
                {!cat.description && <div className="mb-3" />}

                {cat.selectionType === 'dropdown' ? (
                  <select
                    value={curSel[0] ?? ''}
                    onChange={(e) => selectDropdown(cat, e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {!cat.required && <option value="">— Choisir —</option>}
                    {opts.map((o: any) => (
                      <option key={o.id} value={o.id}>{o.name}{(o.priceModifier ?? 0) !== 0 ? ` (${priceLabel(o.priceModifier)})` : ''}</option>
                    ))}
                  </select>
                ) : (
                  <div className={cat.options?.some((o: any) => o.colorHex) ? 'flex flex-wrap gap-3' : 'space-y-2'}>
                    {opts.map((o: any) => {
                      const isSel = curSel.includes(o.id);
                      if (o.colorHex) {
                        return (
                          <button
                            key={o.id}
                            onClick={() => selectOption(cat, o.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${isSel ? 'ring-2 ring-gray-900 dark:ring-white bg-muted' : 'bg-muted/50 hover:bg-muted'}`}
                          >
                            <div className="w-6 h-6 rounded-full border-2 border-border" style={{ backgroundColor: o.colorHex }} />
                            <span>{o.name}</span>
                            {(o.priceModifier ?? 0) !== 0 && <span className="text-xs text-muted-foreground">{priceLabel(o.priceModifier)}</span>}
                          </button>
                        );
                      }
                      return (
                        <button
                          key={o.id}
                          onClick={() => selectOption(cat, o.id)}
                          className={`w-full text-left p-3 rounded-lg text-sm transition-all flex items-center gap-3 ${isSel ? 'ring-2 ring-gray-900 dark:ring-white bg-muted' : 'bg-muted/50 hover:bg-muted'}`}
                        >
                          {o.imageUrl && (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              <Image src={o.imageUrl} alt={o.name ?? ''} fill className="object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{o.name ?? ''}</div>
                            {o.description && <div className="text-xs text-muted-foreground">{o.description}</div>}
                          </div>
                          <span className="text-xs font-mono ml-2 whitespace-nowrap">{(o.priceModifier ?? 0) > 0 ? `+${o.priceModifier.toLocaleString('fr-FR')} € HT` : (o.priceModifier ?? 0) < 0 ? `${o.priceModifier.toLocaleString('fr-FR')} € HT` : 'Inclus'}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {cat.required && !hasSel && <p className="text-xs text-red-500 mt-2">Veuillez sélectionner une option.</p>}
              </div>
            );
          })}

          {/* Montage option */}
          {vehicle?.montageAvailable && (
            <div className="bg-card rounded-xl p-5 shadow-[var(--shadow-md)]">
              <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><Wrench className="h-4 w-4 text-green-600" /> Montage</h3>
              <button
                onClick={() => setMontageSelected((s) => !s)}
                className={`w-full text-left p-3 rounded-lg text-sm transition-all flex items-center justify-between ${montageSelected ? 'ring-2 ring-gray-900 dark:ring-white bg-muted' : 'bg-muted/50 hover:bg-muted'}`}
              >
                <div>
                  <div className="font-medium">{vehicle?.montageLabel ?? 'Montage chez un partenaire'}</div>
                  <div className="text-xs text-muted-foreground">Livraison en kit avec montage assuré par un partenaire agréé.</div>
                </div>
                <span className="text-xs font-mono ml-2 whitespace-nowrap">{(vehicle?.montagePrice ?? 0) > 0 ? `+${(vehicle?.montagePrice ?? 0)?.toLocaleString?.('fr-FR')} € HT` : 'Offert'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Preview & Summary */}
        <div className="lg:col-span-3">
          <div className="sticky top-24 space-y-6">
            <motion.div
              key={vehicle?.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-card rounded-xl overflow-hidden shadow-[var(--shadow-lg)]"
            >
              <div className="relative aspect-[4/3] bg-muted">
                <Image src={vehicle?.imageUrl ?? ''} alt={vehicle?.name ?? 'Véhicule'} fill className="object-cover" />
                {selectedColorOpt && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: selectedColorOpt.colorHex }} />
                    <span className="text-xs font-medium">{selectedColorOpt.name}</span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <h2 className="font-display text-2xl font-bold mb-1">{vehicle?.name ?? ''}</h2>
                <p className="text-sm text-muted-foreground mb-4">{vehicle?.category} • {vehicle?.permitType}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Prix de base</span>
                    <span className="font-mono font-medium">{euroHT(vehicle?.basePrice)}</span>
                  </div>
                  {effectiveSelected.filter((o) => (o.priceModifier ?? 0) !== 0).map((o) => (
                    <div key={o.id} className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">{o.name}</span>
                      <span className="font-mono font-medium">{o.priceModifier > 0 ? `+${o.priceModifier.toLocaleString('fr-FR')} € HT` : `${o.priceModifier.toLocaleString('fr-FR')} € HT`}</span>
                    </div>
                  ))}
                  {montagePrice > 0 && (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">{vehicle?.montageLabel ?? 'Montage'}</span>
                      <span className="font-mono font-medium">+{formatEuro(montagePrice)} € HT</span>
                    </div>
                  )}
                  <div className="flex justify-between items-start py-3 text-lg">
                    <span className="font-display font-bold">Total</span>
                    <span className="text-right">
                      <span className="font-mono font-bold block">{formatEuro(totalPrice)} € HT</span>
                      <span className="text-xs font-normal text-muted-foreground">soit {formatEuro(htToTtc(totalPrice))} € TTC</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setDevisOpen(true)}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
                >
                  Demander un devis <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <LeadModal
        open={devisOpen}
        onClose={() => setDevisOpen(false)}
        type="quote"
        title="Demander un devis"
        subtitle="Renseignez vos coordonnées, nous vous envoyons un devis personnalisé pour cette configuration."
        subject={`Demande de devis – ${vehicle?.name ?? 'Configuration'}`}
        context={configSummary}
        productName={vehicle?.name ?? ''}
      />
    </div>
  );
}
