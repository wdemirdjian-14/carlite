'use client';
import { useState } from 'react';
import { Phone, MessageSquareText } from 'lucide-react';
import { LeadModal, type LeadType } from '@/components/lead-modal';
import { COMPANY_INFO } from '@/lib/constants';

/**
 * Boutons d'action d'une fiche (devis / appel). Sur mobile, une barre fixe reste accessible
 * au-dessus de la navigation pendant le défilement.
 */
export function RequestActions({
  label,
  type = 'quote',
  title,
  subtitle,
  subject,
  productName,
  context,
}: {
  label: string;
  type?: LeadType;
  title: string;
  subtitle?: string;
  subject: string;
  productName: string;
  context?: string;
}) {
  const [open, setOpen] = useState(false);
  const buttons = (
    <>
      <button onClick={() => setOpen(true)} className="flex-1 h-12 sm:h-14 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand text-brand-foreground font-semibold hover:brightness-95 transition">
        <MessageSquareText className="h-5 w-5" /> {label}
      </button>
      <a href={COMPANY_INFO.phoneHref} className="h-12 sm:h-14 px-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground font-semibold" aria-label="Appeler">
        <Phone className="h-5 w-5" /> <span className="hidden sm:inline">Appeler</span>
      </a>
    </>
  );
  return (
    <>
      <div className="hidden lg:flex gap-2">{buttons}</div>
      <div className="lg:hidden fixed inset-x-0 z-30 px-4 py-3 bg-background/90 backdrop-blur-xl border-t border-border flex gap-2" style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        {buttons}
      </div>
      {/* réserve la place de la barre fixe en bas de page sur mobile */}
      <div className="lg:hidden h-20" aria-hidden />
      <LeadModal open={open} onClose={() => setOpen(false)} type={type} title={title} subtitle={subtitle} subject={subject} productName={productName} context={context} />
    </>
  );
}
