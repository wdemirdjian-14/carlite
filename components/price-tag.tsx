import { cn } from '@/lib/utils';
import { formatEuro, htToTtc } from '@/lib/pricing';

/**
 * Prix HT (principal) avec l'équivalent TTC en petit dessous.
 * `ht` est le montant hors taxes enregistré. Un prix nul s'affiche « Prix sur demande ».
 */
export function PriceTag({
  ht,
  prefix,
  className,
  ttcClassName,
  showTtc = true,
  onRequestLabel = 'Prix sur demande',
}: {
  ht: number | null | undefined;
  prefix?: string;
  className?: string;
  ttcClassName?: string;
  showTtc?: boolean;
  onRequestLabel?: string | null;
}) {
  if (onRequestLabel && (!ht || ht <= 0)) {
    return (
      <span className="inline-flex flex-col leading-tight">
        <span className={cn(className, 'font-sans text-[0.8em] font-semibold')}>{onRequestLabel}</span>
        {showTtc && <span className={cn('text-xs font-normal text-muted-foreground', ttcClassName)}>Devis sous 24 h</span>}
      </span>
    );
  }
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
