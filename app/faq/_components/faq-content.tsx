'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { SectionWrapper } from '@/components/section-wrapper';

const faqs = [
  {
    q: 'Qu\'est-ce qu\'un quadricycle léger ?',
    a: 'Un quadricycle léger (catégorie L6e) est un petit véhicule à moteur limité à 45 km/h avec une puissance maximale de 6 kW. Il est accessible dès 14 ans avec le permis AM (anciennement BSR). La CarCITY 45 fait partie de cette catégorie.',
  },
  {
    q: 'Faut-il un permis pour conduire une CARLITE ?',
    a: 'Cela dépend du modèle. La CarCITY 45 est accessible dès 14 ans avec un permis AM (sans permis B). La CarCITY 80 et l\'E-SAM nécessitent un permis B. Les personnes nées avant 1988 n\'ont pas besoin du permis AM.',
  },
  {
    q: 'Quelle est l\'autonomie des véhicules CARLITE ?',
    a: 'L\'autonomie varie selon le modèle et le type de batterie. La CarCITY 45 offre jusqu\'à 140 km avec batterie lithium (40 km en plomb). La CarCITY 80 peut atteindre 170 km en lithium. L\'autonomie réelle dépend du style de conduite, du relief et de la température.',
  },
  {
    q: 'Comment recharge-t-on le véhicule ?',
    a: 'Tous les véhicules CARLITE se rechargent sur une prise domestique standard 220V-16A. Comptez environ 3h pour 75% et 5h30 pour une charge complète. Pas besoin de borne spéciale !',
  },
  {
    q: 'Peut-on personnaliser les véhicules ?',
    a: 'Oui ! CARLITE propose de nombreuses options de personnalisation : choix de couleurs, plateaux arrière (benne, caisse), configurations de sièges (de 2 à 9 places pour l\'E-SAM), et adaptations sur mesure pour des besoins spécifiques (PMR, usage professionnel, etc.).',
  },
  {
    q: 'Où peut-on essayer les véhicules ?',
    a: 'Vous pouvez essayer nos véhicules au Garage du Centre, 121 bd Victor Hugo, 92100 Boulogne-Billancourt. Prenez rendez-vous via notre formulaire de contact ou appelez-nous au 06 86 26 16 16.',
  },
  {
    q: 'Quels sont les coûts d\'entretien ?',
    a: 'Un véhicule électrique coûte très peu à entretenir : pas de vidange, pas d\'embrayage, peu d\'usure des freins. La recharge coûte quelques centimes par kilomètre sur une prise domestique.',
  },
  {
    q: 'L\'E-SAM est-il homologué route ?',
    a: 'L\'E-SAM est disponible en version homologuée route (nécessitant un permis) et en version site privé (campings, golfs, domaines). Contactez-nous pour connaître les options d\'homologation.',
  },
];

function FaqItem({ item, isOpen, toggle }: { item: any; isOpen: boolean; toggle: () => void }) {
  return (
    <div className="bg-card rounded-3xl shadow-[var(--shadow-sm)] overflow-hidden">
      <button onClick={toggle} className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors">
        <span className="font-medium pr-4">{item?.q ?? ''}</span>
        <ChevronDown className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-5 pb-5 text-sm text-muted-foreground">{item?.a ?? ''}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FaqContent() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-12">
      <SectionWrapper>
        <div className="text-center mb-12">
          <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="h-6 w-6 text-brand-strong" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Questions fréquentes</h1>
          <p className="text-muted-foreground max-w-md mx-auto">Trouvez rapidement les réponses à vos questions sur les véhicules électriques CARLITE.</p>
        </div>
      </SectionWrapper>
      <div className="max-w-3xl mx-auto space-y-3">
        {faqs.map((item: any, i: number) => (
          <SectionWrapper key={i} delay={i * 0.05}>
            <FaqItem item={item} isOpen={openIndex === i} toggle={() => setOpenIndex(openIndex === i ? null : i)} />
          </SectionWrapper>
        ))}
      </div>
    </div>
  );
}
