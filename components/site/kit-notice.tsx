'use client';
import { useState } from 'react';
import { PackageOpen, ArrowRight } from 'lucide-react';
import { LeadModal } from '@/components/lead-modal';
import { cn } from '@/lib/utils';

export const KIT_TEXT =
  "Nos véhicules neufs sont vendus en kit, non montés. Pour l'assemblage, nous vous mettons en relation avec l'un de nos partenaires monteurs partout en France.";

/** Mention obligatoire sur les véhicules neufs : livraison en kit non monté + mise en relation avec un monteur. */
export function KitNotice({ vehicleName, compact = false, className }: { vehicleName?: string; compact?: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn('flex gap-3 rounded-3xl border-2 border-dashed border-brand-strong/40 bg-brand/10', compact ? 'p-4' : 'p-5', className)}>
      <PackageOpen className="h-6 w-6 shrink-0 text-brand-strong" />
      <div className="text-sm">
        <p className="font-semibold">Véhicule livré en kit, non monté</p>
        <p className="text-muted-foreground mt-1">
          Pour l’assemblage, contactez l’un de nos <span className="text-foreground font-medium">partenaires monteurs en France</span> : nous vous orientons vers le plus proche de chez vous.
        </p>
        <button onClick={() => setOpen(true)} className="mt-2 inline-flex items-center gap-1 font-semibold underline underline-offset-4 decoration-brand-strong decoration-2">
          Trouver un partenaire monteur <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <LeadModal
        open={open}
        onClose={() => setOpen(false)}
        type="information"
        title="Trouver un partenaire monteur"
        subtitle="Indiquez votre ville ou code postal dans le message : nous vous mettons en relation avec un partenaire proche de chez vous."
        subject={`Mise en relation partenaire monteur${vehicleName ? ` – ${vehicleName}` : ''}`}
        productName={vehicleName ? `Montage ${vehicleName}` : 'Montage d’un véhicule en kit'}
        context="Demande de mise en relation avec un partenaire monteur (véhicule livré en kit, non monté)"
      />
    </div>
  );
}
