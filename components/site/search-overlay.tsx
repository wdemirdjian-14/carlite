'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, Loader2, ArrowRight, Wrench, Car, BadgeEuro, Newspaper, CornerDownLeft } from 'lucide-react';
import { OPEN_SEARCH_EVENT } from '@/lib/constants';
import { formatEuro } from '@/lib/pricing';
import { ProductImage } from '@/components/site/product-image';

const SUGGESTIONS = ['chargeur 48V', 'batterie lithium', 'phare LED', 'convertisseur DC/DC', 'afficheur', 'golfette'];

type Results = { accessories: any[]; vehicles: any[]; usedVehicles: any[]; articles: any[] };

/** Recherche instantanée globale (touche « / » ou bouton loupe). */
export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<Results | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA' || t?.isContentEditable;
      if (e.key === '/' && !typing) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setRes(null);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(term)}&limit=6`, { signal: ctrl.signal });
        setRes(await r.json());
      } catch {}
      setLoading(false);
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const total = res ? res.accessories.length + res.vehicles.length + res.usedVehicles.length + res.articles.length : 0;
  const goParts = () => router.push(`/accessoires?q=${encodeURIComponent(q.trim())}`);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
            className="relative bg-background h-full sm:h-auto sm:max-h-[80vh] sm:mt-[8vh] sm:max-w-2xl sm:mx-auto sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            role="dialog"
            aria-label="Recherche"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (q.trim()) goParts();
              }}
              className="flex items-center gap-2 p-3 border-b border-border"
            >
              <div className="flex-1 flex items-center gap-2 h-12 px-4 rounded-2xl bg-muted">
                {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Search className="h-5 w-5 text-muted-foreground" />}
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Pièce, référence, modèle…"
                  className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                  enterKeyHint="search"
                  autoComplete="off"
                />
                {q && (
                  <button type="button" onClick={() => setQ('')} className="p-1 rounded-full hover:bg-background" aria-label="Effacer">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button type="button" onClick={() => setOpen(false)} className="px-3 h-12 text-sm font-medium text-muted-foreground hover:text-foreground">
                Fermer
              </button>
            </form>

            <div className="flex-1 overflow-y-auto p-3">
              {!res && (
                <div className="p-2">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Recherches fréquentes</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} onClick={() => setQ(s)} className="px-3 py-1.5 rounded-full border border-border text-sm hover:bg-muted">
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-6">
                    {[
                      { href: '/accessoires', label: 'Pièces', Icon: Wrench },
                      { href: '/vehicules', label: 'Neufs', Icon: Car },
                      { href: '/occasion', label: 'Occasion', Icon: BadgeEuro },
                    ].map(({ href, label, Icon }) => (
                      <Link key={href} href={href} className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-muted hover:bg-muted/70 text-sm font-medium">
                        <Icon className="h-5 w-5" /> {label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {res && total === 0 && !loading && (
                <div className="text-center py-12 px-4">
                  <p className="font-semibold">Aucun résultat pour « {q} »</p>
                  <p className="text-sm text-muted-foreground mt-1">Essayez un autre mot, ou demandez-nous la pièce : nous la trouvons pour vous.</p>
                  <Link href="/contact" className="inline-flex mt-4 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    Demander une pièce
                  </Link>
                </div>
              )}

              {res && res.accessories.length > 0 && (
                <Group title="Pièces détachées" Icon={Wrench}>
                  {res.accessories.map((p) => (
                    <Row key={p.id} href={`/accessoires/${p.slug}`} img={p.imageUrl} title={p.name} sub={p.category} right={p.price > 0 ? `${formatEuro(p.promo?.discountedPrice || p.price)} € HT` : 'Sur devis'} />
                  ))}
                  <button onClick={goParts} className="w-full flex items-center justify-between px-3 py-3 rounded-2xl text-sm font-semibold hover:bg-muted">
                    Toutes les pièces pour « {q} » <ArrowRight className="h-4 w-4" />
                  </button>
                </Group>
              )}
              {res && res.vehicles.length > 0 && (
                <Group title="Véhicules neufs" Icon={Car}>
                  {res.vehicles.map((v) => (
                    <Row key={v.id} href={`/vehicules/${v.slug}`} img={v.imageUrl} title={v.name} sub={v.category} right={v.basePrice > 0 ? `dès ${formatEuro(v.basePrice)} € HT` : ''} />
                  ))}
                </Group>
              )}
              {res && res.usedVehicles.length > 0 && (
                <Group title="Occasions" Icon={BadgeEuro}>
                  {res.usedVehicles.map((v) => (
                    <Row key={v.id} href={`/occasion/${v.slug}`} img={v.imageUrl} title={v.name} sub={`${v.year} · ${formatEuro(v.mileage)} km`} right={`${formatEuro(v.price)} € HT`} />
                  ))}
                </Group>
              )}
              {res && res.articles.length > 0 && (
                <Group title="Conseils" Icon={Newspaper}>
                  {res.articles.map((a) => (
                    <Row key={a.id} href={`/articles/${a.slug}`} img={a.imageUrl} title={a.title} sub={a.category} />
                  ))}
                </Group>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 border-t border-border text-[11px] text-muted-foreground">
              <CornerDownLeft className="h-3 w-3" /> pour voir toutes les pièces · Échap pour fermer
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Group({ title, Icon, children }: { title: string; Icon: any; children: React.ReactNode }) {
  return (
    <section className="mb-4">
      <h3 className="flex items-center gap-2 px-2 mb-1 text-xs uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}

function Row({ href, img, title, sub, right }: { href: string; img?: string; title: string; sub?: string; right?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-muted">
      <ProductImage src={img} alt={title} className="w-12 h-12 rounded-xl shrink-0" sizes="48px" />
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium truncate">{title}</span>
        {sub && <span className="block text-xs text-muted-foreground truncate">{sub}</span>}
      </span>
      {right && <span className="text-xs font-semibold font-mono whitespace-nowrap">{right}</span>}
    </Link>
  );
}
