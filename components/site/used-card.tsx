import Link from 'next/link';
import { Calendar, Gauge, BatteryCharging, Users } from 'lucide-react';
import { ProductImage } from '@/components/site/product-image';
import { formatEuro, htToTtc } from '@/lib/pricing';
import { cn } from '@/lib/utils';

export function usedPrice(v: any): number {
  return v?.promo?.discountedPrice > 0 ? v.promo.discountedPrice : v?.price ?? 0;
}

export function UsedCard({ v, priority }: { v: any; priority?: boolean }) {
  const price = usedPrice(v);
  const ref = v.promo ? v.price : v.originalPrice;
  const saving = ref > price ? ref - price : 0;
  return (
    <Link href={`/occasion/${v.slug}`} className="group flex flex-col rounded-3xl bg-card border border-border/70 overflow-hidden hover:shadow-xl hover:shadow-black/5 hover:border-foreground/20 transition-all duration-300">
      <div className="relative">
        <ProductImage src={v.imageUrl} alt={v.name} priority={priority} sizes="(max-width: 640px) 100vw, 33vw" className="aspect-[4/3]" imgClassName="group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          {v.condition && <span className="px-2.5 py-1 rounded-full bg-background/90 backdrop-blur text-xs font-semibold">{v.condition}</span>}
          {v.promo && <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-xs font-semibold">{v.promo.badge || 'Promo'}</span>}
        </div>
        {saving > 0 && (
          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-brand text-brand-foreground text-xs font-bold">−{formatEuro(saving)} €</span>
        )}
        {v.stockStatus && v.stockStatus !== 'available' && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-ink/80 text-white text-xs font-semibold">
            {v.stockStatus === 'out_of_stock' ? 'Vendu' : 'Réservé'}
          </span>
        )}
      </div>
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <h3 className="font-display text-lg font-extrabold tracking-tight leading-snug">{v.name}</h3>
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {v.year}</span>
          <span className="flex items-center gap-1.5"><Gauge className="h-4 w-4" /> {formatEuro(v.mileage)} km</span>
          <span className="flex items-center gap-1.5"><BatteryCharging className="h-4 w-4" /> {v.range > 0 ? `${v.range} km` : v.battery || '—'}</span>
          <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {v.seats} place{v.seats > 1 ? 's' : ''}</span>
        </div>
        <div className="mt-auto pt-4 flex items-end justify-between">
          <span className="leading-tight">
            {ref > price && <span className="block text-xs text-muted-foreground line-through">{formatEuro(ref)} € HT</span>}
            <span className={cn('font-display text-2xl font-extrabold tracking-tight', v.promo && 'text-rose-600')}>{formatEuro(price)} €</span>
            <span className="text-xs text-muted-foreground"> HT</span>
            <span className="block text-xs text-muted-foreground">{formatEuro(htToTtc(price))} € TTC</span>
          </span>
          <span className="text-sm font-semibold underline underline-offset-4 decoration-brand decoration-2">Voir</span>
        </div>
      </div>
    </Link>
  );
}
