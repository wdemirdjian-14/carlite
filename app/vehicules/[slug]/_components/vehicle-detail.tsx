'use client';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Battery, Gauge, Zap, Car, Weight, Shield, ArrowRight, Settings, Users, Ruler, FileText, ShoppingBag } from 'lucide-react';
import { SectionWrapper } from '@/components/section-wrapper';
import { PriceTag } from '@/components/price-tag';
import { StockBadge } from '@/components/stock-badge';
import { euroHT } from '@/lib/pricing';
import { LeadModal } from '@/components/lead-modal';

import { useState } from 'react';

export function VehicleDetail({ vehicle, compatibleParts = [] }: { vehicle: any; compatibleParts?: any[] }) {
  const v = vehicle ?? {};
  const parts = compatibleParts ?? [];
  const [leadOpen, setLeadOpen] = useState(false);
  const specs = [
    { icon: Battery, label: 'Autonomie', value: `${v?.range ?? 0} km` },
    { icon: Gauge, label: 'Vitesse max', value: `${v?.topSpeed ?? 0} km/h` },
    { icon: Zap, label: 'Puissance moteur', value: v?.motorPower || '-' },
    { icon: Battery, label: 'Batterie', value: v?.battery ?? '' },
    { icon: Users, label: 'Places', value: `${v?.seats ?? 2}` },
    { icon: Weight, label: 'Poids', value: `${v?.weight ?? 0} kg` },
    { icon: Ruler, label: 'Dimensions', value: v?.dimensions || '-' },
    { icon: FileText, label: 'Permis', value: v?.permitType || 'Sans permis' },
    { icon: Settings, label: 'Charge', value: v?.chargeTime ?? '' },
    { icon: Shield, label: 'Garantie', value: v?.warranty ?? '2 ans' },
  ];

  return (
    <div>
      <section className="bg-gray-950 text-white">
        <div className="max-w-[1200px] mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="text-xs font-medium text-green-400 uppercase tracking-wider mb-2">{v?.category ?? ''}</div>
              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">{v?.name ?? ''}</h1>
              <p className="text-gray-300 text-lg mb-6">{v?.tagline ?? ''}</p>
              <p className="text-gray-400 mb-8">{v?.description ?? ''}</p>
              <div className="flex flex-wrap gap-4">
                <Link href={`/configurateur?vehicule=${v?.slug ?? ''}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-gray-900 font-medium hover:bg-gray-100 transition-colors">
                  Configurer <Settings className="h-4 w-4" />
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-colors">
                  Demander un essai
                </Link>
                <button onClick={() => setLeadOpen(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors">
                  Être rappelé pour ce produit
                </button>
              </div>
              <div className="mt-6">
                {v?.promo ? (
                  <div>
                    <div className="inline-block mb-1 px-2 py-1 rounded-md bg-rose-600 text-white text-xs font-semibold">{v.promo.badge}</div>
                    <div className="text-sm text-gray-400 line-through">{euroHT(v?.basePrice)}</div>
                    <PriceTag ht={v.promo.discountedPrice} prefix="à partir de" className="font-mono text-2xl font-bold text-rose-400" ttcClassName="text-gray-400" />
                    {v?.promo?.description && <p className="text-sm text-gray-300 mt-2 max-w-md">{v.promo.description}</p>}
                  </div>
                ) : (
                  <PriceTag ht={v?.basePrice} prefix="à partir de" className="font-mono text-2xl font-bold text-green-400" ttcClassName="text-gray-400" />
                )}
              </div>
              <div className="mt-4"><StockBadge status={v?.stockStatus} /></div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-800">
                <Image src={v?.imageUrl ?? ''} alt={v?.name ?? 'Véhicule CARLITE'} fill className="object-cover" priority />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-4 py-16">
        <SectionWrapper>
          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-8 text-center">Caractéristiques techniques</h2>
        </SectionWrapper>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {specs?.map?.((s: any, i: number) => {
            const Icon = s?.icon ?? Zap;
            return (
              <SectionWrapper key={i} delay={i * 0.05}>
                <div className="p-4 rounded-xl bg-muted/50 text-center hover:bg-gray-900 hover:text-white transition-all duration-300 group">
                  <Icon className="h-5 w-5 text-green-600 group-hover:text-green-400 mx-auto mb-2" />
                  <div className="font-mono font-semibold text-sm">{s?.value}</div>
                  <div className="text-xs text-muted-foreground group-hover:text-gray-400 mt-1">{s?.label}</div>
                </div>
              </SectionWrapper>
            );
          }) ?? null}
        </div>
      </section>

      {(v?.colors?.length ?? 0) > 0 && (
        <section className="bg-muted/30">
          <div className="max-w-[1200px] mx-auto px-4 py-16">
            <SectionWrapper>
              <h2 className="font-display text-2xl font-bold tracking-tight mb-6">Couleurs disponibles</h2>
            </SectionWrapper>
            <div className="flex flex-wrap gap-4">
              {v?.colors?.map?.((c: any) => (
                <div key={c?.id} className="flex items-center gap-3 px-4 py-2 rounded-lg bg-card shadow-[var(--shadow-sm)]">
                  <div className="w-8 h-8 rounded-full border-2 border-border" style={{ backgroundColor: c?.hex ?? '#ccc' }} />
                  <div>
                    <div className="text-sm font-medium">{c?.name ?? ''}</div>
                    {(c?.price ?? 0) > 0 && <div className="text-xs text-muted-foreground">+{euroHT(c?.price)}</div>}
                  </div>
                </div>
              )) ?? null}
            </div>
          </div>
        </section>
      )}

      {parts.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-4 py-16">
          <SectionWrapper>
            <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-2">Pièces détachées & accessoires compatibles</h2>
            <p className="text-muted-foreground mb-8">Sélection de pièces et accessoires adaptés à votre {v?.name ?? 'véhicule'}.</p>
          </SectionWrapper>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {parts.map((a: any, i: number) => (
              <SectionWrapper key={a?.id ?? i} delay={i * 0.05}>
                <Link href="/accessoires" className="group block bg-card rounded-xl overflow-hidden shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all hover:-translate-y-1">
                  <div className="relative aspect-square bg-muted">
                    <Image src={a?.imageUrl ?? ''} alt={a?.name ?? 'Pièce détachée'} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-4">
                    <div className="text-xs font-medium text-primary uppercase tracking-wider mb-1">{a?.category ?? ''}</div>
                    <h3 className="font-display font-bold text-sm mb-1 truncate">{a?.name ?? ''}</h3>
                    <div className="flex items-center justify-between">
                      <PriceTag ht={a?.price} className="font-mono font-bold text-primary text-sm" showTtc={false} />
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              </SectionWrapper>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-[1200px] mx-auto px-4 py-16 text-center">
        <SectionWrapper>
          <h2 className="font-display text-2xl font-bold tracking-tight mb-4">Prêt à personnaliser ?</h2>
          <p className="text-muted-foreground mb-6">Utilisez notre configurateur pour adapter votre CARLITE à vos besoins : couleurs, plateaux arrière, équipements.</p>
          <Link href={`/configurateur?vehicule=${v?.slug ?? ''}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors">
            Accéder au configurateur <ArrowRight className="h-4 w-4" />
          </Link>
        </SectionWrapper>
      </section>

      <LeadModal
        open={leadOpen}
        onClose={() => setLeadOpen(false)}
        type="information"
        title="Être rappelé pour ce produit"
        subtitle="Laissez-nous vos coordonnées, un conseiller vous rappelle pour tout renseignement."
        subject={`Renseignement – ${v?.name ?? 'Véhicule'}`}
        productName={v?.name ?? ''}
        context={`Prix à partir de ${euroHT(v?.basePrice)}${v?.category ? ` – ${v.category}` : ''}`}
      />
    </div>
  );
}
