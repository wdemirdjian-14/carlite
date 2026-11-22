'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X, Send, Loader2, CheckCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function FloatingCallback() {
  const [open, setOpen] = useState(false);
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Hide on admin pages
  if (pathname?.startsWith?.('/admin') || pathname?.startsWith?.('/login')) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    if (!prenom?.trim() || !telephone?.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom: prenom?.trim(), telephone: telephone?.trim() }),
      });
      if (res?.ok) {
        setSent(true);
        setTimeout(() => {
          setSent(false);
          setOpen(false);
          setPrenom('');
          setTelephone('');
        }, 3000);
      }
    } catch {}
    setSending(false);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={formRef}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[300px] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            <div className="bg-gradient-to-r from-green-600 to-green-500 px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-display font-bold text-sm">Être rappelé</h3>
                  <p className="text-green-100 text-xs mt-0.5">Nous vous rappelons rapidement</p>
                </div>
                <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white transition-colors p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {sent ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <p className="font-medium text-sm">Demande envoyée !</p>
                <p className="text-xs text-muted-foreground mt-1">Nous vous rappelons très vite.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Prénom</label>
                  <input
                    type="text"
                    value={prenom}
                    onChange={(e) => setPrenom(e?.target?.value ?? '')}
                    placeholder="Votre prénom"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={telephone}
                    onChange={(e) => setTelephone(e?.target?.value ?? '')}
                    placeholder="06 XX XX XX XX"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending || !prenom?.trim() || !telephone?.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {sending ? 'Envoi...' : 'Demander un rappel'}
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating phone button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full bg-green-600 text-white shadow-lg shadow-green-600/30 flex items-center justify-center hover:bg-green-700 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={open ? {} : { boxShadow: ['0 0 0 0 rgba(22,163,74,0.4)', '0 0 0 12px rgba(22,163,74,0)', '0 0 0 0 rgba(22,163,74,0.4)'] }}
        transition={open ? {} : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {open ? <X className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
      </motion.button>
    </>
  );
}
