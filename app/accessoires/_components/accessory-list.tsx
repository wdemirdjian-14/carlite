'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { PriceTag } from '@/components/price-tag';
import { StockBadge } from '@/components/stock-badge';
import { LeadModal } from '@/components/lead-modal';
import { PromoBadge, PromoPrice } from '@/components/promo-price';
import { euroHT } from '@/lib/pricing';
import { Phone } from 'lucide-react';

export function AccessoryList({ accessories, categories = [] }: { accessories: any[]; categories?: any[] }) {
  const safe = accessories ?? [];

  // Ordered category names from admin-defined PartCategory list, then any leftover raw categories on items
  const orderedCatNames = useMemo(() => {
    const defined = (categories ?? []).map((c: any) => c?.name).filter(Boolean);
    const used = new Set(safe.map((a: any) => a?.category).filter(Boolean));
    const extras = [...used].filter((c: any) => !defined.includes(c));
    return [...defined.filter((c: any) => used.has(c)), ...extras];
  }, [categories, safe]);

  const tabs = ['Tous', ...orderedCatNames];
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [leadProduct, setLeadProduct] = useState<any>(null);

  const filtered = activeCategory === 'Tous' ? safe : safe.filter((a: any) => a?.category === activeCategory);

  if (safe.length === 0) {
    return <div className="text-center py-20 text-muted-foreground">Aucune pièce détachée disponible pour le moment.</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {tabs.map((cat: any) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((a: any, i: number) => (
          <motion.div
            key={a?.id ?? i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="group bg-card rounded-xl overflow-hidden shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all hover:-translate-y-1"
          >
            <div className="relative aspect-square bg-muted">
              <Image src={a?.imageUrl ?? ''} alt={a?.name ?? 'Pièce détachée'} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              {a?.promo && <PromoBadge promo={a.promo} className="absolute top-3 right-3" />}
            </div>
            <div className="p-5">
              <div className="text-xs font-medium text-primary uppercase tracking-wider mb-1">{a?.category ?? ''}</div>
              <h3 className="font-display font-bold mb-1">{a?.name ?? ''}</h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{a?.description ?? ''}</p>
              <div className="mb-2"><StockBadge status={a?.stockStatus} /></div>
              <div className="flex items-center justify-between">
                <PromoPrice promo={a?.promo} originalHt={a?.price} className="font-mono font-bold text-primary text-lg" />
                <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              </div>
              <button
                onClick={() => setLeadProduct(a)}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-green-600 text-green-700 dark:text-green-400 text-sm font-medium hover:bg-green-600 hover:text-white transition-colors"
              >
                <Phone className="h-4 w-4" /> Être rappelé
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <LeadModal
        open={!!leadProduct}
        onClose={() => setLeadProduct(null)}
        type="information"
        title="Être rappelé pour ce produit"
        subtitle="Laissez-nous vos coordonnées, un conseiller vous rappelle pour tout renseignement."
        subject={`Renseignement – ${leadProduct?.name ?? 'Accessoire'}`}
        productName={leadProduct?.name ?? ''}
        context={leadProduct ? `Catégorie : ${leadProduct?.category ?? '-'}\nPrix : ${euroHT(leadProduct?.price)}` : ''}
      />
    </div>
  );
}
