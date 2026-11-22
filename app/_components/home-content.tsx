'use client';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Zap, Battery, Shield, Leaf, ArrowRight, ChevronRight, Car, Users, Newspaper, Clock, MessageSquare, Calendar, MapPin, Tag, Percent } from 'lucide-react';
import { IMAGES } from '@/lib/constants';
import { SectionWrapper } from '@/components/section-wrapper';
import { ExpertContactForm } from './expert-contact-form';
import { PriceTag } from '@/components/price-tag';
import { formatEuro, euroHT, euroTTC } from '@/lib/pricing';
import { useState, useEffect } from 'react';

function CountUp({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export function HomeContent({ vehicles, articles = [], usedVehicles = [], promotions = [] }: { vehicles: any[]; articles?: any[]; usedVehicles?: any[]; promotions?: any[] }) {
  const safePromos = promotions ?? [];
  const safeVehicles = vehicles ?? [];
  const safeUsed = usedVehicles ?? [];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gray-950 text-white">
        <div className="absolute inset-0">
          <Image
            src={IMAGES.hero}
            alt="Usine CARLITE – Véhicules électriques et pièces détachées"
            fill
            className="object-cover opacity-50"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-gray-950/50 to-transparent" />
        </div>
        <div className="relative max-w-[1200px] mx-auto px-4 py-24 md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-sm mb-6 backdrop-blur-sm">
              <Zap className="h-4 w-4 text-green-400" />
              100% Électrique • Conçu en France
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
              Expert en <span className="text-green-400">véhicules électriques</span> & pièces détachées
            </h1>
            <p className="text-lg text-gray-300 mb-4 max-w-lg leading-relaxed">
              Quadricycles, utilitaires, golfettes — CARLITE conçoit, assemble et entretient vos véhicules électriques avec un <strong className="text-white">stock permanent de pièces détachées</strong>.
            </p>
            <p className="text-base text-gray-400 mb-8 max-w-lg">
              Plus de 20 ans d'expertise. Un interlocuteur unique pour l'achat, la maintenance et les pièces de rechange de votre flotte électrique.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/vehicules"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-white text-gray-900 font-medium hover:bg-gray-100 transition-colors text-center"
              >
                <Car className="h-5 w-5 shrink-0" />
                Un projet d'achat ou de remplacement ?
              </Link>
              <a
                href="#contact-expert"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-500 transition-colors text-center shadow-lg shadow-green-600/25"
              >
                <MessageSquare className="h-5 w-5 shrink-0" />
                Demandez l'avis d'un expert
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white dark:bg-card border-b border-border">
        <div className="max-w-[1200px] mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 170, suffix: ' km', label: "Autonomie max" },
              { value: 8990, suffix: ' € HT', label: "À partir de" },
              { value: 20, suffix: '+ ans', label: "D'expertise" },
              { value: 14, suffix: ' ans', label: "Accessible dès" },
            ].map((stat: any, i: number) => (
              <div key={i}>
                <div className="font-display text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  <CountUp end={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-sm text-muted-foreground mt-1">{stat?.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicle Categories - mobiliteplus style */}
      <section className="bg-background">
        <div className="max-w-[1200px] mx-auto px-4 py-20">
          <SectionWrapper>
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">Nos catégories de véhicules</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">Quadricycles, utilitaires, golfettes, navettes… Découvrez toutes nos solutions de mobilité électrique.</p>
            </div>
          </SectionWrapper>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { title: 'Voitures sans permis', image: '/images/cat_sans_permis.jpg', href: '/vehicules', desc: 'Dès 14 ans' },
              { title: 'Utilitaires électriques', image: '/images/cat_utilitaire.jpg', href: '/vehicules', desc: 'Pro & collectivités' },
              { title: 'Golfettes', image: '/images/cat_golf.jpg', href: '/vehicules', desc: 'Loisirs & domaines' },
              { title: 'Navettes', image: '/images/cat_navette.jpg', href: '/vehicules', desc: 'Transport de personnes' },
              { title: 'Sur mesure', image: '/images/cat_sur_mesure.jpg', href: '/configurateur', desc: 'Plateaux & adaptations' },
            ].map((cat: any, i: number) => (
              <SectionWrapper key={i} delay={i * 0.08}>
                <Link href={cat?.href ?? '/vehicules'} className="group relative block rounded-2xl overflow-hidden aspect-[3/4] shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-xl)] transition-all duration-300">
                  <Image
                    src={cat?.image ?? ''}
                    alt={cat?.title ?? 'Catégorie CARLITE'}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <span className="text-xs text-green-400 font-medium">{cat?.desc ?? ''}</span>
                    <h3 className="font-display font-bold text-white text-base lg:text-lg leading-tight mt-0.5">{cat?.title ?? ''}</h3>
                  </div>
                </Link>
              </SectionWrapper>
            ))}
          </div>
        </div>
      </section>

      {/* Promotions */}
      {safePromos.length > 0 && (
        <section className="bg-gradient-to-b from-rose-50 to-background dark:from-rose-950/20">
          <div className="max-w-[1200px] mx-auto px-4 py-20">
            <SectionWrapper>
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-semibold mb-3">
                  <Percent className="h-3.5 w-3.5" /> Offres du moment
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">Promotions</h2>
                <p className="text-muted-foreground max-w-md mx-auto">Profitez de nos offres à prix réduit, pour une durée limitée.</p>
              </div>
            </SectionWrapper>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {safePromos.map((p: any, i: number) => (
                <SectionWrapper key={p?.id ?? i} delay={i * 0.1}>
                  <Link href={p?.href ?? '#'}>
                    <div className="group bg-card rounded-xl overflow-hidden shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 hover:-translate-y-1 border-2 border-rose-500/30">
                      <div className="relative aspect-[4/3] bg-muted">
                        <Image src={p?.imageUrl ?? IMAGES.hero} alt={p?.productName ?? 'Promotion CARLITE'} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-rose-600 text-white text-xs font-semibold shadow-md">{p?.badge || 'Promo'}</div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-display font-bold text-lg mb-1">{p?.title ?? ''}</h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-1">{p?.productName ?? ''}</p>
                        <div className="flex items-end gap-2">
                          {p?.originalPrice != null && p.originalPrice > (p?.discountedPrice ?? 0) && (
                            <span className="font-mono text-sm text-muted-foreground line-through">{euroHT(p?.originalPrice)}</span>
                          )}
                          <span className="font-mono font-bold text-xl text-rose-600 dark:text-rose-400">{euroHT(p?.discountedPrice ?? 0)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">soit {euroTTC(p?.discountedPrice ?? 0)}</div>
                      </div>
                    </div>
                  </Link>
                </SectionWrapper>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Vehicles */}
      <section className="bg-muted/30">
        <div className="max-w-[1200px] mx-auto px-4 py-20">
          <SectionWrapper>
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">Notre gamme</h2>
              <p className="text-muted-foreground max-w-md mx-auto">Des véhicules électriques adaptés à tous les usages : ville, loisirs, travail.</p>
            </div>
          </SectionWrapper>
          <div className="grid md:grid-cols-3 gap-6">
            {safeVehicles?.map?.((vehicle: any, i: number) => (
              <SectionWrapper key={vehicle?.id ?? i} delay={i * 0.15}>
                <Link href={`/vehicules/${vehicle?.slug ?? ''}`}>
                  <div className="group bg-card rounded-xl overflow-hidden shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 hover:-translate-y-1">
                    <div className="relative aspect-[4/3] bg-muted">
                      <Image
                        src={vehicle?.imageUrl ?? IMAGES.hero}
                        alt={vehicle?.name ?? 'Véhicule CARLITE'}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-gray-900/80 text-white text-xs font-medium backdrop-blur-sm">
                        {vehicle?.permitType ?? ''}
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">{vehicle?.category ?? ''}</div>
                      <h3 className="font-display font-bold text-lg mb-1">{vehicle?.name ?? 'CARLITE'}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{vehicle?.tagline ?? ''}</p>
                      <div className="flex items-center justify-between">
                        <PriceTag ht={vehicle?.basePrice} prefix="à partir de" className="font-mono font-semibold text-gray-900 dark:text-white" showTtc={false} />
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </div>
                </Link>
              </SectionWrapper>
            )) ?? null}
          </div>
          {safeVehicles?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Les véhicules seront bientôt disponibles.
            </div>
          )}
        </div>
      </section>

      {/* Advantages */}
      <section className="bg-white dark:bg-card">
        <div className="max-w-[1200px] mx-auto px-4 py-20">
          <SectionWrapper>
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">Pourquoi choisir CARLITE ?</h2>
              <p className="text-muted-foreground max-w-md mx-auto">Plus de 20 ans d’expertise en véhicules électriques.</p>
            </div>
          </SectionWrapper>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Car, title: 'Sans permis', desc: 'Accessible dès 14 ans avec le permis AM. Parfait pour les déplacements urbains quotidiens.' },
              { icon: Battery, title: 'Économique', desc: 'Quelques centimes par kilomètre. Recharge sur prise 220V standard. Entretien réduit.' },
              { icon: Leaf, title: 'Écologique', desc: 'Zéro émission. Compatible zones ZFE. Contribuez à un avenir plus propre.' },
              { icon: Users, title: 'Personnalisable', desc: 'Plateaux arrière, configurations spéciales, adaptations sur mesure selon vos besoins.' },
            ].map((item: any, i: number) => {
              const Icon = item?.icon ?? Zap;
              return (
                <SectionWrapper key={i} delay={i * 0.1}>
                  <div className="group p-6 rounded-xl bg-muted/50 hover:bg-gray-900 hover:text-white transition-all duration-300">
                    <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                      <Icon className="h-6 w-6 text-green-600 group-hover:text-green-400" />
                    </div>
                    <h3 className="font-display font-semibold mb-2">{item?.title}</h3>
                    <p className="text-sm text-muted-foreground group-hover:text-gray-300">{item?.desc}</p>
                  </div>
                </SectionWrapper>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Used Vehicles */}
      {safeUsed.length > 0 && (
        <section className="bg-muted/30">
          <div className="max-w-[1200px] mx-auto px-4 py-20">
            <SectionWrapper>
              <div className="flex items-center justify-between mb-10">
                <div>
                  <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-2">
                    <Tag className="h-4 w-4" /> Occasions certifiées
                  </div>
                  <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Nos véhicules d'occasion à la une</h2>
                  <p className="text-muted-foreground mt-2 max-w-xl">Des véhicules électriques révisés et garantis, sélectionnés par nos experts.</p>
                </div>
                <Link href="/occasion" className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors">
                  Toutes les occasions <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {safeUsed.map((v: any, index: number) => (
                  <motion.div
                    key={v?.id ?? index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href="/occasion" className="group block bg-card rounded-2xl overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] transition-all duration-300">
                      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                        <Image src={v?.imageUrl ?? ''} alt={v?.name ?? 'Véhicule d\'occasion CARLITE'} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">{v?.condition ?? ''}</div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition-colors">{v?.name ?? ''}</h3>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {v?.year ?? ''}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {(v?.mileage ?? 0)?.toLocaleString?.('fr-FR')} km</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {v?.seats ?? 2} pl.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <PriceTag ht={v?.price} className="font-mono font-bold text-lg text-primary" showTtc={false} />
                          {(v?.originalPrice ?? 0) > (v?.price ?? 0) && (
                            <span className="font-mono text-sm text-muted-foreground line-through">{formatEuro(v?.originalPrice)} € HT</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="mt-8 text-center md:hidden">
                <Link href="/occasion" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors">
                  Toutes les occasions <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </SectionWrapper>
          </div>
        </section>
      )}

      {/* Latest Articles */}
      {(articles?.length ?? 0) > 0 && (
        <section className="bg-background">
          <div className="max-w-[1200px] mx-auto px-4 py-20">
            <SectionWrapper>
              <div className="flex items-center justify-between mb-10">
                <div>
                  <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-2">
                    <Newspaper className="h-4 w-4" /> Blog & Actualités
                  </div>
                  <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Nos derniers articles</h2>
                </div>
                <Link href="/articles" className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors">
                  Tous les articles <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {articles?.map?.((article: any, index: number) => (
                  <motion.div
                    key={article?.id ?? index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={`/articles/${article?.slug ?? ''}`} className="group block bg-card rounded-2xl overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] transition-all duration-300">
                      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                        <Image
                          src={article?.imageUrl ?? ''}
                          alt={article?.title ?? 'Article CARLITE'}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium backdrop-blur-sm">
                          {article?.category ?? ''}
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-display font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {article?.title ?? ''}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article?.excerpt ?? ''}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {article?.readTime ?? 5} min</span>
                          <span>•</span>
                          <span>{article?.author ?? 'CARLITE'}</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )) ?? null}
              </div>
              <div className="mt-8 text-center md:hidden">
                <Link href="/articles" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors">
                  Tous les articles <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </SectionWrapper>
          </div>
        </section>
      )}

      {/* Expert Contact Form */}
      <ExpertContactForm />
    </div>
  );
}