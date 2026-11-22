import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

export type StockStatus = 'available' | 'restocking' | 'out_of_stock';

export const STOCK_LABELS: Record<StockStatus, string> = {
  available: 'Disponible',
  restocking: 'En cours de réapprovisionnement',
  out_of_stock: 'En rupture de stock',
};

export const STOCK_OPTIONS = [
  { value: 'available', label: 'Disponible' },
  { value: 'restocking', label: 'En cours de réapprovisionnement' },
  { value: 'out_of_stock', label: 'En rupture de stock' },
];

/**
 * Small pill showing the stock state of a product/vehicle.
 * `available` renders nothing by default (no badge needed) unless `showAvailable`.
 */
export function StockBadge({
  status,
  className,
  showAvailable = false,
}: {
  status?: string | null;
  className?: string;
  showAvailable?: boolean;
}) {
  const s = (status ?? 'available') as StockStatus;
  if (s === 'available' && !showAvailable) return null;

  const config: Record<StockStatus, { label: string; classes: string; Icon: any }> = {
    available: {
      label: STOCK_LABELS.available,
      classes: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
      Icon: CheckCircle2,
    },
    restocking: {
      label: STOCK_LABELS.restocking,
      classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
      Icon: Clock,
    },
    out_of_stock: {
      label: STOCK_LABELS.out_of_stock,
      classes: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
      Icon: XCircle,
    },
  };

  const { label, classes, Icon } = config[s];
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', classes, className)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
