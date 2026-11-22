'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Menu, X, Search, LogOut, Phone, LayoutDashboard, ArrowUpRight } from 'lucide-react';
import { COMPANY_INFO, NAV_LINKS, SECONDARY_LINKS, OPEN_SEARCH_EVENT } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function openSearch() {
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session } = useSession() || {};
  const pathname = usePathname();
  const isAdmin = (session?.user as any)?.role === 'admin';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 w-full transition-all duration-300',
          scrolled || menuOpen ? 'bg-background/85 backdrop-blur-xl border-b border-border' : 'bg-background border-b border-transparent'
        )}
      >
        <div className="max-w-[1240px] mx-auto flex items-center gap-3 h-16 px-4">
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="CARLITE — accueil">
            <span className="relative w-9 h-9">
              <Image src="/logo-light.png" alt="" fill sizes="36px" className="object-contain dark:hidden" priority />
              <Image src="/logo-dark.png" alt="" fill sizes="36px" className="object-contain hidden dark:block" priority />
            </span>
            <span className="font-display font-extrabold text-lg tracking-tight">CARLITE</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-4" aria-label="Navigation principale">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  isActive(link.href) ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive(link.href) && (
                  <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-muted" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                )}
                <span className="relative">{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Recherche : barre sur desktop, icône sur mobile */}
          <button
            onClick={openSearch}
            className="hidden md:flex flex-1 max-w-xs ml-auto items-center gap-2 h-10 px-4 rounded-full bg-muted text-sm text-muted-foreground hover:bg-muted/70 transition-colors"
          >
            <Search className="h-4 w-4" />
            <span className="truncate">Rechercher une pièce, un modèle…</span>
            <kbd className="ml-auto hidden xl:inline text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-background">/</kbd>
          </button>

          <div className="flex items-center gap-1 ml-auto md:ml-0">
            <button onClick={openSearch} className="md:hidden p-2.5 rounded-full hover:bg-muted" aria-label="Rechercher">
              <Search className="h-5 w-5" />
            </button>
            <a
              href={COMPANY_INFO.phoneHref}
              className="hidden 2xl:inline-flex whitespace-nowrap items-center gap-2 h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Phone className="h-4 w-4" /> {COMPANY_INFO.phone}
            </a>
            {isAdmin && (
              <Link href="/admin" className="hidden lg:inline-flex p-2.5 rounded-full hover:bg-muted" aria-label="Administration" title="Administration">
                <LayoutDashboard className="h-5 w-5" />
              </Link>
            )}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="p-2.5 rounded-full hover:bg-muted"
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Menu plein écran */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-16 z-40 bg-background overflow-y-auto"
          >
            <div className="max-w-[1240px] mx-auto px-4 py-6 pb-mobile-nav grid lg:grid-cols-3 gap-8">
              <nav className="lg:col-span-2 flex flex-col">
                {[{ href: '/', label: 'Accueil' }, ...NAV_LINKS].map((link, i) => (
                  <motion.div key={link.href} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}>
                    <Link
                      href={link.href}
                      className="group flex items-center justify-between py-3 border-b border-border font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground/85 hover:text-foreground"
                    >
                      {link.label}
                      <ArrowUpRight className="h-6 w-6 text-muted-foreground group-hover:text-foreground group-hover:rotate-45 transition-transform" />
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-2">
                  {SECONDARY_LINKS.map((l) => (
                    <Link key={l.href} href={l.href} className="px-4 py-3 rounded-2xl bg-muted text-sm font-medium hover:bg-muted/70">
                      {l.label}
                    </Link>
                  ))}
                </div>
                <div className="rounded-3xl bg-primary text-primary-foreground p-5">
                  <p className="text-sm opacity-70">Un conseiller vous répond</p>
                  <a href={COMPANY_INFO.phoneHref} className="block font-display text-2xl font-extrabold mt-1">{COMPANY_INFO.phone}</a>
                  <a href={`mailto:${COMPANY_INFO.email}`} className="block text-sm opacity-80 mt-1">{COMPANY_INFO.email}</a>
                </div>
                {session?.user ? (
                  <div className="flex gap-2">
                    {isAdmin && (
                      <Link href="/admin" className="flex-1 text-center px-4 py-3 rounded-2xl bg-brand text-brand-foreground text-sm font-semibold">
                        Administration
                      </Link>
                    )}
                    <button onClick={() => signOut({ callbackUrl: '/' })} className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-border text-sm font-medium">
                      <LogOut className="h-4 w-4" /> Déconnexion
                    </button>
                  </div>
                ) : (
                  <Link href="/login" className="text-sm text-muted-foreground underline underline-offset-4">
                    Espace professionnel / connexion
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
