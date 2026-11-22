import { PriceTag } from '@/components/price-tag';
import { euroHT } from '@/lib/pricing';

// Corner badge for a product image when it is on promotion.
export function PromoBadge({ promo, className }: { promo?: any; className?: string }) {
  if (!promo) return null;
  return (
    <div className={`px-2 py-1 rounded-md bg-rose-600 text-white text-xs font-semibold shadow-md ${className ?? ''}`}>
      {promo?.badge || 'Promo'}
    </div>
  );
}

// Renders a discounted price (original struck-through) when a promo exists,
// otherwise the normal HT price tag.
export function PromoPrice({
  promo,
  originalHt,
  prefix,
  className,
}: {
  promo?: any;
  originalHt?: number;
  prefix?: string;
  className?: string;
}) {
  if (!promo) {
    return <PriceTag ht={originalHt} prefix={prefix} className={className} />;
  }
  return (
    <div>
      {originalHt != null && originalHt > (promo?.discountedPrice ?? 0) && (
        <div className="text-xs text-muted-foreground line-through leading-none mb-0.5">{euroHT(originalHt)}</div>
      )}
      <PriceTag ht={promo?.discountedPrice ?? 0} prefix={prefix} className={`${className ?? ''} text-rose-600 dark:text-rose-400`} />
    </div>
  );
}
