import Link from 'next/link';
import Image from 'next/image';
import { COMPANY_INFO } from '@/lib/constants';
import { Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-gray-950 text-gray-300">
      <div className="max-w-[1200px] mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2 font-display font-bold text-lg text-white">
              <div className="relative w-8 h-8">
                <Image src="/logo-dark.png" alt="CARLITE" fill className="object-contain" />
              </div>
              CARLITE
            </Link>
            <p className="text-sm text-gray-400 max-w-xs">
              100% électrique. Quadricycles, voiturettes de golf et utilitaires électriques. Conçus et assemblés en France.
            </p>
            <div className="flex flex-col gap-1.5 mt-2 text-sm text-gray-400">
              <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {COMPANY_INFO.phone}</div>
              <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {COMPANY_INFO.email}</div>
              <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {COMPANY_INFO.address}</div>
            </div>
          </div>
          <div className="flex gap-12">
            <div className="flex flex-col gap-2">
              <h4 className="font-display font-semibold text-sm text-white">Explorer</h4>
              <Link href="/vehicules" className="text-sm text-gray-400 hover:text-white transition-colors">Véhicules</Link>
              <Link href="/accessoires" className="text-sm text-gray-400 hover:text-white transition-colors">Pièces détachées</Link>
              <Link href="/occasion" className="text-sm text-gray-400 hover:text-white transition-colors">Occasion</Link>
              <Link href="/articles" className="text-sm text-gray-400 hover:text-white transition-colors">Articles</Link>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="font-display font-semibold text-sm text-white">Aide</h4>
              <Link href="/faq" className="text-sm text-gray-400 hover:text-white transition-colors">FAQ</Link>
              <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</Link>
              <Link href="/recharge" className="text-sm text-gray-400 hover:text-white transition-colors">Recharge</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-xs text-gray-500">
          © 2026 {COMPANY_INFO.name}. Tous droits réservés. SIREN {COMPANY_INFO.siren}
        </div>
      </div>
    </footer>
  );
}
