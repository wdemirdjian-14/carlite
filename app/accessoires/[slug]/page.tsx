import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Check, Zap, Tag, Layers, Car } from 'lucide-react';
import { PageLayout } from '@/components/page-layout';
import { Gallery } from '@/components/site/gallery';
import { PartCard, StockDot } from '@/components/site/part-card';
import { RequestActions } from '@/components/site/request-actions';
import { PriceTag } from '@/components/price-tag';
import { prisma } from '@/lib/prisma';
import { getVisibleParts, plain } from '@/lib/catalog';
import { getPromoMaps } from '@/lib/promotions';
import { euroHT } from '@/lib/pricing';
import { partBrand, partCategory, partType, partVoltages, OTHER_CATEGORY } from '@/lib/parts';
import { JsonLd } from '@/components/site/json-ld';
import { absUrl, breadcrumbJsonLd, partJsonLd, priceTtc } from '@/lib/seo';

export const dynamic = 'force-dynamic';

async function load(slug: string) {
  try {
    const part = await prisma.accessory.findUnique({ where: { slug } });
    if (!part || !part.published) return null;
    const { byAccessory } = await getPromoMaps();
    return plain({ ...part, promo: byAccessory[part.id] ?? null });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const part = await load(params.slug);
  if (!part) return { title: 'Pièce introuvable' };
  const price = part.promo?.discountedPrice > 0 ? part.promo.discountedPrice : part.price;
  const type = partType(part);
  const lead = price > 0 ? `${priceTtc(price).replace('.', ',')} € TTC` : 'Prix sur devis';
  return {
    title: `${part.name} – ${type}`,
    description: `${part.name} : ${lead}, ${part.stockStatus === 'available' ? 'en stock' : 'disponible sur commande'}. ${part.description && part.description !== part.name ? part.description : 'Pièce détachée pour quadricycle, golfette et utilitaire électrique.'}`.slice(0, 160),
    alternates: { canonical: `/accessoires/${part.slug}` },
    openGraph: { type: 'website', title: part.name, url: `/accessoires/${part.slug}`, images: part.imageUrl ? [absUrl(part.imageUrl)!] : undefined },
  };
}

export default async function PartPage({ params }: { params: { slug: string } }) {
  const part: any = await load(params.slug);
  if (!part) notFound();

  const cat = partCategory(part);
  const type = partType(part);
  const brand = partBrand(part);
  const volts = partVoltages(part);
  const price = part.promo?.discountedPrice > 0 ? part.promo.discountedPrice : part.price;

  let compatible: { name: string; href: string }[] = [];
  try {
    const [v, u] = await Promise.all([
      prisma.vehicle.findMany({ where: { id: { in: part.compatibleVehicleIds ?? [] }, published: true }, select: { name: true, slug: true } }),
      prisma.usedVehicle.findMany({ where: { id: { in: part.compatibleUsedVehicleIds ?? [] }, published: true }, select: { name: true, slug: true } }),
    ]);
    compatible = [...v.map((x) => ({ name: x.name, href: `/vehicules/${x.slug}` })), ...u.map((x) => ({ name: x.name, href: `/occasion/${x.slug}` }))];
  } catch {}

  const all = await getVisibleParts();
  const similar = all
    .filter((p: any) => p.id !== part.id)
    .map((p: any) => ({ p, s: (partType(p) === type ? 2 : 0) + (partCategory(p) === cat ? 1 : 0) + (brand && partBrand(p) === brand ? 1 : 0) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 4)
    .map((x) => x.p);

  const specs = [
    { Icon: Layers, label: 'Type', value: type },
    { Icon: Tag, label: 'Catégorie', value: cat !== OTHER_CATEGORY ? cat : null },
    { Icon: Zap, label: 'Tension', value: volts.length ? volts.map((v) => `${v} V`).join(' / ') : null },
    { Icon: Check, label: 'Marque', value: brand },
  ].filter((s) => s.value);

  return (
    <PageLayout>
      <JsonLd data={[partJsonLd(part, price), breadcrumbJsonLd([{ name: 'Accueil', path: '/' }, { name: 'Pièces détachées', path: '/accessoires' }, { name: part.name, path: `/accessoires/${part.slug}` }])]} />
      <div className="max-w-[1240px] mx-auto px-4 pt-4 lg:pt-8">
        <Link href="/accessoires" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4" /> Pièces détachées
        </Link>
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12">
          <Gallery
            images={[part.imageUrl, ...(part.gallery ?? [])]}
            alt={part.name}
            fit="contain"
            badge={part.promo ? <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-semibold">{part.promo.badge || 'Promo'}</span> : null}
          />
          <div className="lg:py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-strong">{cat !== OTHER_CATEGORY ? cat : type}</p>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mt-2">{part.name}</h1>
            <div className="mt-3"><StockDot status={part.stockStatus} className="text-sm" /></div>

            <div className="mt-6 p-5 rounded-3xl bg-muted">
              {part.promo && part.price > price && <p className="text-sm text-muted-foreground line-through">{euroHT(part.price)}</p>}
              <PriceTag ht={price} className={`font-display text-3xl font-extrabold tracking-tight ${part.promo ? 'text-rose-600' : ''}`} />
              {part.promo?.description && <p className="text-sm mt-3 whitespace-pre-line">{part.promo.description}</p>}
            </div>

            <div className="mt-6">
              <RequestActions
                label={price > 0 ? 'Commander / devis' : 'Demander un prix'}
                title={price > 0 ? 'Commander cette pièce' : 'Demander un prix'}
                subtitle="Un conseiller vous recontacte pour confirmer la disponibilité et la livraison."
                subject={`Pièce détachée – ${part.name}`}
                productName={part.name}
                context={`Pièce : ${part.name}\nPrix affiché : ${price > 0 ? euroHT(price) : 'sur devis'}\nLien : /accessoires/${part.slug}`}
              />
            </div>

            {specs.length > 0 && (
              <dl className="mt-8 grid grid-cols-2 gap-2">
                {specs.map(({ Icon, label, value }) => (
                  <div key={label} className="p-4 rounded-2xl border border-border">
                    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</dt>
                    <dd className="font-semibold mt-1 text-sm">{value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {part.description && part.description !== part.name && (
              <div className="mt-8">
                <h2 className="font-display text-lg font-extrabold">Description</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-foreground/85 whitespace-pre-line">{part.description}</p>
              </div>
            )}

            <div className="mt-8">
              <h2 className="font-display text-lg font-extrabold flex items-center gap-2"><Car className="h-5 w-5" /> Compatibilité</h2>
              {compatible.length ? (
                <div className="flex flex-wrap gap-2 mt-3">
                  {compatible.map((c) => (
                    <Link key={c.href} href={c.href} className="px-3 py-1.5 rounded-full bg-muted text-sm font-medium hover:bg-muted/70">{c.name}</Link>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Un doute sur la compatibilité avec votre véhicule ? Indiquez son modèle dans votre demande, nous vérifions pour vous.</p>
              )}
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <section className="mt-16">
            <div className="flex items-end justify-between mb-4">
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">Dans le même rayon</h2>
              <Link href={`/accessoires?type=${encodeURIComponent(type)}`} className="text-sm font-semibold underline underline-offset-4">Tout voir</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {similar.map((p: any) => <PartCard key={p.id} part={p} label={partType(p)} />)}
            </div>
          </section>
        )}
      </div>
    </PageLayout>
  );
}
