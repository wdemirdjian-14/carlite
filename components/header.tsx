'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Menu, X, Search, User, LogOut } from 'lucide-react';
import { NAV_LINKS } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession() || {};
  const pathname = usePathname();

  const isAdmin = (session?.user as any)?.role === 'admin';

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg border-b border-border">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/" className="flex items-center gap-2 font-display font-bold text-xl tracking-tight">
          <div className="relative w-10 h-10">
            <Image src="/logo-light.png" alt="CARLITE" fill className="object-contain dark:hidden" />
            <Image src="/logo-dark.png" alt="CARLITE" fill className="object-contain hidden dark:block" />
          </div>
          <span className="hidden sm:inline">CARLITE</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS?.map((link: any) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href || pathname?.startsWith?.(link.href + '/')
                  ? 'bg-primary/10 text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/recherche" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Search className="h-5 w-5" />
          </Link>
          {session?.user ? (
            <div className="hidden lg:flex items-center gap-2">
              {isAdmin && (
                <Link href="/admin" className="px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  Admin
                </Link>
              )}
              <button
                onClick={() => signOut?.({ callbackUrl: '/' })}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="hidden lg:flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
              <User className="h-4 w-4" />
              <span>Connexion</span>
            </Link>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border bg-white dark:bg-gray-950 overflow-hidden"
          >
            <div className="max-w-[1200px] mx-auto px-4 py-4 flex flex-col gap-1">
              {NAV_LINKS?.map((link: any) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/faq" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">FAQ</Link>
              <Link href="/contact" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">Contact</Link>
              {session?.user ? (
                <>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground">Admin</Link>
                  )}
                  <button onClick={() => { signOut?.({ callbackUrl: '/' }); setMobileOpen(false); }} className="px-3 py-2 rounded-lg text-sm font-medium text-left hover:bg-muted">
                    Déconnexion
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground">Connexion</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
