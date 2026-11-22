'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Battery, Calendar, MapPin, Tag, Users, ShieldCheck } from 'lucide-react';
import { PriceTag } from '@/components/price-tag';
import { StockBadge } from '@/components/stock-badge';
import { formatEuro, euroHT } from '@/lib/pricing';
import { LeadModal } from '@/components/lead-modal';
import { PromoBadge, PromoPrice } from '@/components/promo-price';
import { Phone } from 'lucide-react';

export function UsedVehicleList({ vehicles }: { vehicles: any[] }) {
  const safe = vehicles ?? [];
  const [maxPrice, setMaxPrice] = useState(200000);
  const [maxMileage, setMaxMileage] = useState(200000);
  const [seatsFilter, setSeatsFilter] = useState('all');
  const [homologationFilter, setHomologationFilter] = useState('all');
  const [leadProduct, setLeadProduct] = useState<any>(null);

  const seatsOptions = useMemo(() => Array.from(new Set(safe.map((v: any) => v?.seats).filter((s: any) => s != null && s > 0))).sort((a: any, b: any) => a - b), [safe]);
  const homologationOptions = useMemo(() => Array.from(new Set(safe.map((v: any) => v?.homologation).filter(Boolean))).sort(), [safe]);

  const filtered = safe?.filter?.((v: any) =>
    (v?.price ?? 0) <= maxPrice &&
    (v?.mileage ?? 0) <= maxMileage &&
    (seatsFilter === 'all' || String(v?.seats ?? '') === seatsFilter) &&
    (homologationFilter === 'all' || (v?.homologation ?? '') === homologationFilter)
  ) ?? [];

  const resetFilters = () => { setMaxPrice(200000); setMaxMileage(200000); setSeatsFilter('all'); setHomologationFilter('all'); };

  return (
    <div>
      <div className="bg-card rounded-xl p-5 shadow-[var(--shadow-md)] mb-8">
        <div className="grid sm:grid-cols-2 gap-6 mb-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Prix max : {maxPrice?.toLocaleString?.('fr-FR')} €</label>
            <input type="range" min={5000} max={200000} step={5000} value={maxPrice} onChange={(e: any) => setMaxPrice(Number(e?.target?.value ?? 200000))} className="w-full accent-primary" />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Kilométrage max : {maxMileage?.toLocaleString?.('fr-FR')} km</label>
            <input type="range" min={0} max={200000} step={5000} value={maxMileage} onChange={(e: any) => setMaxMileage(Number(e?.target?.value ?? 200000))} className="w-full accent-primary" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Nombre de places</label>
            <select value={seatsFilter} onChange={(e) => setSeatsFilter(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="all">Toutes</option>
              {seatsOptions.map((s: any) => <option key={s} value={String(s)}>{s} place{s > 1 ? 's' : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Homologation</label>
            <select value={homologationFilter} onChange={(e) => setHomologationFilter(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="all">Toutes</option>
              {homologationOptions.map((h: any) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={resetFilters} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline">Réinitialiser les filtres</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">Aucun véhicule ne correspond à vos critères.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((v: any, i: number) => (
            <motion.div
              key={v?.id ?? i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="group bg-card rounded-xl overflow-hidden shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all hover:-translate-y-1"
            >
              <div className="relative aspect-[4/3] bg-muted">
                <Image src={v?.imageUrl ?? ''} alt={v?.name ?? 'Véhicule'} fill className="object-cover" />
                <div className="absolute top-3 right-3 bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs font-medium">
                  {v?.condition ?? ''}
                </div>
                {v?.promo && <PromoBadge promo={v.promo} className="absolute top-3 left-3" />}
              </div>
              <div className="p-5">
                <h3 className="font-display font-bold text-lg mb-2">{v?.name ?? ''}</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" /> {v?.year ?? ''}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {(v?.mileage ?? 0)?.toLocaleString?.('fr-FR')} km
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Battery className="h-3 w-3" /> {v?.range ?? 0} km
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" /> {v?.seats ?? 2} place{(v?.seats ?? 2) > 1 ? 's' : ''}
                  </div>
                </div>
                {v?.homologation && (
                  <div className="flex items-center gap-1 text-xs text-primary mb-3">
                    <ShieldCheck className="h-3.5 w-3.5" /> {v.homologation}
                  </div>
                )}
                {(v?.features?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {v.features.slice(0, 4).map((f: string, idx: number) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{f}</span>
                    ))}
                    {v.features.length > 4 && <span className="text-[10px] px-2 py-0.5 text-muted-foreground">+{v.features.length - 4}</span>}
                  </div>
                )}
                <div className="mb-2"><StockBadge status={v?.stockStatus} /></div>
                {v?.promo ? (
                  <PromoPrice promo={v.promo} originalHt={v?.price} className="font-mono font-bold text-lg" />
                ) : (
                  <div className="flex items-center gap-2">
                    <PriceTag ht={v?.price} className="font-mono font-bold text-lg text-primary" />
                    {(v?.originalPrice ?? 0) > (v?.price ?? 0) && (
                      <span className="font-mono text-sm text-muted-foreground line-through">{formatEuro(v?.originalPrice)} € HT</span>
                    )}
                  </div>
                )}
                <button
                  onClick={() => setLeadProduct(v)}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-green-600 text-green-700 dark:text-green-400 text-sm font-medium hover:bg-green-600 hover:text-white transition-colors"
                >
                  <Phone className="h-4 w-4" /> Être rappelé
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <LeadModal
        open={!!leadProduct}
        onClose={() => setLeadProduct(null)}
        type="information"
        title="Être rappelé pour ce produit"
        subtitle="Laissez-nous vos coordonnées, un conseiller vous rappelle pour tout renseignement."
        subject={`Renseignement occasion – ${leadProduct?.name ?? 'Véhicule'}`}
        productName={leadProduct?.name ?? ''}
        context={leadProduct ? `Année : ${leadProduct?.year ?? '-'}\nKilométrage : ${formatEuro(leadProduct?.mileage)} km\nPrix : ${euroHT(leadProduct?.price)}` : ''}
      />
    </div>
  );
}
