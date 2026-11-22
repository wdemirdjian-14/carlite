import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { ProductImage } from '@/components/site/product-image';
import { formatEuro, htToTtc } from '@/lib/pricing';
import { isPriceOnRequest } from '@/lib/parts';
import { cn } from '@/lib/utils';

export function StockDot({ status, className }: { status?: string | null; className?: string }) {
  const map: Record<string, { label: string; dot: string }> = {
    available: { label: 'En stock', dot: 'bg-emerald-500' },
    restocking: { label: 'Réappro. en cours', dot: 'bg-amber-500' },
    out_of_stock: { label: 'Rupture', dot: 'bg-rose-500' },
  };
  const s = map[status ?? 'available'] ?? map.available;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
      <span className={cn('h-2 w-2 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}

export function PartCard({ part, label, priority }: { part: any; label?: string; priority?: boolean }) {
  const promo = part?.promo;
  const price = promo?.discountedPrice > 0 ? promo.discountedPrice : part?.price;
  const onRequest = isPriceOnRequest(price);
  return (
    <Link
      href={`/accessoires/${part.slug}`}
      className="group flex flex-col rounded-3xl bg-card border border-border/70 overflow-hidden hover:border-foreground/20 hover:shadow-xl hover:shadow-black/5 transition-all duration-300"
    >
      <div className="relative">
        <ProductImage
          src={part.imageUrl}
          alt={part.name}
          fit="contain"
          priority={priority}
          className="aspect-square bg-[#f3f3f0] dark:bg-white/5"
          imgClassName="group-hover:scale-105 transition-transform duration-500"
        />
        {promo && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-semibold">{promo.badge || 'Promo'}</span>
        )}
        <span className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <div className="flex flex-col flex-1 p-3 sm:p-4 gap-1.5">
        {label && <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate">{label}</span>}
        <h3 className="text-sm sm:text-[15px] font-semibold leading-snug line-clamp-2">{part.name}</h3>
        <div className="mt-auto pt-2 flex items-end justify-between gap-2">
          {onRequest ? (
            <span className="text-sm font-semibold">Sur devis</span>
          ) : (
            <span className="leading-tight">
              {promo && part.price > price && <span className="block text-xs text-muted-foreground line-through">{formatEuro(part.price)} €</span>}
              <span className={cn('font-display text-lg font-extrabold tracking-tight', promo && 'text-rose-600')}>{formatEuro(price)} €</span>
              <span className="text-[11px] text-muted-foreground"> HT</span>
              <span className="block text-[11px] text-muted-foreground">{formatEuro(htToTtc(price))} € TTC</span>
            </span>
          )}
        </div>
        <StockDot status={part.stockStatus} />
      </div>
    </Link>
  );
}
