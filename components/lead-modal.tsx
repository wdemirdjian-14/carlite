'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, CheckCircle } from 'lucide-react';

export type LeadType = 'quote' | 'information';

/**
 * Formulaire de demande (devis / renseignement / rappel) : panneau bas sur mobile, fenêtre sur desktop.
 * Envoie vers /api/lead (enregistré dans « Demandes » de l'admin + email).
 */
export function LeadModal({
  open,
  onClose,
  type,
  title,
  subtitle,
  subject,
  context,
  productName,
  withMessage = true,
}: {
  open: boolean;
  onClose: () => void;
  type: LeadType;
  title: string;
  subtitle?: string;
  subject?: string;
  context?: string;
  productName?: string;
  withMessage?: boolean;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const reset = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setMessage('');
    setError('');
    setSent(false);
  };
  const close = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim() || !phone.trim() || sending) {
      setError('Indiquez au minimum votre prénom et votre téléphone.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          type,
          subject,
          context: [message.trim() && `Message : ${message.trim()}`, context].filter(Boolean).join('\n'),
          productName,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        setSent(true);
        setTimeout(close, 2600);
      } else setError(data?.message ?? 'Une erreur est survenue. Veuillez réessayer.');
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    }
    setSending(false);
  };

  const field = 'w-full h-12 px-4 rounded-2xl border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-brand';

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={close} />
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-card rounded-t-[1.75rem] sm:rounded-3xl shadow-2xl pb-safe"
            role="dialog"
            aria-label={title}
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-6">
              <div>
                <h3 className="font-display font-extrabold text-2xl tracking-tight">{title}</h3>
                {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
              </div>
              <button onClick={close} className="p-2 -m-1 rounded-full hover:bg-muted" aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {sent ? (
              <div className="px-6 py-12 text-center">
                <CheckCircle className="h-14 w-14 text-brand-strong mx-auto mb-3" />
                <p className="font-display text-xl font-extrabold">Demande envoyée !</p>
                <p className="text-sm text-muted-foreground mt-1">Nous vous recontactons rapidement.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
                {productName && (
                  <div className="text-sm bg-muted rounded-2xl px-4 py-3">
                    <span className="text-muted-foreground">Concernant : </span>
                    <span className="font-medium">{productName}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Prénom *" autoComplete="given-name" className={field} />
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nom" autoComplete="family-name" className={field} />
                </div>
                <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone *" autoComplete="tel" className={field} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="email" className={field} />
                {withMessage && (
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Votre message (référence, quantité, véhicule…)"
                    rows={3}
                    className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-brand resize-none"
                  />
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-brand text-brand-foreground font-semibold hover:brightness-95 transition disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {sending ? 'Envoi…' : type === 'quote' ? 'Recevoir mon devis' : 'Envoyer ma demande'}
                </button>
                <p className="text-[11px] text-center text-muted-foreground">Vos coordonnées servent uniquement à répondre à votre demande.</p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
