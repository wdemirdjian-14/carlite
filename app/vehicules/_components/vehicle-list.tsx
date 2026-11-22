'use client';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Battery, Gauge, Users, ArrowRight } from 'lucide-react';
import { PriceTag } from '@/components/price-tag';
import { StockBadge } from '@/components/stock-badge';
import { PromoBadge, PromoPrice } from '@/components/promo-price';

export function VehicleList({ vehicles }: { vehicles: any[] }) {
  const safe = vehicles ?? [];
  if (safe.length === 0) {
    return <div className="text-center py-20 text-muted-foreground">Aucun véhicule disponible pour le moment.</div>;
  }
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {safe.map((v: any, i: number) => (
        <motion.div
          key={v?.id ?? i}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
        >
          <Link href={`/vehicules/${v?.slug ?? ''}`}>
            <div className="group bg-card rounded-xl overflow-hidden shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 hover:-translate-y-1">
              <div className="relative aspect-[4/3] bg-muted">
                <Image src={v?.imageUrl ?? ''} alt={v?.name ?? 'Véhicule'} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-gray-900/80 text-white text-xs font-medium backdrop-blur-sm">
                  {v?.permitType ?? v?.category ?? ''}
                </div>
                {v?.promo && <PromoBadge promo={v.promo} className="absolute top-3 right-3" />}
              </div>
              <div className="p-6">
                <div className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">{v?.category ?? ''}</div>
                <h3 className="font-display font-bold text-xl mb-1">{v?.name ?? ''}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{v?.tagline ?? ''}</p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                    <Battery className="h-4 w-4 text-green-600 dark:text-green-400 mb-1" />
                    <span className="text-xs font-mono font-semibold">{v?.range ?? 0} km</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                    <Gauge className="h-4 w-4 text-green-600 dark:text-green-400 mb-1" />
                    <span className="text-xs font-mono font-semibold">{v?.topSpeed ?? 0} km/h</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                    <Users className="h-4 w-4 text-green-600 dark:text-green-400 mb-1" />
                    <span className="text-xs font-mono font-semibold">{v?.seats ?? 2} pl.</span>
                  </div>
                </div>
                <div className="mb-2"><StockBadge status={v?.stockStatus} /></div>
                <div className="flex items-center justify-between">
                  <PromoPrice promo={v?.promo} originalHt={v?.basePrice} prefix="à partir de" className="font-mono font-bold text-lg" />
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
