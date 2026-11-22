import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Wrench, Car, BadgeEuro, Zap, Battery, Gauge, Users, ShieldCheck, Truck, Headphones, Sparkles } from 'lucide-react';
import { PageLayout } from '@/components/page-layout';
import { HeroSearch } from './_components/hero-search';
import { ExpertContactForm } from './_components/expert-contact-form';
import { PartCard } from '@/components/site/part-card';
import { UsedCard } from '@/components/site/used-card';
import { ProductImage } from '@/components/site/product-image';
import { prisma } from '@/lib/prisma';
import { getVisibleParts, getVisibleUsedVehicles, getVisibleVehicles } from '@/lib/catalog';
import { getFeaturedPromotions } from '@/lib/promotions';
import { formatEuro } from '@/lib/pricing';
import { partType } from '@/lib/parts';
import { COMPANY_INFO } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [parts, used, vehicles, promotions] = await Promise.all([getVisibleParts(), getVisibleUsedVehicles(), getVisibleVehicles(), getFeaturedPromotions()]);
  let articles: any[] = [];
  try {
    articles = await prisma.article.findMany({
      where: { published: true, OR: [{ publishDate: null }, { publishDate: { lte: new Date() } }] },
      orderBy: [{ featured: 'desc' }, { publishDate: 'desc' }],
      take: 4,
    });
  } catch {}

  // Rayons de pièces avec leur nombre de références et une photo représentative
  const rayons = Object.values(
    parts.reduce((acc: Record<string, { type: string; count: number; img: string }>, p: any) => {
      const t = partType(p);
      acc[t] ??= { type: t, count: 0, img: p.imageUrl };
      acc[t].count++;
      return acc;
    }, {})
  )
    .filter((r) => r.type !== 'Divers')
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const highlightedParts = [...parts].sort((a: any, b: any) => Number(!!b.promo) - Number(!!a.promo) || Number(b.price > 0) - Number(a.price > 0)).slice(0, 8);
  const minUsed = Math.min(...used.map((u: any) => u.price).filter((p: number) => p > 0));
  const heroVehicle: any = vehicles.find((v: any) => v.featured) ?? vehicles[0];

  return (
    <PageLayout>
      {/* ===== HERO ===== */}
      <section className="px-2 sm:px-4 pt-2">
        <div className="relative max-w-[1400px] mx-auto overflow-hidden rounded-[2rem] bg-ink text-white">
          <div className="absolute inset-0 bg-grid opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top_left,black_30%,transparent_75%)]" />
          <div className="absolute -top-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-brand/25 blur-[120px]" />
          <div className="relative grid lg:grid-cols-[1.15fr_1fr] gap-10 px-5 sm:px-10 lg:px-14 pt-10 sm:pt-16 pb-8 lg:pb-16">
            <div className="flex flex-col justify-center min-w-0">
              <span className="inline-flex w-fit items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-xs font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" /> Atelier & stock à Boulogne-Billancourt
              </span>
              <h1 className="mt-5 font-display font-extrabold tracking-tight leading-[0.92] text-[2.9rem] sm:text-6xl lg:text-7xl">
                L’électrique,
                <br />
                <span className="text-gradient-brand">pièce par pièce.</span>
              </h1>
              <p className="mt-5 text-white/70 text-base sm:text-lg max-w-lg">
                Pièces détachées, quadricycles, golfettes et utilitaires électriques. Neuf, occasion révisée, entretien : un seul interlocuteur depuis plus de 20 ans.
              </p>
              <div className="mt-8 max-w-xl">
                <HeroSearch />
              </div>
            </div>
            <div className="relative hidden lg:block">
              {heroVehicle && (
                <Link href={`/vehicules/${heroVehicle.slug}`} className="group absolute inset-0 rounded-[1.5rem] overflow-hidden">
                  <Image src={heroVehicle.imageUrl} alt={heroVehicle.name} fill sizes="40vw" className="object-cover group-hover:scale-105 transition-transform duration-700" priority />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-6 flex items-end justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-brand">À la une</p>
                      <p className="font-display text-3xl font-extrabold">{heroVehicle.name}</p>
                      {heroVehicle.basePrice > 0 && <p className="text-white/70 text-sm">dès {formatEuro(heroVehicle.basePrice)} € HT</p>}
                    </div>
                    <span className="h-12 w-12 rounded-full bg-brand text-brand-foreground flex items-center justify-center group-hover:rotate-45 transition-transform">
                      <ArrowUpRight className="h-5 w-5" />
                    </span>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* Trois portes d'entrée */}
          <div className="relative grid grid-cols-3 gap-2 sm:gap-3 px-3 sm:px-10 lg:px-14 pb-3 sm:pb-10">
            {[
              { href: '/accessoires', Icon: Wrench, title: 'Pièces', sub: `${parts.length} références`, hl: true },
              { href: '/vehicules', Icon: Car, title: 'Neufs', sub: `${vehicles.length} modèle${vehicles.length > 1 ? 's' : ''}` },
              { href: '/occasion', Icon: BadgeEuro, title: 'Occasion', sub: isFinite(minUsed) ? `dès ${formatEuro(minUsed)} €` : 'révisées' },
            ].map(({ href, Icon, title, sub, hl }) => (
              <Link
                key={href}
                href={href}
                className={`group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-5 rounded-2xl sm:rounded-3xl transition-colors ${hl ? 'bg-brand text-brand-foreground' : 'bg-white/[0.07] hover:bg-white/[0.12]'}`}
              >
                <span className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center ${hl ? 'bg-ink text-brand' : 'bg-white/10'}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-display text-base sm:text-xl font-extrabold leading-tight">{title}</span>
                  <span className={`block text-xs sm:text-sm truncate ${hl ? 'opacity-70' : 'text-white/60'}`}>{sub}</span>
                </span>
                <ArrowRight className="hidden sm:block h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Bandeau défilant ===== */}
      <div className="overflow-hidden py-6 border-b border-border">
        <div className="flex w-max animate-marquee gap-10 font-display text-xl sm:text-2xl font-extrabold tracking-tight text-foreground/25 whitespace-nowrap">
          {[0, 1].map((k) => (
            <div key={k} className="flex gap-10" aria-hidden={k === 1}>
              {['Sans permis dès 14 ans', 'Golfettes', 'Utilitaires', 'Batteries lithium', 'Chargeurs', 'Éclairage LED', 'Occasions révisées', 'Entretien atelier', 'Montage partenaire'].map((t) => (
                <span key={t} className="flex items-center gap-10">
                  {t} <Zap className="h-5 w-5 text-brand-strong/60" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto px-4">
        {/* ===== Rayons de pièces ===== */}
        {rayons.length > 0 && (
          <section className="pt-14 sm:pt-20">
            <SectionHead kicker="Pièces détachées" title="Par où commencer ?" href="/accessoires" cta="Toutes les pièces" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {rayons.map((r, i) => (
                <Link
                  key={r.type}
                  href={`/accessoires?type=${encodeURIComponent(r.type)}`}
                  className={`group relative overflow-hidden rounded-3xl p-4 sm:p-6 min-h-[150px] sm:min-h-[200px] flex flex-col justify-between ${i === 0 ? 'bg-brand text-brand-foreground' : 'bg-muted'}`}
                >
                  <div className="relative z-10">
                    <p className="font-display text-lg sm:text-2xl font-extrabold tracking-tight leading-tight max-w-[70%]">{r.type}</p>
                    <p className="text-xs sm:text-sm opacity-60 mt-1">{r.count} référence{r.count > 1 ? 's' : ''}</p>
                  </div>
                  <ProductImage src={r.img} alt="" fit="contain" sizes="200px" className="!absolute -right-3 -bottom-3 w-20 h-20 sm:w-40 sm:h-40 !bg-transparent group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500" />
                  <ArrowUpRight className="relative z-10 h-5 w-5" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ===== Promotions ===== */}
        {promotions.length > 0 && (
          <section className="pt-14 sm:pt-20">
            <SectionHead kicker="Offres du moment" title="Bons plans" />
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4">
              {promotions.map((p: any) => (
                <Link key={p.id} href={p.href} className="snap-start shrink-0 w-[85%] sm:w-[480px] group grid grid-cols-[120px_1fr] sm:grid-cols-[180px_1fr] rounded-3xl overflow-hidden bg-rose-600 text-white">
                  <ProductImage src={p.imageUrl} alt={p.productName} fit="contain" sizes="180px" className="h-full min-h-[160px] !bg-white" />
                  <div className="p-5 flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-widest opacity-80">{p.badge}</span>
                    <p className="font-display text-xl font-extrabold leading-tight mt-1">{p.title}</p>
                    <p className="text-sm opacity-80 line-clamp-2 mt-1">{p.productName}</p>
                    <p className="mt-auto pt-3">
                      {p.originalPrice > p.discountedPrice && <span className="text-sm line-through opacity-70 mr-2">{formatEuro(p.originalPrice)} €</span>}
                      <span className="font-display text-2xl font-extrabold">{formatEuro(p.discountedPrice)} €</span>
                      <span className="text-xs opacity-70"> HT</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ===== Pièces à la une ===== */}
        {highlightedParts.length > 0 && (
          <section className="pt-14 sm:pt-20">
            <SectionHead kicker="En stock à l’atelier" title="Pièces à la une" href="/accessoires?tri=recent" cta="Nouveautés" />
            <div className="flex gap-3 sm:gap-4 overflow-x-auto snap-x no-scrollbar -mx-4 px-4 md:grid md:grid-cols-4 md:overflow-visible md:mx-0 md:px-0">
              {highlightedParts.map((p: any) => (
                <div key={p.id} className="snap-start shrink-0 w-[46%] sm:w-[38%] md:w-auto">
                  <PartCard part={p} label={partType(p)} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== Véhicules neufs ===== */}
        {vehicles.length > 0 && (
          <section className="pt-14 sm:pt-20">
            <SectionHead kicker="Véhicules neufs" title="La gamme CARLITE" href="/vehicules" cta="Tous les modèles" />
            <div className="grid md:grid-cols-2 gap-4">
              {vehicles.slice(0, 4).map((v: any) => (
                <Link key={v.id} href={`/vehicules/${v.slug}`} className="group relative overflow-hidden rounded-3xl bg-muted aspect-[4/3] sm:aspect-[16/10]">
                  <Image src={v.imageUrl} alt={v.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent" />
                  <div className="absolute top-4 left-4 flex gap-1.5">
                    <span className="px-3 py-1 rounded-full bg-background/90 text-xs font-semibold">{v.permitType}</span>
                    {v.category && <span className="px-3 py-1 rounded-full bg-brand text-brand-foreground text-xs font-semibold">{v.category}</span>}
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 text-white">
                    <p className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">{v.name}</p>
                    {v.tagline && <p className="text-white/70 text-sm line-clamp-1 mt-1">{v.tagline}</p>}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex gap-3 text-xs sm:text-sm text-white/80">
                        {v.range > 0 && <span className="flex items-center gap-1"><Battery className="h-4 w-4" /> {v.range} km</span>}
                        {v.topSpeed > 0 && <span className="flex items-center gap-1"><Gauge className="h-4 w-4" /> {v.topSpeed} km/h</span>}
                        <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {v.seats} pl.</span>
                      </div>
                      {v.basePrice > 0 && <span className="font-display font-extrabold">dès {formatEuro(v.promo?.discountedPrice || v.basePrice)} € HT</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ===== Occasions ===== */}
        {used.length > 0 && (
          <section className="pt-14 sm:pt-20">
            <SectionHead kicker="Occasions révisées" title="Moins cher, aussi fiable" href="/occasion" cta="Toutes les occasions" />
            <div className="flex gap-4 overflow-x-auto snap-x no-scrollbar -mx-4 px-4 lg:grid lg:grid-cols-3 lg:overflow-visible lg:mx-0 lg:px-0">
              {used.slice(0, 3).map((v: any) => (
                <div key={v.id} className="snap-start shrink-0 w-[82%] sm:w-[48%] lg:w-auto">
                  <UsedCard v={v} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== Pourquoi CARLITE ===== */}
        <section className="pt-14 sm:pt-20">
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-8 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-strong">Pourquoi CARLITE</p>
              <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight leading-[0.95] mt-2">20 ans d’électrique. Zéro baratin.</h2>
              <p className="text-muted-foreground mt-4">Nous vendons, réparons et entretenons des véhicules électriques légers depuis plus de 20 ans. Particuliers, campings, golfs, collectivités : on parle technique, simplement.</p>
              <a href={COMPANY_INFO.phoneHref} className="mt-6 inline-flex items-center gap-2 h-12 px-6 rounded-full bg-primary text-primary-foreground font-semibold">
                <Headphones className="h-5 w-5" /> {COMPANY_INFO.phone}
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { Icon: Wrench, t: 'Atelier intégré', s: 'Diagnostic, réparation, entretien de flotte.' },
                { Icon: ShieldCheck, t: 'Pièces vérifiées', s: 'Testées par nos techniciens avant expédition.' },
                { Icon: Truck, t: 'Partout en France', s: 'Expédition des pièces, montage chez nos partenaires.' },
                { Icon: Sparkles, t: 'Sur mesure', s: 'Plateaux, bennes, adaptations pro.' },
              ].map(({ Icon, t, s }) => (
                <div key={t} className="p-5 rounded-3xl border border-border bg-card">
                  <Icon className="h-6 w-6 text-brand-strong" />
                  <p className="font-display font-extrabold mt-4">{t}</p>
                  <p className="text-sm text-muted-foreground mt-1">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Conseils ===== */}
        {articles.length > 0 && (
          <section className="pt-14 sm:pt-20 pb-14 sm:pb-20">
            <SectionHead kicker="Conseils & guides" title="Tout comprendre avant d’acheter" href="/articles" cta="Tous les articles" />
            <div className="flex gap-4 overflow-x-auto snap-x no-scrollbar -mx-4 px-4 lg:grid lg:grid-cols-4 lg:overflow-visible lg:mx-0 lg:px-0">
              {articles.map((a) => (
                <Link key={a.id} href={`/articles/${a.slug}`} className="snap-start shrink-0 w-[75%] sm:w-[45%] lg:w-auto group">
                  <ProductImage src={a.imageUrl} alt={a.title} sizes="(max-width: 1024px) 75vw, 25vw" className="aspect-[4/3] rounded-3xl" imgClassName="group-hover:scale-105 transition-transform duration-700" />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{a.category} · {a.readTime} min</p>
                  <p className="font-display text-lg font-extrabold leading-snug mt-1 group-hover:underline underline-offset-4 decoration-brand decoration-2">{a.title}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <ExpertContactForm />
    </PageLayout>
  );
}

function SectionHead({ kicker, title, href, cta }: { kicker: string; title: string; href?: string; cta?: string }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5 sm:mb-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-strong">{kicker}</p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[0.95] mt-2">{title}</h2>
      </div>
      {href && cta && (
        <Link href={href} className="hidden sm:inline-flex shrink-0 items-center gap-1 h-10 px-4 rounded-full border border-border text-sm font-semibold hover:bg-muted">
          {cta} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
      {href && (
        <Link href={href} className="sm:hidden shrink-0 h-10 w-10 rounded-full border border-border flex items-center justify-center" aria-label={cta}>
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
