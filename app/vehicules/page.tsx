import Link from 'next/link';
import Image from 'next/image';
import { Battery, Gauge, Users, Wrench, ArrowUpRight, Settings2 } from 'lucide-react';
import { PageLayout } from '@/components/page-layout';
import { getVisibleVehicles } from '@/lib/catalog';
import { formatEuro } from '@/lib/pricing';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Véhicules électriques neufs',
  description: 'Quadricycles sans permis, golfettes et utilitaires électriques neufs CARLITE, livrés en kit avec montage en option chez nos partenaires.',
};

export default async function VehiculesPage() {
  const vehicles = await getVisibleVehicles();
  return (
    <PageLayout>
      <div className="max-w-[1240px] mx-auto px-4 pt-6 lg:pt-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-strong">Véhicules neufs</p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[0.95] mt-2">Choisissez votre électrique.</h1>
        <p className="text-muted-foreground mt-3 max-w-xl">Sans permis, golfettes, utilitaires. Chaque modèle se configure en ligne et se monte chez un partenaire agréé.</p>

        <div className="mt-6 flex items-start gap-3 rounded-3xl bg-muted p-4 sm:p-5 max-w-3xl">
          <Wrench className="h-5 w-5 shrink-0 mt-0.5 text-brand-strong" />
          <p className="text-sm">Nos véhicules sont livrés en kit, avec <span className="font-semibold">montage en option chez nos partenaires</span>.</p>
        </div>

        {vehicles.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">Aucun véhicule disponible pour le moment.</p>
        ) : (
          <div className="mt-8 grid md:grid-cols-2 gap-4 sm:gap-6">
            {vehicles.map((v: any, i: number) => {
              const price = v.promo?.discountedPrice > 0 ? v.promo.discountedPrice : v.basePrice;
              return (
                <article key={v.id} className="group rounded-[1.75rem] bg-card border border-border/70 overflow-hidden hover:shadow-xl hover:shadow-black/5 transition-shadow">
                  <Link href={`/vehicules/${v.slug}`} className="block relative aspect-[4/3] bg-muted overflow-hidden">
                    <Image src={v.imageUrl} alt={v.name} fill priority={i < 2} sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-4 left-4 flex gap-1.5">
                      <span className="px-3 py-1 rounded-full bg-background/90 text-xs font-semibold">{v.permitType}</span>
                      {v.category && <span className="px-3 py-1 rounded-full bg-brand text-brand-foreground text-xs font-semibold">{v.category}</span>}
                      {v.promo && <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-semibold">{v.promo.badge}</span>}
                    </div>
                    <span className="absolute top-4 right-4 h-10 w-10 rounded-full bg-background/90 flex items-center justify-center group-hover:rotate-45 transition-transform">
                      <ArrowUpRight className="h-5 w-5" />
                    </span>
                  </Link>
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">{v.name}</h2>
                        {v.tagline && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{v.tagline}</p>}
                      </div>
                      {price > 0 && (
                        <p className="text-right shrink-0 leading-tight">
                          <span className="block text-xs text-muted-foreground">à partir de</span>
                          <span className={`font-display text-2xl font-extrabold ${v.promo ? 'text-rose-600' : ''}`}>{formatEuro(price)} €</span>
                          <span className="block text-xs text-muted-foreground">HT</span>
                        </p>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {[
                        { Icon: Battery, v: v.range > 0 ? `${v.range} km` : '—', l: 'Autonomie' },
                        { Icon: Gauge, v: v.topSpeed > 0 ? `${v.topSpeed} km/h` : '—', l: 'Vitesse' },
                        { Icon: Users, v: `${v.seats}`, l: 'Places' },
                      ].map(({ Icon, v: val, l }) => (
                        <div key={l} className="p-3 rounded-2xl bg-muted">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <p className="font-semibold text-sm mt-1">{val}</p>
                          <p className="text-[11px] text-muted-foreground">{l}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Link href={`/vehicules/${v.slug}`} className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center">Découvrir</Link>
                      {v.hasConfigurator && (
                        <Link href={`/configurateur?vehicule=${v.slug}`} className="h-12 px-4 rounded-2xl border border-border font-semibold inline-flex items-center justify-center gap-2 hover:bg-muted">
                          <Settings2 className="h-4 w-4" /> Configurer
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
