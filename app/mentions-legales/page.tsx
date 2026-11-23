import Link from 'next/link';
import { LegalPage } from '@/components/site/legal-page';
import { COMPANY_INFO } from '@/lib/constants';

export const metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales du site carlite.fr édité par la SAS CARLITE.',
  alternates: { canonical: '/mentions-legales' },
};

export default function MentionsLegales() {
  return (
    <LegalPage title="Mentions légales" updated="23 novembre 2026">
      <section>
        <h2>Éditeur du site</h2>
        <p>
          {COMPANY_INFO.name}, société par actions simplifiée<br />
          Siège social : {COMPANY_INFO.address}<br />
          SIREN : {COMPANY_INFO.siren}<br />
          Téléphone : {COMPANY_INFO.phone} — Email : <a className="underline" href={`mailto:${COMPANY_INFO.email}`}>{COMPANY_INFO.email}</a><br />
          Directeur de la publication : le représentant légal de la {COMPANY_INFO.name}.
        </p>
      </section>
      <section>
        <h2>Hébergement</h2>
        <p>IONOS SARL, 7 place de la Gare, BP 70109, 57201 Sarreguemines Cedex, France — www.ionos.fr</p>
      </section>
      <section>
        <h2>Propriété intellectuelle</h2>
        <p>
          L’ensemble des contenus du site (textes, photographies, logos, mises en page) est la propriété de la {COMPANY_INFO.name} ou de ses
          partenaires. Toute reproduction sans autorisation écrite préalable est interdite.
        </p>
      </section>
      <section>
        <h2>Données personnelles</h2>
        <p>
          Les informations transmises via les formulaires (nom, téléphone, email, message) servent uniquement à répondre à votre demande et à
          assurer le suivi commercial. Elles sont conservées au maximum 3 ans après le dernier contact et ne sont jamais revendues.
        </p>
        <p>
          Conformément au RGPD, vous disposez d’un droit d’accès, de rectification, d’effacement et d’opposition : écrivez à{' '}
          <a className="underline" href={`mailto:${COMPANY_INFO.email}`}>{COMPANY_INFO.email}</a>. Vous pouvez aussi saisir la CNIL (www.cnil.fr).
        </p>
      </section>
      <section>
        <h2>Cookies</h2>
        <p>Le site n’utilise que les cookies techniques nécessaires à son fonctionnement (session de l’espace d’administration). Aucun cookie publicitaire.</p>
      </section>
      <p>
        Voir aussi nos <Link className="underline" href="/conditions-generales-de-vente">conditions générales de vente, de livraison et de retour</Link>.
      </p>
    </LegalPage>
  );
}
