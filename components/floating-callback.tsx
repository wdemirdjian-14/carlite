'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X, Send, Loader2, CheckCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { COMPANY_INFO, OPEN_CALLBACK_EVENT } from '@/lib/constants';

/**
 * Demande de rappel : bouton flottant sur desktop, ouvert depuis l'onglet « Rappel » de la barre
 * mobile (événement OPEN_CALLBACK_EVENT). Envoie vers /api/callback (enregistré en base + email).
 */
export function FloatingCallback() {
  const [open, setOpen] = useState(false);
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_CALLBACK_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CALLBACK_EVENT, onOpen);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/login')) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prenom.trim() || !telephone.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom: prenom.trim(), telephone: telephone.trim() }),
      });
      if (res.ok) {
        setSent(true);
        setTimeout(() => {
          setSent(false);
          setOpen(false);
          setPrenom('');
          setTelephone('');
        }, 3000);
      } else setError('Envoi impossible, appelez-nous directement.');
    } catch {
      setError('Envoi impossible, appelez-nous directement.');
    }
    setSending(false);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-black/40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="fixed z-[61] inset-x-0 bottom-0 lg:inset-x-auto lg:bottom-24 lg:right-6 lg:w-[340px] bg-card rounded-t-3xl lg:rounded-3xl shadow-2xl border border-border overflow-hidden pb-safe"
              role="dialog"
              aria-label="Être rappelé"
            >
              <div className="px-5 pt-5 pb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-display font-extrabold text-xl tracking-tight">On vous rappelle</h3>
                  <p className="text-sm text-muted-foreground">Gratuit, sous 24 h ouvrées.</p>
                </div>
                <button onClick={() => setOpen(false)} className="p-2 -m-1 rounded-full hover:bg-muted" aria-label="Fermer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {sent ? (
                <div className="px-5 py-8 text-center">
                  <CheckCircle className="h-12 w-12 text-brand-strong mx-auto mb-3" />
                  <p className="font-semibold">Demande envoyée !</p>
                  <p className="text-sm text-muted-foreground mt-1">Nous vous rappelons très vite.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3">
                  <input
                    type="text"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    placeholder="Votre prénom"
                    autoComplete="given-name"
                    required
                    className="w-full h-12 px-4 rounded-2xl border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <input
                    type="tel"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="Téléphone"
                    autoComplete="tel"
                    inputMode="tel"
                    required
                    className="w-full h-12 px-4 rounded-2xl border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  <button
                    type="submit"
                    disabled={sending || !prenom.trim() || !telephone.trim()}
                    className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-brand text-brand-foreground font-semibold hover:brightness-95 transition disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {sending ? 'Envoi…' : 'Être rappelé'}
                  </button>
                  <a href={COMPANY_INFO.phoneHref} className="block text-center text-sm text-muted-foreground">
                    ou appelez le <span className="font-semibold text-foreground">{COMPANY_INFO.phone}</span>
                  </a>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bouton flottant (desktop uniquement : sur mobile, c'est l'onglet « Rappel ») */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="hidden lg:flex fixed bottom-6 right-6 z-50 h-14 pl-4 pr-5 gap-2 rounded-full bg-brand text-brand-foreground font-semibold shadow-xl shadow-brand/30 items-center hover:scale-105 active:scale-95 transition-transform"
        aria-label="Être rappelé"
      >
        {open ? <X className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
        {open ? 'Fermer' : 'Être rappelé'}
      </button>
    </>
  );
}
