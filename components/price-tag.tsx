import { cn } from '@/lib/utils';
import { formatEuro, htToTtc } from '@/lib/pricing';

/**
 * Displays a price as HT (main) with the TTC equivalent in small text below.
 * `ht` is the stored (hors taxes) amount.
 */
export function PriceTag({
  ht,
  prefix,
  className,
  ttcClassName,
  showTtc = true,
}: {
  ht: number | null | undefined;
  prefix?: string;
  className?: string;
  ttcClassName?: string;
  showTtc?: boolean;
}) {
  const ttc = htToTtc(ht);
  return (
    <span className="inline-flex flex-col leading-tight">
      <span className={className}>
        {prefix ? `${prefix} ` : ''}{formatEuro(ht)} € <span className="text-[0.65em] font-normal opacity-70 align-baseline">HT</span>
      </span>
      {showTtc && (
        <span className={cn('text-xs font-normal text-muted-foreground', ttcClassName)}>
          soit {formatEuro(ttc)} € TTC
        </span>
      )}
    </span>
  );
}
