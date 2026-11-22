/**
 * Corrections éditoriales ponctuelles sur le contenu en base (idempotent, remplacements exacts).
 *   npm run maj:contenu
 * 2026-11 : retrait des mentions du showroom dans les articles (le showroom n'est plus ouvert au public).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ARTICLE_FIXES: [string, string][] = [
  ['- Un **essai gratuit** sans engagement au showroom', '- Un **conseil personnalisé** pour choisir le véhicule adapté'],
  [
    'Venez les essayer toutes les deux dans notre showroom à Boulogne-Billancourt !',
    'Besoin d’aide pour choisir ? Nos conseillers vous répondent au **06 13 930 930**.',
  ],
  [
    "Venez découvrir l'E-SAM dans notre showroom de Boulogne-Billancourt ou demandez une démonstration sur site.",
    "Demandez une documentation détaillée ou un devis personnalisé pour l'E-SAM.",
  ],
  [
    'Convaincu ? Venez essayer la CarCITY dans notre showroom de Boulogne-Billancourt. Nous sommes certains que vous changerez d\'avis en quelques minutes de conduite !',
    'Convaincu ? Contactez-nous : nous répondons à toutes vos questions et vous aidons à choisir le véhicule adapté.',
  ],
];

async function main() {
  const articles = await prisma.article.findMany({ select: { id: true, slug: true, content: true } });
  let changed = 0;
  for (const a of articles) {
    let content = a.content;
    for (const [from, to] of ARTICLE_FIXES) content = content.split(from).join(to);
    if (content !== a.content) {
      await prisma.article.update({ where: { id: a.id }, data: { content } });
      console.log(`   article mis à jour : ${a.slug}`);
      changed++;
    }
  }
  const left = await prisma.article.findMany({
    where: { OR: [{ content: { contains: 'showroom', mode: 'insensitive' } }, { content: { contains: 'Victor Hugo', mode: 'insensitive' } }] },
    select: { slug: true },
  });
  console.log(`== ${changed} article(s) corrigé(s)` + (left.length ? ` — mention restante dans : ${left.map((l) => l.slug).join(', ')}` : ' — plus aucune mention du showroom ✔'));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
