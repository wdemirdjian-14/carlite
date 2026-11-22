import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Calendar, Gauge, BatteryCharging, Users, Palette, ShieldCheck, FileText, Battery, Check } from 'lucide-react';
import { PageLayout } from '@/components/page-layout';
import { Gallery } from '@/components/site/gallery';
import { RequestActions } from '@/components/site/request-actions';
import { UsedCard, usedPrice } from '@/components/site/used-card';
import { PriceTag } from '@/components/price-tag';
import { prisma } from '@/lib/prisma';
import { getVisibleUsedVehicles, plain } from '@/lib/catalog';
import { getPromoMaps } from '@/lib/promotions';
import { euroHT, formatEuro } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

async function load(slug: string) {
  try {
    const v = await prisma.usedVehicle.findUnique({ where: { slug } });
    if (!v || !v.published) return null;
    const { byUsed } = await getPromoMaps();
    return plain({ ...v, promo: byUsed[v.id] ?? null });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const v = await load(params.slug);
  if (!v) return { title: 'Véhicule introuvable' };
  return {
    title: `${v.name} d'occasion`,
    description: `${v.name} — ${v.year}, ${formatEuro(v.mileage)} km, ${v.condition}. ${v.description}`.slice(0, 160),
    openGraph: { images: v.imageUrl ? [v.imageUrl] : undefined },
  };
}

export default async function UsedPage({ params }: { params: { slug: string } }) {
  const v: any = await load(params.slug);
  if (!v) notFound();
  const price = usedPrice(v);
  const ref = v.promo ? v.price : v.originalPrice;
  const saving = ref > price ? ref - price : 0;
  const sold = v.stockStatus === 'out_of_stock' || !v.available;

  const specs = [
    { Icon: Calendar, label: 'Année', value: v.year },
    { Icon: Gauge, label: 'Kilométrage', value: `${formatEuro(v.mileage)} km` },
    { Icon: BatteryCharging, label: 'Autonomie', value: v.range > 0 ? `${v.range} km` : null },
    { Icon: Battery, label: 'Batterie', value: v.battery },
    { Icon: Users, label: 'Places', value: v.seats },
    { Icon: Palette, label: 'Couleur', value: v.color },
    { Icon: ShieldCheck, label: 'État', value: v.condition },
    { Icon: FileText, label: 'Permis', value: v.permitType || null },
    { Icon: FileText, label: 'Homologation', value: v.homologation || null },
  ].filter((s) => s.value !== null && s.value !== '' && s.value !== undefined);

  const others = (await getVisibleUsedVehicles()).filter((o: any) => o.id !== v.id).slice(0, 3);

  return (
    <PageLayout>
      <div className="max-w-[1240px] mx-auto px-4 pt-4 lg:pt-8">
        <Link href="/occasion" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4" /> Occasions
        </Link>
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 lg:gap-12">
          <Gallery
            images={[v.imageUrl, ...(v.gallery ?? [])]}
            alt={v.name}
            badge={
              <span className="flex gap-1.5">
                {v.condition && <span className="px-3 py-1 rounded-full bg-background/90 text-xs font-semibold">{v.condition}</span>}
                {v.promo && <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-semibold">{v.promo.badge || 'Promo'}</span>}
              </span>
            }
          />
          <div className="lg:py-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-strong">Occasion · {v.year}</p>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mt-2">{v.name}</h1>

            <div className="mt-5 p-5 rounded-3xl bg-muted">
              {ref > price && <p className="text-sm text-muted-foreground line-through">{euroHT(ref)} neuf</p>}
              <PriceTag ht={price} className={`font-display text-3xl font-extrabold tracking-tight ${v.promo ? 'text-rose-600' : ''}`} />
              {saving > 0 && (
                <p className="mt-3 inline-flex px-3 py-1 rounded-full bg-brand text-brand-foreground text-sm font-bold">Vous économisez {formatEuro(saving)} € HT</p>
              )}
              {sold && <p className="mt-3 text-sm font-semibold text-rose-600">Ce véhicule est déjà réservé — nous pouvons vous en trouver un similaire.</p>}
            </div>

            <div className="mt-5">
              <RequestActions
                label={sold ? 'Trouver un similaire' : 'Réserver un essai'}
                type="quote"
                title={sold ? 'Un véhicule similaire' : 'Essai / réservation'}
                subtitle="Un conseiller vous rappelle pour organiser l’essai et répondre à vos questions (financement, reprise, livraison)."
                subject={`Occasion – ${v.name}`}
                productName={v.name}
                context={`Année : ${v.year}\nKilométrage : ${formatEuro(v.mileage)} km\nPrix : ${euroHT(price)}\nLien : /occasion/${v.slug}`}
              />
            </div>

            <dl className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {specs.map(({ Icon, label, value }) => (
                <div key={label} className="p-4 rounded-2xl border border-border">
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</dt>
                  <dd className="font-semibold mt-1 text-sm">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-12 mt-10">
          <div>
            {v.description && (
              <>
                <h2 className="font-display text-2xl font-extrabold tracking-tight">Le mot de l’atelier</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-foreground/85 whitespace-pre-line">{v.description}</p>
              </>
            )}
            {v.features?.length > 0 && (
              <ul className="mt-6 grid sm:grid-cols-2 gap-2">
                {v.features.map((f: string) => (
                  <li key={f} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-brand-strong" /> {f}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-3xl bg-ink text-white p-6">
            <h2 className="font-display text-xl font-extrabold">Inclus avec votre occasion CARLITE</h2>
            <ul className="mt-4 space-y-3 text-sm text-white/80">
              {['Contrôle complet en atelier (batterie, freins, éclairage)', 'Pièces détachées disponibles en stock', 'Conseils de prise en main et d’entretien', 'Reprise de votre ancien véhicule possible'].map((t) => (
                <li key={t} className="flex gap-2"><Check className="h-4 w-4 text-brand shrink-0 mt-0.5" /> {t}</li>
              ))}
            </ul>
          </div>
        </div>

        {others.length > 0 && (
          <section className="mt-16">
            <div className="flex items-end justify-between mb-4">
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">Autres occasions</h2>
              <Link href="/occasion" className="text-sm font-semibold underline underline-offset-4">Tout voir</Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {others.map((o: any) => <UsedCard key={o.id} v={o} />)}
            </div>
          </section>
        )}
      </div>
    </PageLayout>
  );
}
