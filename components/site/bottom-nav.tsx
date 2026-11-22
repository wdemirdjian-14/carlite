'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wrench, Car, BadgeEuro, PhoneCall } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OPEN_CALLBACK_EVENT } from '@/lib/constants';

const TABS = [
  { href: '/', label: 'Accueil', Icon: Home },
  { href: '/accessoires', label: 'Pièces', Icon: Wrench },
  { href: '/vehicules', label: 'Neufs', Icon: Car },
  { href: '/occasion', label: 'Occasion', Icon: BadgeEuro },
] as const;

/** Barre d'onglets façon application, visible uniquement sur mobile / tablette. */
export function BottomNav() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/login')) return null;
  const active = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname?.startsWith(href + '/'));

  return (
    <nav
      aria-label="Navigation mobile"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border pb-safe"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        {TABS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
              active(href) ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            <span className={cn('flex items-center justify-center w-12 h-7 rounded-full transition-colors', active(href) && 'bg-brand text-brand-foreground')}>
              <Icon className="h-[18px] w-[18px]" strokeWidth={active(href) ? 2.4 : 2} />
            </span>
            {label}
          </Link>
        ))}
        <button
          onClick={() => window.dispatchEvent(new Event(OPEN_CALLBACK_EVENT))}
          className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground"
        >
          <span className="flex items-center justify-center w-12 h-7 rounded-full bg-primary text-primary-foreground">
            <PhoneCall className="h-[16px] w-[16px]" />
          </span>
          Rappel
        </button>
      </div>
    </nav>
  );
}
