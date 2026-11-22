'use client';
import Image from 'next/image';
import { IMAGES } from '@/lib/constants';
import { SectionWrapper } from '@/components/section-wrapper';
import { Battery, Zap, Clock, Home, PlugZap } from 'lucide-react';

export function RechargeContent() {
  const chargingTypes = [
    {
      icon: Home,
      title: 'Recharge à domicile',
      description: 'Tous les véhicules CARLITE se rechargent sur une simple prise domestique 220V-16A. Branchez le soir, roulez le matin !',
      power: '220V - 16A',
      time: '3h (75%) / 5h30 (100%)',
    },
    {
      icon: PlugZap,
      title: 'Prise standard',
      description: 'Pas besoin de borne spéciale ni d\'installation coûteuse. Une prise domestique classique suffit pour recharger votre CARLITE.',
      power: 'Prise standard',
      time: 'Nuit complète',
    },
  ];

  const tips = [
    'Maintenez la charge entre 20% et 80% pour préserver la durée de vie de votre batterie.',
    'Privilégiez la batterie lithium pour une autonomie étendue (jusqu\'à 170 km vs 40 km en plomb).',
    'En hiver, garez votre véhicule à l\'abri pour maintenir la température de la batterie.',
    'Utilisez le mode éco en ville pour maximiser votre autonomie.',
    'Le freinage régénératif récupère de l\'énergie en descente et au freinage.',
    'Vérifiez régulièrement la pression des pneus pour optimiser la consommation.',
  ];

  return (
    <div>
      <section className="bg-gray-950 text-white">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Image src={IMAGES.homeCharging} alt="Recharge électrique à domicile" fill className="object-cover opacity-30" />
          </div>
          <div className="relative max-w-[1200px] mx-auto px-4 py-20">
            <SectionWrapper>
              <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4">Recharge & Autonomie</h1>
              <p className="text-gray-300 max-w-lg text-lg">Tout ce que vous devez savoir sur la recharge de votre véhicule CARLITE. Simple comme une prise électrique.</p>
            </SectionWrapper>
          </div>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-4 py-16">
        <SectionWrapper>
          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-8 text-center">Recharge simple et accessible</h2>
        </SectionWrapper>
        <div className="grid md:grid-cols-2 gap-6">
          {chargingTypes.map((ct: any, i: number) => {
            const Icon = ct?.icon ?? Zap;
            return (
              <SectionWrapper key={i} delay={i * 0.1}>
                <div className="bg-card rounded-xl p-6 shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-shadow h-full">
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">{ct?.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{ct?.description}</p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1 text-xs"><Zap className="h-3 w-3 text-green-600" /> {ct?.power}</div>
                    <div className="flex items-center gap-1 text-xs"><Clock className="h-3 w-3 text-green-600" /> {ct?.time}</div>
                  </div>
                </div>
              </SectionWrapper>
            );
          })}
        </div>
      </section>

      {/* Battery comparison */}
      <section className="bg-muted/30">
        <div className="max-w-[1200px] mx-auto px-4 py-16">
          <SectionWrapper>
            <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-8 text-center">Plomb vs Lithium</h2>
          </SectionWrapper>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-card rounded-xl p-6 shadow-[var(--shadow-md)]">
              <h3 className="font-display font-bold text-lg mb-3">Batterie Plomb</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Autonomie : 30-40 km</li>
                <li>• Prix : incluse dans le véhicule</li>
                <li>• Durée de vie : 2-3 ans</li>
                <li>• Poids : plus lourd</li>
                <li>• Idéale pour trajets courts</li>
              </ul>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-[var(--shadow-md)] ring-2 ring-green-500">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-display font-bold text-lg">Batterie Lithium</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">Recommandé</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Autonomie : 100-170 km</li>
                <li>• Prix : +2 000 à 2 500 €</li>
                <li>• Durée de vie : 5-7 ans</li>
                <li>• Poids : plus léger</li>
                <li>• Idéale pour usage quotidien</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-4 py-16">
        <SectionWrapper>
          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-8 text-center">Conseils pour optimiser l\'autonomie</h2>
        </SectionWrapper>
        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {tips.map((tip: string, i: number) => (
            <SectionWrapper key={i} delay={i * 0.1}>
              <div className="flex gap-4 bg-card rounded-xl p-5 shadow-[var(--shadow-sm)]">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Battery className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-sm">{tip}</p>
              </div>
            </SectionWrapper>
          ))}
        </div>
      </section>
    </div>
  );
}
