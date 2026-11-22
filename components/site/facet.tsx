'use client';
import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FacetOption = { value: string; label: string; count: number };

/** Groupe de filtres à choix multiples, présenté en pastilles avec compteur. */
export function FacetGroup({
  title,
  options,
  selected,
  onToggle,
  collapsible = true,
  initialVisible = 8,
}: {
  title: string;
  options: FacetOption[];
  selected: string[];
  onToggle: (value: string) => void;
  collapsible?: boolean;
  initialVisible?: number;
}) {
  const [open, setOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);
  if (!options.length) return null;
  const visible = showAll ? options : options.slice(0, initialVisible);
  return (
    <div className="py-4 border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => collapsible && setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-sm font-semibold mb-3"
        aria-expanded={open}
      >
        {title}
        {selected.length > 0 && <span className="ml-2 mr-auto text-xs font-medium px-2 py-0.5 rounded-full bg-brand text-brand-foreground">{selected.length}</span>}
        {collapsible && <ChevronDown className={cn('h-4 w-4 transition-transform', !open && '-rotate-90')} />}
      </button>
      {open && (
        <div className="flex flex-wrap gap-2">
          {visible.map((o) => {
            const on = selected.includes(o.value);
            const disabled = !on && o.count === 0;
            return (
              <button
                key={o.value}
                type="button"
                disabled={disabled}
                onClick={() => onToggle(o.value)}
                aria-pressed={on}
                className={cn(
                  'inline-flex items-center gap-1.5 h-9 px-3 rounded-full border text-sm transition-colors',
                  on ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-background hover:border-foreground/40',
                  disabled && 'opacity-40 cursor-not-allowed'
                )}
              >
                {on && <Check className="h-3.5 w-3.5" />}
                {o.label}
                <span className={cn('text-xs', on ? 'opacity-70' : 'text-muted-foreground')}>{o.count}</span>
              </button>
            );
          })}
          {options.length > initialVisible && (
            <button type="button" onClick={() => setShowAll((s) => !s)} className="h-9 px-3 text-sm font-medium underline underline-offset-4">
              {showAll ? 'Moins' : `+ ${options.length - initialVisible}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ToggleRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 py-3 cursor-pointer">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative w-11 h-6 rounded-full transition-colors shrink-0', checked ? 'bg-brand-strong' : 'bg-muted-foreground/30')}
      >
        <span className={cn('absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked && 'translate-x-5')} />
      </button>
    </label>
  );
}
