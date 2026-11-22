'use client';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

/** Panneau qui monte du bas de l'écran (filtres mobiles). */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[65]">
          <motion.div className="absolute inset-0 bg-ink/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="dialog"
            aria-label={title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => info.offset.y > 120 && onClose()}
            className="absolute inset-x-0 bottom-0 max-h-[88vh] flex flex-col bg-background rounded-t-[1.75rem] shadow-2xl"
          >
            <div className="pt-3 pb-1 flex justify-center cursor-grab">
              <span className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <h2 className="font-display text-xl font-extrabold tracking-tight">{title}</h2>
              <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-muted" aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-4 overscroll-contain">{children}</div>
            {footer && <div className="p-4 border-t border-border pb-safe">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
