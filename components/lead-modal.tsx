'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, CheckCircle } from 'lucide-react';

export type LeadType = 'quote' | 'information';

export function LeadModal({
  open,
  onClose,
  type,
  title,
  subtitle,
  subject,
  context,
  productName,
}: {
  open: boolean;
  onClose: () => void;
  type: LeadType;
  title: string;
  subtitle?: string;
  subject?: string;
  context?: string;
  productName?: string;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setFirstName(''); setLastName(''); setPhone(''); setEmail(''); setError(''); setSent(false);
  };

  const close = () => { onClose(); setTimeout(reset, 300); };

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    setError('');
    if (!firstName?.trim() || !phone?.trim() || sending) {
      setError('Veuillez renseigner au minimum votre nom et votre téléphone.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName?.trim(),
          lastName: lastName?.trim(),
          phone: phone?.trim(),
          email: email?.trim(),
          type,
          subject,
          context,
          productName,
        }),
      });
      const data = await res?.json?.();
      if (res?.ok && data?.success) {
        setSent(true);
        setTimeout(close, 2600);
      } else {
        setError(data?.message ?? 'Une erreur est survenue. Veuillez réessayer.');
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    }
    setSending(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-display font-bold text-lg">{title}</h3>
                  {subtitle && <p className="text-green-100 text-xs mt-1 max-w-[300px]">{subtitle}</p>}
                </div>
                <button onClick={close} className="text-white/80 hover:text-white transition-colors p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {sent ? (
              <div className="px-6 py-10 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="font-display font-bold">Demande envoyée !</p>
                <p className="text-sm text-muted-foreground mt-1">Nous vous recontactons rapidement.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
                {productName && (
                  <div className="text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2">
                    Concernant : <span className="font-medium text-foreground">{productName}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Prénom *</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e?.target?.value ?? '')} placeholder="Prénom" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Nom</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e?.target?.value ?? '')} placeholder="Nom" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Téléphone *</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e?.target?.value ?? '')} placeholder="06 XX XX XX XX" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e?.target?.value ?? '')} placeholder="vous@exemple.fr" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50" />
                </div>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {sending ? 'Envoi...' : (type === 'quote' ? 'Envoyer ma demande de devis' : 'Envoyer ma demande')}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
