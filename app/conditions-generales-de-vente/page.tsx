import Link from 'next/link';
import { LegalPage } from '@/components/site/legal-page';
import { COMPANY_INFO } from '@/lib/constants';

export const metadata = {
  title: 'Conditions générales de vente, livraison et retours',
  description: 'Conditions de vente CARLITE : commande, prix, livraison, droit de rétractation de 14 jours, retours et garanties.',
  alternates: { canonical: '/conditions-generales-de-vente' },
};

export default function CGV() {
  return (
    <LegalPage title="Conditions générales de vente" updated="23 novembre 2026">
      <section>
        <h2>1. Vendeur</h2>
        <p>
          {COMPANY_INFO.name} — {COMPANY_INFO.address} — SIREN {COMPANY_INFO.siren} — {COMPANY_INFO.phone} —{' '}
          <a className="underline" href={`mailto:${COMPANY_INFO.email}`}>{COMPANY_INFO.email}</a>.
        </p>
      </section>
      <section>
        <h2>2. Produits</h2>
        <p>
          Pièces détachées, accessoires et véhicules électriques (quadricycles, golfettes, utilitaires), neufs ou d’occasion. Les photographies
          sont non contractuelles.
        </p>
        <p>
          <strong>Véhicules neufs :</strong> ils sont vendus en kit, non montés. L’assemblage peut être réalisé par l’un de nos partenaires monteurs
          en France, dans le cadre d’une prestation distincte.
        </p>
      </section>
      <section>
        <h2>3. Prix</h2>
        <p>
          Les prix sont indiqués en euros hors taxes (HT) ; le prix toutes taxes comprises (TTC, TVA 20 %) est affiché à côté. Les frais de
          livraison éventuels sont précisés avant la validation de la commande. Les produits « sur devis » font l’objet d’une proposition de prix
          personnalisée.
        </p>
      </section>
      <section>
        <h2>4. Commande et paiement</h2>
        <p>
          La commande se fait depuis la fiche produit (bouton « Commander / devis »), par téléphone ou par email. Un conseiller confirme la
          disponibilité, le prix total et le délai de livraison. La vente est conclue à l’acceptation écrite de cette confirmation et au règlement.
        </p>
      </section>
      <section>
        <h2>5. Livraison</h2>
        <p>
          Les pièces sont expédiées en France métropolitaine, généralement sous 2 à 5 jours ouvrés après paiement pour les articles en stock. Les
          véhicules sont livrés en kit, à une date convenue avec le client. Un retrait sur rendez-vous est possible.
        </p>
      </section>
      <section>
        <h2>6. Droit de rétractation et retours</h2>
        <p>
          Les clients consommateurs disposent d’un délai de <strong>14 jours</strong> à compter de la réception pour se rétracter, sans avoir à se
          justifier (articles L221-18 et suivants du Code de la consommation). Il suffit de nous en informer par email à{' '}
          <a className="underline" href={`mailto:${COMPANY_INFO.email}`}>{COMPANY_INFO.email}</a>.
        </p>
        <ul>
          <li>Le produit doit être retourné complet, dans son état d’origine, dans les 14 jours suivant la rétractation.</li>
          <li>Les frais de retour sont à la charge du client, sauf produit défectueux ou erreur de notre part.</li>
          <li>Le remboursement intervient dans les 14 jours suivant la réception du retour, par le moyen de paiement utilisé.</li>
          <li>Ne peuvent être repris : les pièces montées ou installées, et les produits fabriqués ou modifiés sur mesure.</li>
        </ul>
      </section>
      <section>
        <h2>7. Garanties</h2>
        <p>
          Tous les produits bénéficient de la garantie légale de conformité (articles L217-3 et suivants du Code de la consommation, 2 ans pour
          les produits neufs) et de la garantie contre les vices cachés (articles 1641 et suivants du Code civil). Les garanties commerciales
          éventuelles sont indiquées sur la fiche du produit.
        </p>
      </section>
      <section>
        <h2>8. Litiges</h2>
        <p>
          En cas de difficulté, contactez-nous d’abord : nous cherchons toujours une solution amiable. Le consommateur peut recourir gratuitement à
          un médiateur de la consommation. Droit applicable : droit français.
        </p>
      </section>
      <p>
        Voir aussi les <Link className="underline" href="/mentions-legales">mentions légales</Link>.
      </p>
    </LegalPage>
  );
}
