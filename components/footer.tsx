import Link from 'next/link';
import Image from 'next/image';
import { COMPANY_INFO, NAV_LINKS, SECONDARY_LINKS } from '@/lib/constants';
import { Phone, Mail, MapPin, Store } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-ink text-white/70 rounded-t-[2rem] mt-16 pb-mobile-nav">
      <div className="max-w-[1240px] mx-auto px-4 pt-12 pb-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-white">
              <span className="relative w-9 h-9">
                <Image src="/logo-dark.png" alt="" fill sizes="36px" className="object-contain" />
              </span>
              <span className="font-display font-extrabold text-xl tracking-tight">CARLITE</span>
            </Link>
            <p className="mt-4 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white max-w-sm leading-tight">
              Roulez électrique. <span className="text-brand">On s’occupe du reste.</span>
            </p>
            <div className="mt-6 flex flex-col gap-2 text-sm">
              <a href={COMPANY_INFO.phoneHref} className="flex items-center gap-2 hover:text-white"><Phone className="h-4 w-4 text-brand" /> {COMPANY_INFO.phone}</a>
              <a href={`mailto:${COMPANY_INFO.email}`} className="flex items-center gap-2 hover:text-white"><Mail className="h-4 w-4 text-brand" /> {COMPANY_INFO.email}</a>
              <span className="flex items-start gap-2"><MapPin className="h-4 w-4 text-brand shrink-0 mt-0.5" /> {COMPANY_INFO.address}</span>
              <span className="flex items-start gap-2"><Store className="h-4 w-4 text-brand shrink-0 mt-0.5" /> Showroom : {COMPANY_INFO.showroom}</span>
            </div>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest text-white/40 mb-4">Explorer</h4>
            <ul className="space-y-2.5 text-sm">
              {NAV_LINKS.map((l) => (
                <li key={l.href}><Link href={l.href} className="hover:text-white">{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest text-white/40 mb-4">Aide</h4>
            <ul className="space-y-2.5 text-sm">
              {SECONDARY_LINKS.map((l) => (
                <li key={l.href}><Link href={l.href} className="hover:text-white">{l.label}</Link></li>
              ))}
              <li><Link href="/recherche" className="hover:text-white">Recherche</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-2 justify-between text-xs text-white/40">
          <span>© {new Date().getFullYear()} {COMPANY_INFO.name} — SIREN {COMPANY_INFO.siren}</span>
          <span>Prix affichés HT, TVA 20 % en sus.</span>
        </div>
      </div>
    </footer>
  );
}
