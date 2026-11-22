import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Admin user
  const hashedPassword = await bcrypt.hash('johndoe123', 12);
  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: { role: 'admin' },
    create: { email: 'john@doe.com', password: hashedPassword, name: 'Admin CARLITE', role: 'admin' },
  });

  // Vehicle 1: CarCITY 45 (sans permis)
  const carcity45 = await prisma.vehicle.upsert({
    where: { slug: 'carcity-45' },
    update: {},
    create: {
      name: 'CarCITY 45',
      slug: 'carcity-45',
      tagline: 'La citadine électrique sans permis, compacte et fun',
      description: 'La CarCITY 45 est le quadricycle léger idéal pour se déplacer en ville sans permis. Compacte, maniable et sur-équipée, elle offre une expérience de conduite agréable avec son toit panoramique, ses freins à disque et sa climatisation en option. Accessible dès 14 ans avec le permis AM.',
      category: 'Quadricycle léger L6e',
      basePrice: 8990,
      imageUrl: '/images/carcity.jpg',
      gallery: ['/images/carcity.jpg'],
      range: 140,
      topSpeed: 45,
      acceleration: 0,
      horsepower: 0,
      torque: 60,
      battery: 'Plomb ou Lithium 7 kWh',
      seats: 2,
      trunk: 0,
      chargeTime: '5h30 (prise 220V-16A)',
      weight: 425,
      warranty: '2 ans véhicule',
      featured: true,
      available: true,
      permitType: 'Sans permis (AM dès 14 ans)',
      motorPower: '3.5 kW nominal / 6 kW maxi',
      dimensions: '2245 x 1290 x 1570 mm',
    },
  });

  // Vehicle 2: CarCITY 80 (avec permis)
  const carcity80 = await prisma.vehicle.upsert({
    where: { slug: 'carcity-80' },
    update: {},
    create: {
      name: 'CarCITY 80',
      slug: 'carcity-80',
      tagline: 'La citadine électrique avec permis, plus puissante',
      description: 'La CarCITY 80 reprend tous les atouts de la CarCITY 45 avec plus de puissance et une vitesse maximale de 78 km/h. Parfaite pour les trajets périurbains, elle offre jusqu\'à 170 km d\'autonomie avec les batteries lithium. Nécessite un permis B.',
      category: 'Quadricycle lourd L7e',
      basePrice: 10990,
      imageUrl: '/images/carcity80.jpg',
      gallery: ['/images/carcity80.jpg'],
      range: 170,
      topSpeed: 78,
      acceleration: 0,
      horsepower: 0,
      torque: 80,
      battery: 'Plomb ou Lithium 10 kWh',
      seats: 2,
      trunk: 0,
      chargeTime: '5h30 (prise 220V-16A)',
      weight: 450,
      warranty: '2 ans véhicule',
      featured: true,
      available: true,
      permitType: 'Permis B (dès 18 ans)',
      motorPower: '7.5 kW nominal / 14 kW maxi',
      dimensions: '2245 x 1290 x 1570 mm',
    },
  });

  // Vehicle 3: E-SAM (utilitaire 4x4)
  const esam = await prisma.vehicle.upsert({
    where: { slug: 'e-sam' },
    update: {},
    create: {
      name: 'E-SAM',
      slug: 'e-sam',
      tagline: 'Le véhicule utilitaire électrique 4x4, de 2 à 9 places',
      description: 'L\'E-SAM est un véhicule utilitaire électrique tout-terrain conçu et assemblé en France. Disponible de 2 à 9 places, il est idéal pour le transport, le remorquage et les travaux. Parfait pour les campings, golfs, domaines, collectivités et professionnels. Personnalisable avec différents plateaux arrière.',
      category: 'Utilitaire électrique',
      basePrice: 12500,
      imageUrl: '/images/esam.jpg',
      gallery: ['/images/esam.jpg', '/images/esam_utility.jpg'],
      range: 80,
      topSpeed: 40,
      acceleration: 0,
      horsepower: 0,
      torque: 0,
      battery: 'Lithium 10 kWh',
      seats: 4,
      trunk: 0,
      chargeTime: '6-8h (prise 220V)',
      weight: 600,
      warranty: '2 ans véhicule',
      featured: true,
      available: true,
      permitType: 'Permis B',
      motorPower: '7.5 kW',
      dimensions: 'Variable selon configuration',
    },
  });

  // Colors for each vehicle
  const colorSets = [
    { vehicleId: carcity45.id, colors: [
      { name: 'Blanc', hex: '#FFFFFF', price: 0 },
      { name: 'Bleu', hex: '#2563EB', price: 300 },
      { name: 'Rouge', hex: '#DC2626', price: 300 },
      { name: 'Vert', hex: '#16A34A', price: 300 },
      { name: 'Jaune', hex: '#EAB308', price: 300 },
      { name: 'Orange', hex: '#EA580C', price: 300 },
    ]},
    { vehicleId: carcity80.id, colors: [
      { name: 'Blanc', hex: '#FFFFFF', price: 0 },
      { name: 'Bleu', hex: '#2563EB', price: 300 },
      { name: 'Rouge', hex: '#DC2626', price: 300 },
      { name: 'Noir', hex: '#1A1A2E', price: 300 },
      { name: 'Gris Métallisé', hex: '#9CA3AF', price: 300 },
    ]},
    { vehicleId: esam.id, colors: [
      { name: 'Blanc', hex: '#FFFFFF', price: 0 },
      { name: 'Vert', hex: '#166534', price: 500 },
      { name: 'Beige', hex: '#D4A574', price: 500 },
      { name: 'Noir', hex: '#1A1A2E', price: 500 },
    ]},
  ];

  for (const set of colorSets) {
    for (const color of set.colors) {
      const existingColors = await prisma.vehicleColor.findMany({
        where: { vehicleId: set.vehicleId, name: color.name },
      });
      if (existingColors.length === 0) {
        await prisma.vehicleColor.create({
          data: { ...color, vehicleId: set.vehicleId },
        });
      }
    }
  }

  // Options (plateaux arrière and equipment)
  const carcityOptions = [
    { name: 'Pack Premium', description: 'Écran multimédia tactile, GPS, Bluetooth, Mirror Link, caméra de recul', price: 1500, category: 'Technologie' },
    { name: 'Climatisation', description: 'Climatisation réversible (chaud/froid)', price: 800, category: 'Confort' },
    { name: 'Direction assistée', description: 'Direction assistée à crémaillère', price: 500, category: 'Confort' },
    { name: 'Batterie Lithium 7 kWh', description: 'Upgrade batterie lithium pour autonomie étendue (140 km)', price: 2000, category: 'Batterie' },
  ];

  const carcity80Options = [
    { name: 'Pack Premium', description: 'Écran multimédia tactile, GPS, Bluetooth, Mirror Link, caméra de recul', price: 1500, category: 'Technologie' },
    { name: 'Climatisation', description: 'Climatisation réversible (chaud/froid)', price: 800, category: 'Confort' },
    { name: 'Direction assistée', description: 'Direction assistée à crémaillère', price: 500, category: 'Confort' },
    { name: 'Batterie Lithium 10 kWh', description: 'Upgrade batterie lithium pour autonomie étendue (170 km)', price: 2500, category: 'Batterie' },
  ];

  const esamOptions = [
    { name: 'Plateau arrière benne', description: 'Plateau arrière basculant type benne pour transport de matériaux', price: 800, category: 'Plateau arrière' },
    { name: 'Plateau arrière caisse', description: 'Caisse fermée à l\'arrière pour transport sécurisé', price: 1200, category: 'Plateau arrière' },
    { name: 'Configuration 6 places', description: 'Aménagement 6 places assises avec banquettes arrière', price: 1500, category: 'Configuration' },
    { name: 'Configuration 9 places', description: 'Aménagement 9 places pour navette / transport collectif', price: 2500, category: 'Configuration' },
    { name: 'Adaptation PMR', description: 'Adaptation pour personnes à mobilité réduite', price: 3000, category: 'Sur mesure' },
    { name: 'Adaptation sur mesure', description: 'Adaptation personnalisée selon vos besoins spécifiques', price: 0, category: 'Sur mesure' },
  ];

  for (const opt of carcityOptions) {
    const existing = await prisma.vehicleOption.findMany({
      where: { vehicleId: carcity45.id, name: opt.name },
    });
    if (existing.length === 0) {
      await prisma.vehicleOption.create({
        data: { ...opt, vehicleId: carcity45.id },
      });
    }
  }

  for (const opt of carcity80Options) {
    const existing = await prisma.vehicleOption.findMany({
      where: { vehicleId: carcity80.id, name: opt.name },
    });
    if (existing.length === 0) {
      await prisma.vehicleOption.create({
        data: { ...opt, vehicleId: carcity80.id },
      });
    }
  }

  for (const opt of esamOptions) {
    const existing = await prisma.vehicleOption.findMany({
      where: { vehicleId: esam.id, name: opt.name },
    });
    if (existing.length === 0) {
      await prisma.vehicleOption.create({
        data: { ...opt, vehicleId: esam.id },
      });
    }
  }

  // Accessories
  const accessories = [
    { name: 'Plateau arrière benne', slug: 'plateau-arriere-benne', description: 'Plateau basculant type benne pour E-SAM. Idéal pour le transport de matériaux, terre, déchets verts.', price: 890, imageUrl: '/images/plateau_arriere.jpg', category: 'Plateaux' },
    { name: 'Bâche de protection', slug: 'bache-protection', description: 'Bâche de protection intégrale pour protéger votre véhicule des intempéries. Taille universelle.', price: 149, imageUrl: '/images/bache_protection.jpg', category: 'Protection' },
    { name: 'Batterie Lithium 7 kWh', slug: 'batterie-lithium-7kwh', description: 'Batterie lithium de remplacement 7 kWh pour CarCITY 45. Autonomie jusqu\'à 140 km.', price: 2490, imageUrl: '/images/batterie_lithium.jpg', category: 'Batteries' },
    { name: 'Batterie Lithium 10 kWh', slug: 'batterie-lithium-10kwh', description: 'Batterie lithium de remplacement 10 kWh pour CarCITY 80 et E-SAM. Autonomie étendue.', price: 3290, imageUrl: '/images/batterie_lithium.jpg', category: 'Batteries' },
    { name: 'Câble de recharge 220V', slug: 'cable-recharge-220v', description: 'Câble de recharge standard 220V-16A, 5 mètres. Compatible avec tous les modèles CARLITE.', price: 89, imageUrl: '/images/home_charging.jpg', category: 'Recharge' },
    { name: 'Kit rétroviseurs électriques', slug: 'kit-retroviseurs-electriques', description: 'Kit rétroviseurs électriques dégivrants, remplacement ou upgrade pour CarCITY.', price: 249, imageUrl: '/images/carcity.jpg', category: 'Accessoires' },
  ];

  for (const acc of accessories) {
    await prisma.accessory.upsert({
      where: { slug: acc.slug },
      update: {},
      create: acc,
    });
  }

  // Used vehicles
  const usedVehicles = [
    {
      name: 'CarCITY 45 - 2024',
      slug: 'carcity-45-2024-blanc',
      description: 'CarCITY 45 en excellent état, première main, batterie lithium 7 kWh. Pack Premium inclus (GPS, Bluetooth, caméra). Couleur blanche.',
      price: 6990,
      originalPrice: 8990,
      imageUrl: '/images/used_quadricycle1.jpg',
      year: 2024,
      mileage: 5000,
      range: 130,
      battery: 'Lithium 7 kWh',
      color: 'Blanc',
      condition: 'Excellent',
    },
    {
      name: 'E-SAM 4 places - 2023',
      slug: 'esam-4places-2023',
      description: 'E-SAM 4 places avec plateau arrière benne. Idéal pour camping ou domaine. Batterie lithium en bon état.',
      price: 8500,
      originalPrice: 13300,
      imageUrl: '/images/used_quadricycle2.jpg',
      year: 2023,
      mileage: 12000,
      range: 70,
      battery: 'Lithium 10 kWh',
      color: 'Vert',
      condition: 'Très bon',
    },
    {
      name: 'CarCITY 80 - 2024',
      slug: 'carcity-80-2024-bleu',
      description: 'CarCITY 80 avec permis, batterie lithium 10 kWh, climatisation, direction assistée. Véhicule de démonstration.',
      price: 9490,
      originalPrice: 12990,
      imageUrl: '/images/carcity80.jpg',
      year: 2024,
      mileage: 2000,
      range: 160,
      battery: 'Lithium 10 kWh',
      color: 'Bleu',
      condition: 'Comme neuf',
    },
  ];

  for (const uv of usedVehicles) {
    await prisma.usedVehicle.upsert({
      where: { slug: uv.slug },
      update: {},
      create: uv,
    });
  }

  // Articles — 4 existing + 20 new (scheduled weekly from May 25, 2026)
  const articles = [
    // --- 4 articles existants (déjà publiés, date passée) ---
    {
      title: 'Qu\'est-ce qu\'un quadricycle léger ? Guide complet 2026',
      slug: 'guide-quadricycle-leger-2026',
      excerpt: 'Tout savoir sur les quadricycles légers (L6e) : réglementation, permis nécessaire, vitesse maximale, et pourquoi ces véhicules électriques sont l\'avenir de la mobilité urbaine.',
      content: `Les quadricycles légers, aussi appelés « voitures sans permis », sont des véhicules à quatre roues dont la masse à vide ne dépasse pas 425 kg et dont la vitesse maximale est limitée à 45 km/h.

## Qui peut conduire un quadricycle léger ?

En France, les quadricycles légers sont accessibles dès **14 ans** avec le permis AM (anciennement BSR). Pour les personnes nées avant le 1er janvier 1988, aucun permis n'est requis. C'est une solution idéale pour les jeunes, les seniors, ou toute personne souhaitant une alternative pratique à la voiture classique.

## Les avantages du quadricycle électrique

- **Zéro émission** : 100% électrique, pas de pollution locale
- **Économique** : coût d'utilisation très faible (environ 1€ aux 100 km)
- **Pas besoin de permis B** : accessible dès 14 ans
- **Stationnement facilité** : dimensions compactes
- **Entretien réduit** : moins de pièces mécaniques qu'un véhicule thermique

## La réglementation en 2026

Depuis janvier 2025, les normes européennes ont évolué pour encourager l'adoption des quadricycles électriques. Les aides à l'achat ont été renforcées et les ZFE (Zones à Faibles Émissions) autorisent la circulation de tous les quadricycles électriques sans restriction.

## Pourquoi choisir CARLITE ?

Chez CARLITE, nous concevons des quadricycles électriques pensés pour la ville moderne. Notre CarCITY 45 combine design contemporain, équipements premium et autonomie généreuse de 140 km. Le tout à un prix accessible de 8 990 €.`,
      imageUrl: '/images/article_quadricycle.jpg',
      category: 'Guide',
      tags: ['quadricycle', 'sans permis', 'réglementation', 'L6e'],
      author: 'CARLITE',
      published: true,
      featured: true,
      readTime: 6,
      publishDate: new Date('2026-04-01T00:00:00.000Z'),
    },
    {
      title: 'Bornes de recharge : où et comment recharger son véhicule électrique',
      slug: 'bornes-recharge-vehicule-electrique',
      excerpt: 'Le guide pratique des bornes de recharge pour véhicules électriques en France : types de prises, temps de charge, applications utiles et conseils pour recharger efficacement.',
      content: `La recharge d'un véhicule électrique est aujourd'hui plus simple que jamais grâce au développement rapide du réseau de bornes en France. Voici tout ce que vous devez savoir.

## Les différents types de recharge

### Prise domestique (2,3 kW)
La solution la plus simple : branchez votre véhicule sur une prise standard. Pour un quadricycle CARLITE, comptez environ 6 heures pour une charge complète. Idéal pour la nuit.

### Wallbox (7,4 kW)
Une borne murale installée chez vous divise le temps de charge par trois. C'est la solution recommandée pour un usage quotidien confortable.

### Bornes publiques (22 kW et plus)
Le réseau français compte désormais plus de 150 000 points de charge publics. Les bornes accélérées permettent de récupérer 80% de batterie en moins de 2 heures.

## Les applications indispensables

- **ChargeMap** : la plus complète, avec avis utilisateurs
- **Chargeprice** : compare les tarifs en temps réel
- **PlugShare** : communauté internationale active

## Combien coûte une recharge ?

Pour un quadricycle CARLITE avec sa batterie de 8 kWh :
- À domicile : environ **1,50 € pour 140 km** (tarif heures creuses)
- Sur borne publique : entre **2 € et 4 €** selon l'opérateur

## Le réseau en expansion

La France s'est engagée à atteindre 400 000 bornes publiques d'ici 2030. Les supermarchés, parkings et stations-service s'équipent massivement. Vous ne serez jamais loin d'une borne !`,
      imageUrl: '/images/article_bornes.jpg',
      category: 'Pratique',
      tags: ['recharge', 'bornes', 'électrique', 'infrastructure'],
      author: 'CARLITE',
      published: true,
      featured: false,
      readTime: 5,
      publishDate: new Date('2026-04-08T00:00:00.000Z'),
    },
    {
      title: 'Batteries lithium : technologie, durée de vie et recyclage',
      slug: 'batteries-lithium-technologie-duree-vie',
      excerpt: 'Découvrez comment fonctionnent les batteries lithium des véhicules électriques, leur durée de vie réelle, les innovations à venir et les enjeux du recyclage.',
      content: `Les batteries lithium-ion sont au cœur de la révolution électrique. Comprendre leur fonctionnement permet de mieux utiliser et entretenir son véhicule.

## Comment fonctionne une batterie lithium-ion ?

Une batterie lithium-ion stocke l'énergie grâce au mouvement d'ions lithium entre deux électrodes. Cette technologie offre un excellent rapport poids/énergie, idéal pour les véhicules électriques.

## Quelle durée de vie ?

Les batteries modernes sont conçues pour durer **8 à 15 ans** en usage normal. Après 1 500 cycles de charge/décharge, une batterie conserve encore environ 80% de sa capacité initiale.

### Conseils pour prolonger la durée de vie

- **Évitez les charges à 100%** : maintenez idéalement entre 20% et 80%
- **Limitez les charges rapides** : préférez la charge lente au quotidien
- **Protégez du froid extrême** : garez votre véhicule à l'abri si possible
- **Roulez régulièrement** : une batterie qui dort s'abîme plus vite

## Les batteries CARLITE

Nos quadricycles sont équipés de batteries **lithium-fer-phosphate (LFP)** de dernière génération. Plus sûres, plus durables et plus respectueuses de l'environnement que les batteries NMC traditionnelles.

## Le recyclage : un enjeu majeur

En Europe, la réglementation impose le recyclage de 95% des composants des batteries. Les usines de recyclage se multiplient en France, transformant les batteries usagées en matières premières pour de nouvelles batteries.

## Seconde vie des batteries

Avant d'être recyclées, les batteries de véhicules électriques peuvent connaître une « seconde vie » comme stockage stationnaire d'énergie solaire ou éolienne. Un cycle vertueux !`,
      imageUrl: '/images/article_batteries.jpg',
      category: 'Technologie',
      tags: ['batterie', 'lithium', 'recyclage', 'technologie'],
      author: 'CARLITE',
      published: true,
      featured: false,
      readTime: 7,
      publishDate: new Date('2026-04-15T00:00:00.000Z'),
    },
    {
      title: 'Réglementation 2026 : ce qui change pour les véhicules sans permis',
      slug: 'reglementation-2026-vehicules-sans-permis',
      excerpt: 'Les nouvelles règles en vigueur pour les quadricycles en France : ZFE, aides à l\'achat, assurance et contrôle technique. Le point complet sur la réglementation 2026.',
      content: `L'année 2026 apporte son lot de nouveautés réglementaires pour les quadricycles et voitures sans permis. Faisons le point sur les changements importants.

## ZFE : les quadricycles électriques toujours bienvenus

Les Zones à Faibles Émissions (ZFE) concernent désormais 45 agglomérations en France. Bonne nouvelle : **les quadricycles 100% électriques comme ceux de CARLITE circulent sans aucune restriction** dans toutes les ZFE.

## Aides à l'achat renforcées

### Le bonus écologique
Le bonus pour l'achat d'un quadricycle électrique neuf est maintenu à **900 €** en 2026. Il est cumulable avec les aides locales.

### La prime à la conversion
Si vous mettez au rebut un ancien véhicule polluant, vous pouvez bénéficier d'une prime allant jusqu'à **1 500 €** pour l'achat d'un quadricycle électrique.

### Aides locales
De nombreuses régions et communes proposent des aides complémentaires. Renseignez-vous auprès de votre mairie !

## Assurance : ce qu'il faut savoir

L'assurance est **obligatoire** pour tout quadricycle, même léger. Les tarifs restent très avantageux : comptez entre **15 et 30 € par mois** pour une formule tous risques.

## Contrôle technique

Les quadricycles lourds (L7e) sont soumis au contrôle technique depuis 2024. Les quadricycles légers (L6e) comme la CarCITY 45 en sont **exemptés**.

## Immatriculation

Tous les quadricycles doivent être immatriculés. La carte grise se fait en ligne sur le site de l'ANTS. CARLITE vous accompagne dans toutes vos démarches administratives.`,
      imageUrl: '/images/article_reglementation.jpg',
      category: 'Réglementation',
      tags: ['réglementation', 'ZFE', 'aides', 'bonus écologique'],
      author: 'CARLITE',
      published: true,
      featured: true,
      readTime: 6,
      publishDate: new Date('2026-04-22T00:00:00.000Z'),
    },
    // --- 20 nouveaux articles, programmés 1/semaine à partir du 25 mai 2026 ---
    {
      title: 'ZFE en France : pourquoi le quadricycle électrique est la solution idéale',
      slug: 'zfe-france-quadricycle-electrique-solution',
      excerpt: 'Les Zones à Faibles Émissions s\'étendent dans toute la France. Découvrez pourquoi les quadricycles électriques CARLITE passent partout sans restriction.',
      content: `Les Zones à Faibles Émissions (ZFE) se multiplient en France et inquiètent de nombreux automobilistes. Pourtant, il existe une solution simple et économique : le quadricycle électrique.

## Qu'est-ce qu'une ZFE ?

Une Zone à Faibles Émissions est un périmètre urbain où la circulation des véhicules les plus polluants est restreinte ou interdite. En 2026, **45 agglomérations françaises** appliquent des ZFE, touchant des millions d'automobilistes.

## Le quadricycle électrique : toujours le bienvenu

Les véhicules 100% électriques bénéficient de la vignette Crit'Air 0, leur donnant un accès **illimité** à toutes les ZFE. Les quadricycles CARLITE, étant entièrement électriques, ne sont soumis à aucune restriction de circulation.

## Les villes concernées

Paris, Lyon, Marseille, Toulouse, Strasbourg, Bordeaux, Lille, Nice, Nantes, Montpellier... La liste s'allonge chaque année. Si vous habitez ou travaillez dans l'une de ces villes, un quadricycle électrique vous garantit une mobilité sans souci.

## Avantages supplémentaires en ZFE

- **Stationnement gratuit ou réduit** dans de nombreuses communes
- **Accès aux voies prioritaires** dans certaines villes
- **Pas de restriction horaire** contrairement aux véhicules Crit'Air 2 et plus
- **Exonération de la taxe sur les certificats d'immatriculation** dans certaines régions

## L'alternative CARLITE

Avec la CarCITY 45, vous circulez librement en ville pour moins de 9 000 €. Une solution à la fois économique et écologique pour s'adapter aux nouvelles contraintes urbaines. Et si vos trajets dépassent les limites de la ville, la CarCITY 80 vous offre jusqu'à 170 km d'autonomie et 78 km/h de vitesse maximale.`,
      imageUrl: '/images/article_zfe.jpg',
      category: 'Mobilité',
      tags: ['ZFE', 'mobilité urbaine', 'électrique', 'villes'],
      author: 'CARLITE',
      published: true,
      featured: false,
      readTime: 5,
      publishDate: new Date('2026-05-25T00:00:00.000Z'),
    },
    {
      title: 'Entretien d\'un quadricycle électrique : le guide complet',
      slug: 'entretien-quadricycle-electrique-guide',
      excerpt: 'Un véhicule électrique nécessite bien moins d\'entretien qu\'un thermique. Voici le calendrier et les conseils pour maintenir votre quadricycle CARLITE en parfait état.',
      content: `L'un des grands avantages d'un véhicule électrique est son entretien simplifié. Pas de vidange, pas de courroie de distribution, pas de pot d'échappement... Voici ce qu'il faut savoir pour entretenir votre quadricycle CARLITE.

## Un entretien simplifié

Un quadricycle électrique possède **80% de pièces mécaniques en moins** qu'un véhicule thermique. Fini les vidanges, les bougies, les filtres à carburant et les courroies.

## Les points de contrôle essentiels

### Tous les 6 mois
- **Pneus** : vérifiez la pression et l'usure (pression recommandée : 2,2 bars avant / 2,4 bars arrière)
- **Freins** : inspectez les plaquettes et disques
- **Liquide de frein** : vérifiez le niveau
- **Éclairage** : testez tous les feux et clignotants

### Tous les ans
- **Batterie** : contrôle de l'état de charge et des connexions
- **Suspension** : vérification des amortisseurs et silent-blocs
- **Direction** : jeu et état de la crémaillère
- **Carrosserie** : inspection des joints et fixations

### Tous les 2 ans
- **Liquide de frein** : remplacement complet
- **Courroie de transmission** : contrôle et remplacement si nécessaire
- **Roulements de roue** : vérification

## Le coût d'entretien

L'entretien annuel d'un quadricycle CARLITE revient à environ **150 à 250 €**, contre 600 à 1 000 € pour un véhicule thermique équivalent. Sur 5 ans, l'économie est considérable.

## Le réseau CARLITE

CARLITE dispose d'un réseau de partenaires agréés dans toute la France. Nos techniciens sont formés spécifiquement sur nos modèles et disposent de toutes les pièces détachées en stock. Contactez-nous au 06 13 930 930 pour trouver votre garage le plus proche.`,
      imageUrl: '/images/article_entretien.jpg',
      category: 'Pratique',
      tags: ['entretien', 'maintenance', 'pièces', 'garage'],
      author: 'CARLITE',
      published: true,
      featured: false,
      readTime: 6,
      publishDate: new Date('2026-06-01T00:00:00.000Z'),
    },
    {
      title: 'Combien coûte réellement un quadricycle électrique ? L\'analyse complète',
      slug: 'cout-reel-quadricycle-electrique-analyse',
      excerpt: 'Achat, énergie, entretien, assurance : calculez le coût total de possession d\'un quadricycle électrique CARLITE et comparez avec les alternatives.',
      content: `Le prix d'achat n'est que la partie visible de l'iceberg. Analysons le coût total de possession d'un quadricycle électrique sur 5 ans.

## Le coût d'achat

La CarCITY 45 démarre à **8 990 €**. Avec le bonus écologique de 900 € et une éventuelle prime à la conversion de 1 500 €, le coût d'acquisition peut descendre à **6 590 €**.

## L'énergie : l'avantage décisif

Pour 10 000 km par an avec la CarCITY 45 :
- **Électricité à domicile** : environ 100 à 150 € par an (tarif heures creuses)
- **Essence équivalente** (scooter 50cc) : environ 400 à 600 € par an

L'économie annuelle sur l'énergie est d'environ **350 à 450 €**.

## L'assurance

Un quadricycle léger bénéficie de tarifs d'assurance très avantageux :
- **Tiers** : à partir de 12 €/mois
- **Tous risques** : de 20 à 30 €/mois

À comparer avec 50 à 100 €/mois pour une voiture classique.

## L'entretien

Comme vu dans notre article dédié, l'entretien annuel d'un quadricycle électrique revient à **150 à 250 €** contre 600 à 1 000 € pour un véhicule thermique.

## Le bilan sur 5 ans

| Poste | CarCITY 45 | Scooter 50cc | Citadine thermique |
|-------|-----------|-------------|-------------------|
| Achat (après aides) | 6 590 € | 2 500 € | 15 000 € |
| Énergie (5 ans) | 625 € | 2 500 € | 5 000 € |
| Assurance (5 ans) | 1 200 € | 900 € | 3 600 € |
| Entretien (5 ans) | 1 000 € | 1 500 € | 4 000 € |
| **Total** | **9 415 €** | **7 400 €** | **27 600 €** |

Le quadricycle électrique est **3 fois moins cher** qu'une citadine thermique sur 5 ans, tout en offrant plus de confort et de sécurité qu'un scooter.`,
      imageUrl: '/images/article_economie.jpg',
      category: 'Économie',
      tags: ['coût', 'économie', 'budget', 'comparaison'],
      author: 'CARLITE',
      published: true,
      featured: true,
      readTime: 7,
      publishDate: new Date('2026-06-08T00:00:00.000Z'),
    },
    {
      title: 'La sécurité des quadricycles électriques : mythes et réalités',
      slug: 'securite-quadricycles-electriques-mythes-realites',
      excerpt: 'Les quadricycles sont-ils sûrs ? Découvrez les équipements de sécurité, les normes en vigueur et les résultats des tests qui prouvent leur fiabilité.',
      content: `La sécurité est souvent la première préoccupation des futurs acquéreurs de quadricycles. Faisons le point sur les faits.

## Les normes européennes

Tous les quadricycles commercialisés en Europe doivent respecter la réglementation européenne **168/2013/UE** qui impose des standards stricts en matière de sécurité passive et active.

## Les équipements de série CARLITE

### Sécurité passive
- **Structure renforcée** avec poutre de renfort latérale
- **Ceintures de sécurité** 3 points pour tous les passagers
- **Pare-brise en verre feuilleté** (comme les voitures)
- **Appuie-tête réglables**

### Sécurité active
- **Freins à disque** à l'avant et à l'arrière
- **Direction assistée** (en option)
- **Éclairage LED** pour une meilleure visibilité
- **Rétroviseurs grand angle**

## La vitesse : un facteur de sécurité

Contrairement aux idées reçues, la limitation de vitesse à 45 km/h des quadricycles légers est un **avantage en termes de sécurité**. À cette vitesse, l'énergie cinétique en cas de choc est 4 fois inférieure à celle d'un véhicule roulant à 90 km/h.

## Les bons réflexes

- Respectez les limitations de vitesse
- Rendez-vous visible : allumez vos feux même de jour
- Portez votre ceinture de sécurité en toutes circonstances
- Adaptez votre conduite aux conditions météo

## L'engagement CARLITE

Chez CARLITE, la sécurité est une priorité absolue. Chaque véhicule est contrôlé individuellement avant livraison. Nous investissons continuellement dans l'amélioration de nos équipements de sécurité pour offrir à nos clients la meilleure protection possible.`,
      imageUrl: '/images/article_securite.jpg',
      category: 'Guide',
      tags: ['sécurité', 'normes', 'équipements', 'protection'],
      author: 'CARLITE',
      published: true,
      featured: false,
      readTime: 6,
      publishDate: new Date('2026-06-15T00:00:00.000Z'),
    },
    {
      title: 'Quadricycle électrique en vacances : nos conseils pour l\'été',
      slug: 'quadricycle-electrique-vacances-ete-conseils',
      excerpt: 'Camping, bord de mer, montagne : comment profiter de votre quadricycle électrique CARLITE pendant les vacances d\'été. Nos astuces et recommandations.',
      content: `L'été approche et votre quadricycle électrique CARLITE est le compagnon idéal pour vos vacances. Voici nos conseils pour en profiter pleinement.

## Au camping

L'E-SAM est devenu le véhicule vedette des campings et villages vacances. Silencieux, non-polluant et compact, il permet de se déplacer facilement sur les allées sans déranger les voisins.

### Astuces camping
- Branchez votre véhicule sur la prise de votre emplacement le soir
- Utilisez le mode éco pour maximiser l'autonomie
- L'E-SAM avec plateau arrière est parfait pour transporter les courses et les équipements de plage

## En bord de mer

La CarCITY 45 est idéale pour les déplacements en bord de mer : marché le matin, plage l'après-midi, restaurant le soir. Avec son coffre compact, elle transporte facilement parasol, glacière et serviettes.

### Précautions bord de mer
- Rincez votre véhicule régulièrement pour éliminer le sel marin
- Vérifiez la pression des pneus plus souvent (la chaleur les fait gonfler)
- Protégez l'habitacle du soleil avec un pare-soleil

## À la montagne

En station, les quadricycles électriques sont parfaits pour les courts déplacements. Attention toutefois aux pentes raides qui sollicitent davantage la batterie.

### Conseils montagne
- Prévoyez une marge d'autonomie de 20% pour les dénivelés
- Profitez du freinage régénératif dans les descentes
- La batterie lithium conserve mieux ses performances en altitude que la batterie plomb

## Avant le départ

- Faites contrôler votre véhicule chez un partenaire CARLITE
- Vérifiez l'état de vos pneus et l'éclairage
- Emportez votre câble de recharge et un adaptateur si besoin
- Notez le numéro du service client CARLITE : **06 13 930 930**`,
      imageUrl: '/images/article_vacances.jpg',
      category: 'Pratique',
      tags: ['vacances', 'été', 'camping', 'conseils'],
      author: 'CARLITE',
      published: true,
      featured: false,
      readTime: 5,
      publishDate: new Date('2026-06-22T00:00:00.000Z'),
    },
    {
      title: 'Assurer son quadricycle électrique : tarifs, garanties et astuces',
      slug: 'assurer-quadricycle-electrique-tarifs-garanties',
      excerpt: 'Tout savoir sur l\'assurance des quadricycles : obligations légales, types de contrats, tarifs moyens et astuces pour payer moins cher.',
      content: `L'assurance est obligatoire pour tout quadricycle, même léger. Bonne nouvelle : les tarifs sont parmi les plus bas du marché automobile.

## L'obligation légale

Tout véhicule terrestre à moteur doit être assuré au minimum en responsabilité civile (garantie au tiers). Les quadricycles ne font pas exception. Rouler sans assurance expose à une amende de **3 750 €** et à une suspension de permis.

## Les types de contrats

### Tiers simple
- Couvre les dommages causés aux autres
- À partir de **12 €/mois**
- Recommandé pour les véhicules de plus de 5 ans

### Tiers étendu
- Tiers + vol, incendie, bris de glace
- À partir de **18 €/mois**
- Le meilleur rapport qualité/prix

### Tous risques
- Couverture complète, y compris vos propres dommages
- De **25 à 35 €/mois**
- Recommandé pour les véhicules neufs

## Les garanties spécifiques à demander

- **Garantie batterie** : indispensable pour couvrir le composant le plus cher
- **Assistance 0 km** : utile en cas de panne de batterie
- **Prêt de véhicule** : pour ne pas rester à pied pendant les réparations
- **Protection juridique** : en cas de litige

## Astuces pour réduire la prime

- Comparez au moins 3 devis
- Regroupez vos assurances chez le même assureur (multi-véhicules)
- Installez un traceur GPS (réduction vol)
- Garez votre véhicule dans un garage fermé
- Payez annuellement plutôt que mensuellement (-10% en moyenne)

## Les assureurs recommandés

Plusieurs assureurs se sont spécialisés dans les quadricycles et proposent des offres compétitives : Matmut, MAIF, Groupama, et certains courtiers en ligne comme Les Furets ou Assurland.`,
      imageUrl: '/images/article_assurance.jpg',
      category: 'Pratique',
      tags: ['assurance', 'tarifs', 'garanties', 'économie'],
      author: 'CARLITE',
      published: true,
      featured: false,
      readTime: 6,
      publishDate: new Date('2026-06-29T00:00:00.000Z'),
    },
    {
      title: 'Recharge solaire : alimenter son quadricycle avec le soleil',
      slug: 'recharge-solaire-quadricycle-electrique',
      excerpt: 'Comment coupler panneaux solaires et véhicule électrique pour une mobilité 100% verte et quasi-gratuite. Le guide pratique de l\'auto-consommation.',
      content: `Et si votre quadricycle roulait gratuitement grâce au soleil ? Avec des panneaux solaires, c'est possible et de plus en plus accessible.

## Le principe

Des panneaux photovoltaïques installés sur votre toit produisent de l'électricité que vous utilisez pour recharger votre quadricycle. Résultat : une mobilité 100% renouvelable et quasi-gratuite.

## L'installation type

Pour recharger une CarCITY 45 (batterie 7 kWh) quotidiennement, il faut environ :
- **4 panneaux solaires** de 400 Wc (soit ~7 m²)
- Un **micro-onduleur** ou onduleur string
- Un **compteur intelligent** pour optimiser l'auto-consommation
- Coût total : environ **3 000 à 4 500 €** (avant aides)

## Les aides disponibles

- **Prime à l'auto-consommation** : jusqu'à 370 €/kWc
- **TVA réduite à 10%** pour les installations ≤ 3 kWc
- **Obligation d'achat EDF** : revente du surplus à tarif garanti
- **Aides régionales** variables selon votre lieu de résidence

## Le calcul de rentabilité

Avec une installation de 1,6 kWc (4 panneaux) :
- Production annuelle : environ **1 800 kWh** (Sud de la France)
- Consommation du quadricycle : environ **700 kWh/an**
- Surplus pour la maison : **1 100 kWh/an**
- Économie totale : environ **400 €/an**
- **Retour sur investissement : 7 à 8 ans**

## L'avenir du Vehicle-to-Home (V2H)

Les futures batteries de quadricycles pourront stocker l'énergie solaire excédentaire et la restituer à la maison le soir. Cette technologie, appelée Vehicle-to-Home, transformera chaque véhicule en batterie domestique.

## Notre conseil

Commencez par un kit solaire en auto-consommation simple. Branchez votre quadricycle CARLITE pendant les heures d'ensoleillement pour maximiser l'utilisation directe de l'énergie solaire. C'est la configuration la plus rentable et la plus simple.`,
      imageUrl: '/images/article_solaire.jpg',
      category: 'Technologie',
      tags: ['solaire', 'énergie', 'photovoltaïque', 'auto-consommation'],
      author: 'CARLITE',
      published: true,
      featured: false,
      readTime: 7,
      publishDate: new Date('2026-07-06T00:00:00.000Z'),
    },
    {
      title: 'Seniors et mobilité électrique : retrouvez votre indépendance',
      slug: 'seniors-mobilite-electrique-independance',
      excerpt: 'Le quadricycle électrique sans permis est la solution idéale pour les seniors qui souhaitent conserver leur autonomie de déplacement en toute sécurité.',
      content: `Avec l'âge, la question de la mobilité se pose de plus en plus. Le quadricycle électrique sans permis offre une réponse sécurisante et pratique.

## Pourquoi les seniors choisissent le quadricycle

- **Pas besoin de permis B** : idéal après un retrait ou un abandon du permis
- **Vitesse maîtrisée** : 45 km/h maximum, rassurant pour le conducteur et ses proches
- **Conduite simple** : boîte automatique, direction assistée
- **Accès aux commerces et services** sans dépendre des transports en commun ou de la famille

## Les avantages pour les seniors

### Confort
La CarCITY 45 est conçue pour un accès facile : portières larges, siège réglable, volant ajustable. La climatisation et le chauffage (en option) assurent un confort toute l'année.

### Sécurité
Freins à disque, ceintures 3 points, structure renforcée... Le quadricycle CARLITE offre bien plus de protection qu'un scooter ou un vélo électrique.

### Simplicité
Pas de vitesses à passer, pas de démarrage complexe. Il suffit de tourner la clé et de rouler. Le tableau de bord est clair et lisible.

## Témoignage

*« Depuis que j'ai ma CarCITY 45, je fais mes courses seule, je vais chez le médecin et je rends visite à mes amis quand je veux. J'ai retrouvé ma liberté. »* — Marie-Thérèse, 78 ans, Boulogne-Billancourt

## Le permis AM pour les seniors

Pour les personnes nées **avant le 1er janvier 1988**, aucun permis n'est nécessaire pour conduire un quadricycle léger. Pour les autres, le permis AM s'obtient facilement après une formation de 8 heures en auto-école.

## L'accompagnement CARLITE

Nous proposons à nos clients seniors :
- Une **formation gratuite** à la prise en main du véhicule
- Un **essai gratuit** sans engagement au showroom
- Un **service après-vente** réactif et à l'écoute
- La **livraison à domicile** partout en Île-de-France`,
      imageUrl: '/images/article_seniors.jpg',
      category: 'Mobilité',
      tags: ['seniors', 'autonomie', 'mobilité', 'sans permis'],
      author: 'CARLITE',
      published: true,
      featured: true,
      readTime: 6,
      publishDate: new Date('2026-07-13T00:00:00.000Z'),
    },
    {
      title: 'Golfettes électriques : le choix des meilleurs parcours',
      slug: 'golfettes-electriques-parcours-golf',
      excerpt: 'Des clubs de golf aux domaines hôteliers, les golfettes électriques CARLITE allient performance, silence et respect de l\'environnement.',
      content: `Le golf et l'électrique forment un duo naturel. Les golfettes électriques sont devenues incontournables sur les parcours modernes.

## Pourquoi choisir une golfette électrique ?

### Le silence
Sur un parcours de golf, le silence est d'or. Les golfettes électriques n'émettent aucun bruit de moteur, préservant la quiétude du jeu et le confort des joueurs.

### Le respect du gazon
Les golfettes électriques sont plus légères et ont un couple de démarrage plus doux, ce qui réduit l'impact sur le gazon. Fini les traces de pneus et les ornières.

### L'économie
Le coût d'utilisation d'une golfette électrique est **5 à 10 fois inférieur** à celui d'un modèle thermique. La recharge coûte quelques centimes quand un plein d'essence représente plusieurs euros.

## L'E-SAM : la golfette nouvelle génération

L'E-SAM de CARLITE se distingue des golfettes traditionnelles par :
- Une **transmission 4x4** pour tous les terrains
- Une **autonomie de 80 km** suffisante pour plusieurs tours de parcours
- Des **configurations personnalisables** : 2, 4 ou 6 places
- Un **plateau arrière modulable** pour les sacs de golf, outils d'entretien ou matériel

## Au-delà du golf

Les golfettes électriques sont également plébiscitées par :
- Les **hôtels et resorts** pour le transport des clients
- Les **parcs d'attractions** et zones de loisirs
- Les **sites industriels** pour la logistique interne
- Les **communautés résidentielles** fermées
- Les **cimetières** et jardins botaniques

## L'offre CARLITE pour les professionnels

CARLITE propose des conditions spéciales pour les achats en flotte :
- **Remises volume** dès 3 véhicules
- **Contrats d'entretien** tout inclus
- **Personnalisation** aux couleurs de votre établissement
- **Livraison et formation** sur site

Contactez-nous au **06 13 930 930** pour un devis personnalisé.`,
      imageUrl: '/images/article_golf.jpg',
      category: 'Guide',
      tags: ['golf', 'golfette', 'professionnel', 'E-SAM'],
      author: 'CARLITE',
      published: true,
      featured: false,
      readTime: 5,
      publishDate: new Date('2026-07-20T00:00:00.000Z'),
    },
    {
      title: 'Collectivités locales : la flotte électrique au service du territoire',
      slug: 'collectivites-locales-flotte-electrique',
      excerpt: 'Mairies, intercommunalités, espaces verts : pourquoi les collectivités françaises adoptent les véhicules utilitaires électriques CARLITE.',
      content: `De plus en plus de collectivités territoriales font le choix de l'électrique pour leurs flottes de véhicules. Un mouvement de fond qui répond à des enjeux multiples.

## Pourquoi les collectivités passent à l'électrique

### Exemplarité environnementale
Les collectivités ont un devoir d'exemplarité en matière de transition écologique. La loi d'orientation des mobilités (LOM) impose d'ailleurs des quotas croissants de véhicules propres lors du renouvellement des flottes publiques.

### Réduction des coûts
Sur 10 ans, un véhicule utilitaire électrique coûte **30 à 40% moins cher** qu'un équivalent thermique (achat + énergie + entretien).

### Confort des agents
Les agents municipaux apprécient le silence et l'absence de vibrations des véhicules électriques, notamment pour les interventions matinales dans les quartiers résidentiels.

## L'E-SAM pour les collectivités

L'E-SAM CARLITE répond parfaitement aux besoins des services techniques municipaux :

### Espaces verts
- Plateau arrière benne pour le transport de terre, plantes et déchets verts
- Transmission 4x4 pour les chemins de parcs et jardins
- Fonctionnement silencieux, idéal à proximité des zones d'habitation

### Voirie et propreté
- Configuration avec caisse fermée pour le matériel
- Robustesse adaptée à un usage intensif quotidien
- Faible coût d'utilisation

### Police municipale et surveillance
- Patrouilles silencieuses dans les zones piétonnes et marchés
- Configuration 4 places pour les équipes
- Signalisation lumineuse personnalisable

## Les aides pour les collectivités

- **ADEME** : subventions pour l'acquisition de véhicules propres
- **Certificats d'économie d'énergie** (CEE)
- **Fonds vert** pour la transition écologique des territoires
- Appels à projets régionaux

## Cas concret

La ville de Boulogne-Billancourt a intégré 5 E-SAM dans sa flotte de services techniques en 2025. Résultat : **-45% de coûts d'énergie** et **satisfaction unanime** des agents.`,
      imageUrl: '/images/article_collectivites.jpg',
      category: 'Guide',
      tags: ['collectivités', 'mairie', 'flotte', 'utilitaire'],
      author: 'CARLITE',
      published: true,
      featured: false,
      readTime: 7,
      publishDate: new Date('2026-07-27T00:00:00.000Z'),
    },
    {
      title: 'Le quadricycle électrique au camping : la liberté silencieuse',
      slug: 'quadricycle-electrique-camping-liberte',
      excerpt: 'Campings, villages vacances, parcs résidentiels : comment les véhicules électriques CARLITE révolutionnent la mobilité dans les espaces de loisirs.',
      content: `Les campings et villages vacances sont les terrains de jeu idéaux des véhicules électriques. Silencieux, compacts et écologiques, ils s'intègrent parfaitement dans ces espaces de détente.

## Pourquoi l'électrique au camping ?

### Le silence
Imaginez : il est 7h du matin, vous partez chercher les croissants. Votre voisin dort encore. Avec un véhicule électrique, aucun bruit de moteur ne viendra troubler sa quiétude. C'est l'argument n°1 des campeurs et des gestionnaires.

### Le respect de l'environnement
Les campings sont souvent situés dans des zones naturelles sensibles. Un véhicule zéro émission préserve la qualité de l'air et réduit la pollution dans ces espaces de nature.

### La praticité
Les allées de camping sont étroites ? La CarCITY 45, avec ses 2,25 m de longueur, se faufile partout. L'E-SAM, avec son plateau arrière, transporte facilement les glacières, barbecues et équipements de plage.

## Pour les gestionnaires de camping

L'E-SAM est plébiscité par les campings pour :
- **L'accueil des clients** : navette entre le parking et les emplacements
- **L'entretien** : transport de matériel, collecte des déchets
- **La sécurité** : rondes silencieuses nocturnes
- **L'animation** : déplacement des équipes dans le site

### L'investissement gagnant
Un camping qui passe à l'électrique pour sa flotte interne :
- Réduit ses coûts de carburant de **70%**
- Améliore son image éco-responsable
- Obtient des avantages pour les labels environnementaux (Clef Verte, Écolabel)
- Augmente la satisfaction client (moins de nuisances sonores)

## Pour les campeurs

Si vous possédez un quadricycle CARLITE, pensez à :
- Vérifier que votre emplacement dispose d'une prise électrique
- Emporter un câble de recharge adapté (fourni avec votre véhicule)
- Profiter du parking gratuit souvent réservé aux véhicules électriques

## Témoignage

*« Nous avons équipé notre camping de 4 E-SAM en 2025. Les retours sont unanimes : clients et personnel adorent le silence et la facilité d'utilisation. »* — Pierre D., gérant de camping dans le Var`,
      imageUrl: '/images/article_camping.jpg',
      category: 'Mobilité',
      tags: ['camping', 'vacances', 'loisirs', 'E-SAM'],
      author: 'CARLITE',
      published: true,
      featured: false,
      readTime: 6,
      publishDate: new Date('2026-08-03T00:00:00.000Z'),
    },
    {
      title: 'Conduire dès 14 ans : le quadricycle, premier véhicule des adolescents',
      slug: 'conduire-14-ans-quadricycle-premier-vehicule',
      excerpt: 'Avec le permis AM, les adolescents peuvent conduire un quadricycle léger dès 14 ans. Tout savoir sur cette solution de mobilité sûre et responsable.',
      content: `Le quadricycle léger est devenu une option de mobilité incontournable pour les adolescents. Plus sûr qu'un scooter et plus pratique que les transports en commun, il offre une vraie indépendance dès 14 ans.

## Le permis AM : simple et rapide

Le permis AM (anciennement BSR) est accessible dès **14 ans** et se compose de :
- **8 heures de formation** en auto-école
- **2 heures de théorie** et **6 heures de pratique**
- **Pas d'examen final** : une attestation de formation suffit
- Coût : environ **300 à 400 €**

Il est également nécessaire d'avoir obtenu l'ASSR2 (Attestation Scolaire de Sécurité Routière de niveau 2), délivrée au collège.

## Pourquoi choisir le quadricycle plutôt que le scooter ?

### La sécurité
Le quadricycle offre une protection incomparable :
- Habitacle fermé avec **ceintures de sécurité**
- **Freins à disque** haute performance
- Protection contre les intempéries
- Visibilité largement supérieure

Les statistiques sont éloquentes : le taux d'accidents graves est **3 fois inférieur** en quadricycle qu'en scooter.

### Le confort
- Pas besoin de casque (conducteur protégé par l'habitacle)
- Climatisation et chauffage disponibles
- Coffre pour le sac de cours et les affaires de sport
- Lecteur multimédia avec Bluetooth (Pack Premium)

### La praticité
- Protection contre la pluie et le froid
- Transport d'un passager possible
- Rangement des affaires dans l'habitacle

## L'avis des parents

*« Notre fille va au lycée en CarCITY 45 depuis septembre. Nous sommes rassurés par la sécurité du véhicule et elle est ravie de son indépendance. »* — Sophie et Marc, parents à Issy-les-Moulineaux

## Les règles à connaître

- Vitesse maximale : **45 km/h**
- Passager autorisé si le véhicule est homologué 2 places
- Assurance **obligatoire**
- Interdiction sur les autoroutes et voies rapides
- Port de la ceinture **obligatoire**

## L'offre CARLITE pour les familles

- **Facilités de paiement** : crédit à partir de 99 €/mois
- **Essai gratuit** pour les parents et l'adolescent
- **Formation de prise en main** offerte
- **Couleurs fun** disponibles : bleu, rouge, vert, jaune, orange`,
      imageUrl: '/images/article_adolescents.jpg',
      category: 'Guide',
      tags: ['adolescents', 'permis AM', '14 ans', 'premier véhicule'],
      author: 'CARLITE',
      published: true,
      featured: true,
      readTime: 7,
      publishDate: new Date('2026-08-10T00:00:00.000Z'),
    },
    {
      title: 'CarCITY 45 vs CarCITY 80 : quel modèle choisir ?',
      slug: 'carcity-45-vs-carcity-80-comparatif',
      excerpt: 'Vitesse, autonomie, prix, permis nécessaire : notre comparatif détaillé des deux modèles phares CARLITE pour vous aider à faire le bon choix.',
      content: `La CarCITY 45 et la CarCITY 80 partagent la même base, mais s'adressent à des profils différents. Voici notre comparatif détaillé.

## Les caractéristiques en un coup d'œil

| Critère | CarCITY 45 | CarCITY 80 |
|---------|-----------|-----------|
| **Catégorie** | L6e (quadricycle léger) | L7e (quadricycle lourd) |
| **Permis requis** | AM (dès 14 ans) | B (dès 18 ans) |
| **Vitesse max** | 45 km/h | 78 km/h |
| **Autonomie** | Jusqu'à 140 km | Jusqu'à 170 km |
| **Batterie** | Plomb ou Lithium 7 kWh | Plomb ou Lithium 10 kWh |
| **Puissance** | 3,5 kW / 6 kW max | 7,5 kW / 14 kW max |
| **Prix** | À partir de 8 990 € | À partir de 10 990 € |

## La CarCITY 45 : pour qui ?

La CarCITY 45 est idéale si vous :
- Avez entre **14 et 17 ans** (avec le permis AM)
- Roulez exclusivement **en ville**
- N'avez pas le permis B ou ne souhaitez pas le passer
- Cherchez la solution la plus **économique**
- Parcourez moins de **30 km par jour**

## La CarCITY 80 : pour qui ?

La CarCITY 80 est faite pour vous si vous :
- Avez le **permis B** et souhaitez plus de puissance
- Empruntez régulièrement des **routes départementales** ou périphériques
- Avez besoin d'une vitesse de croisière **supérieure à 45 km/h**
- Parcourez régulièrement **plus de 30 km par jour**
- Souhaitez **plus de couple** pour les montées

## Points communs

Les deux modèles partagent :
- Le même **design** élégant et moderne
- Les mêmes **options** de personnalisation (couleurs, Pack Premium, climatisation)
- Le même **châssis** robuste et sécuritaire
- La même **facilité de recharge** (prise 220V standard)
- Le même **confort** d'habitacle

## Notre recommandation

Si vous hésitez entre les deux et que vous avez le permis B, la **CarCITY 80** offre une polyvalence supérieure pour un surcoût de 2 000 €. Pour les plus jeunes ou un usage strictement urbain, la **CarCITY 45** reste imbattable.

Venez les essayer toutes les deux dans notre showroom à Boulogne-Billancourt !`,
      imageUrl: '/images/article_comparatif.jpg',
      category: 'Guide',
      tags: ['comparatif', 'CarCITY 45', 'CarCITY 80', 'choix'],
      author: 'CARLITE',
      published: true,
      featured: false,
      readTime: 6,
      publishDate: new Date('2026-08-17T00:00:00.000Z'),
    },
    {
      title: 'Subventions et aides à l\'achat : le guide 2026 pour les quadricycles',
      slug: 'subventions-aides-achat-quadricycles-2026',
      excerpt: 'Bonus écologique, prime à la conversion, aides régionales : toutes les subventions disponibles pour financer votre quadricycle électrique en 2026.',
      content: `L'État et les collectivités proposent de nombreuses aides pour encourager l'achat de véhicules électriques. Voici le panorama complet pour 2026.

## Le bonus écologique

### Montant
Le bonus pour l'achat d'un quadricycle électrique neuf est de **900 €** en 2026.

### Conditions
- Véhicule neuf, 100% électrique
- Prix d'achat inférieur à 47 000 € TTC
- Pas de revente dans les 6 mois ou avant d'avoir parcouru 6 000 km

### Comment en bénéficier ?
Le bonus peut être déduit directement du prix d'achat par le concessionnaire (CARLITE le fait systématiquement) ou demandé a posteriori sur le site de l'ASP.

## La prime à la conversion

### Montant
Jusqu'à **1 500 €** pour la mise au rebut d'un ancien véhicule polluant (Crit'Air 3 ou plus).

### Conditions
- Mise au rebut effective du véhicule ancien
- Revenu fiscal de référence par part inférieur à un certain seuil
- Véhicule ancien possédé depuis au moins 1 an

## Les aides régionales (exemples)

### Île-de-France
- **Aide Métropole du Grand Paris** : jusqu'à 6 000 € (sous conditions de revenus)
- **Aide Ville de Paris** : jusqu'à 4 000 € (résidents parisiens)

### Occitanie
- **Éco-chèque mobilité** : jusqu'à 2 000 €

### Auvergne-Rhône-Alpes
- **Aide régionale** : jusqu'à 1 000 €

### Nouvelle-Aquitaine
- **Aide à la mobilité** : jusqu'à 1 500 €

*Les montants et conditions peuvent varier. Vérifiez auprès de votre collectivité.*

## Cumul des aides

Bonne nouvelle : la plupart des aides sont **cumulables** ! Pour une CarCITY 45 à 8 990 € :

| Aide | Montant |
|------|---------|
| Bonus écologique | -900 € |
| Prime à la conversion | -1 500 € |
| Aide régionale (ex: IDF) | -1 000 à -6 000 € |
| **Prix final** | **590 à 5 590 €** |

## CARLITE vous accompagne

Notre équipe vous aide gratuitement à identifier et à constituer vos dossiers d'aide. Contactez-nous au **06 13 930 930** pour une estimation personnalisée de votre reste à charge.`,
      imageUrl: '/images/article_subventions.jpg',
      category: 'Économie',
      tags: ['subventions', 'aides', 'bonus', 'financement'],
      author: 'CARLITE',
      published: true,
      featured: true,
      readTime: 8,
      publishDate: new Date('2026-08-24T00:00:00.000Z'),
    },
    {
      title: 'Conduire un quadricycle électrique en hiver : nos conseils',
      slug: 'conduire-quadricycle-electrique-hiver-conseils',
      excerpt: 'Froid, pluie, gel : comment préparer et utiliser votre quadricycle électrique CARLITE pendant la saison hivernale. Autonomie, batterie et sécurité.',
      content: `L'hiver ne doit pas vous empêcher de rouler en quadricycle électrique. Avec quelques précautions, votre CARLITE reste performante toute l'année.

## L'impact du froid sur la batterie

Le froid réduit temporairement les performances de la batterie. Voici ce que vous devez savoir :
- **Batterie plomb** : perte d'autonomie de **20 à 30%** par temps très froid (-5°C)
- **Batterie lithium** : perte de **10 à 15%** seulement, grâce à une meilleure résistance au froid

### Comment limiter l'impact

- **Garez votre véhicule dans un garage** si possible, même non chauffé. La température y reste supérieure à l'extérieur.
- **Rechargez juste avant de partir** : la batterie est plus chaude après la charge et offre de meilleures performances.
- **Préchauffez l'habitacle** pendant la charge, avant de débrancher. Le chauffage consomme de l'énergie qui sera ainsi prise sur le réseau plutôt que sur la batterie.

## Préparer son quadricycle pour l'hiver

### Les pneus
Vérifiez la pression (elle baisse avec le froid) et l'usure. Des pneus bien gonflés et en bon état sont essentiels pour l'adhérence.

### Les essuie-glaces
Remplacez-les si nécessaire et gardez du liquide lave-glace antigel.

### L'éclairage
Vérifiez tous les feux. En hiver, vous roulez souvent dans l'obscurité. Optez pour les LED, plus visibles.

### Le chauffage
Si votre CarCITY est équipée de la climatisation réversible, elle fait aussi chauffage. Sinon, un petit chauffage d'appoint 12V peut être une solution.

## Conduire en sécurité

- **Anticipez les freinages** : distances de freinage allongées sur route mouillée ou verglacée
- **Réduisez votre vitesse** dans les virages et descentes
- **Allumez vos feux** même en journée pour être bien visible
- **Évitez les flaques d'eau profondes** qui peuvent mouiller les connecteurs électriques
- **Dégagez complètement le pare-brise** et les vitres avant de démarrer

## L'autonomie en hiver

En utilisant le chauffage et par température froide, prévoyez une autonomie réduite d'environ 20%. Si vous parcourez habituellement 30 km par jour, votre batterie suffira largement même en hiver.

## Le conseil CARLITE

Si vous envisagez un achat, l'option **batterie lithium** est particulièrement recommandée si vous vivez dans une région froide. Sa résistance au froid est nettement supérieure à celle des batteries plomb.`,
      imageUrl: '/images/article_hiver.jpg',
      category: 'Pratique',
      tags: ['hiver', 'froid', 'batterie', 'sécurité'],
      author: 'CARLITE',
      published: true,
      featured: false,
      readTime: 6,
      publishDate: new Date('2026-08-31T00:00:00.000Z'),
    },
    {
      title: 'L\'avenir des quadricycles : innovations et tendances 2027-2030',
      slug: 'avenir-quadricycles-innovations-tendances-2030',
      excerpt: 'Batteries solid-state, conduite autonome, connectivité : les innovations qui transformeront les quadricycles électriques dans les prochaines années.',
      content: `Le secteur des quadricycles électriques est en pleine effervescence. Voici les innovations qui dessineront la mobilité légère de demain.

## Les batteries du futur

### Batteries solid-state
Les batteries à électrolyte solide promettent :
- **Densité énergétique doublée** : deux fois plus d'autonomie pour le même poids
- **Recharge ultra-rapide** : 80% en 15 minutes
- **Durée de vie allongée** : plus de 3 000 cycles
- **Sécurité accrue** : pas de risque d'incendie

Les premiers prototypes sont attendus en série d'ici **2028**.

### Batteries sodium-ion
Alternative économique au lithium, le sodium-ion offre :
- Un coût de production **30% inférieur**
- D'excellentes performances par temps froid
- Des matériaux plus abondants et moins polluants

## La connectivité

### Le quadricycle connecté
Les futurs modèles intégreront :
- **Application smartphone** pour la gestion à distance (état de charge, localisation, climatisation)
- **Mises à jour OTA** (Over-The-Air) du logiciel
- **Télémétrie** pour la maintenance prédictive
- **Partage de véhicule** facilité entre membres d'une famille

### L'intégration smart city
Les quadricycles communiqueront avec l'infrastructure urbaine :
- Feux de signalisation intelligents
- Places de parking connectées
- Bornes de recharge réservables

## L'aide à la conduite

Même à 45 km/h, les systèmes d'aide à la conduite apportent un confort et une sécurité supplémentaires :
- **Freinage d'urgence automatique**
- **Détection des piétons**
- **Aide au stationnement** automatique
- **Régulateur de vitesse adaptatif**

## Le design

Les futurs quadricycles seront :
- Plus **personnalisables** avec des panneaux de carrosserie interchangeables
- Plus **aérodynamiques** pour une meilleure autonomie
- Fabriqués avec des **matériaux recyclés** et bio-sourcés
- Dotés de **toits solaires intégrés** pour l'auto-recharge

## La vision CARLITE

Chez CARLITE, nous investissons dans la R&D pour intégrer progressivement ces innovations dans nos modèles. Notre objectif : rester à la pointe de la mobilité électrique légère tout en conservant nos valeurs de simplicité, d'accessibilité et de fabrication française.

Restez connectés : les annonces arrivent bientôt !`,
      imageUrl: '/images/article_avenir.jpg',
      category: 'Technologie',
      tags: ['innovation', 'futur', 'batterie', 'connectivité'],
      author: 'CARLITE',
      published: true,
      featured: false,
      readTime: 7,
      publishDate: new Date('2026-09-07T00:00:00.000Z'),
    },
    {
      title: 'Plomb ou lithium : quelle batterie pour votre quadricycle ?',
      slug: 'plomb-ou-lithium-quelle-batterie-quadricycle',
      excerpt: 'Comparaison détaillée des batteries plomb et lithium pour quadricycles : performances, durée de vie, prix et critères de choix.',
      content: `Le choix de la batterie est l'une des décisions les plus importantes lors de l'achat d'un quadricycle électrique. Voici tout ce qu'il faut savoir pour faire le bon choix.

## Batterie plomb (AGM/Gel)

### Avantages
- **Prix d'achat inférieur** : environ 800 à 1 200 € pour un pack complet
- **Technologie éprouvée** et bien maîtrisée
- **Recyclage** facilement disponible (filière mature)
- **Remplacement** facile et rapide

### Inconvénients
- **Poids élevé** : environ 80 à 120 kg pour un pack de 5 kWh
- **Durée de vie limitée** : 300 à 500 cycles (2-3 ans en usage quotidien)
- **Sensible au froid** : perte d'autonomie importante en hiver
- **Charge lente** : pas de charge rapide possible
- **Effet mémoire** partiel si mal entretenue

## Batterie lithium (LFP)

### Avantages
- **Poids réduit** : 3 à 4 fois plus légère que le plomb (20-30 kg)
- **Durée de vie supérieure** : 1 500 à 2 000 cycles (8-10 ans)
- **Performances stables** par temps froid
- **Pas d'effet mémoire** : charge partielle sans conséquence
- **Autonomie supérieure** grâce au poids réduit

### Inconvénients
- **Prix d'achat supérieur** : 2 000 à 3 500 € pour un pack complet
- **Remplacement** par un professionnel recommandé

## Comparaison chiffrée

| Critère | Plomb (AGM) | Lithium (LFP) |
|---------|-------------|---------------|
| Prix du pack | 800-1 200 € | 2 000-3 500 € |
| Poids | 80-120 kg | 20-30 kg |
| Cycles | 300-500 | 1 500-2 000 |
| Durée de vie | 2-3 ans | 8-10 ans |
| Autonomie (CarCITY 45) | 60-80 km | 120-140 km |
| Perte en hiver | 20-30% | 10-15% |
| **Coût par km sur 10 ans** | **~0,04 €** | **~0,02 €** |

## Notre recommandation

**Si votre budget le permet, choisissez le lithium.** Sur la durée, c'est le choix le plus économique et le plus performant. La batterie lithium se rentabilise en 3 à 4 ans grâce à sa durée de vie supérieure.

**Si votre budget est serré**, la batterie plomb reste une option viable, surtout pour un usage modéré (moins de 20 km/jour). Vous pourrez toujours passer au lithium lors du remplacement.

CARLITE propose les deux options sur la CarCITY 45 et la CarCITY 80, avec un surcoût de 2 000 à 2 500 € pour le lithium.`,
      imageUrl: '/images/article_batteries.jpg',
      category: 'Technologie',
      tags: ['batterie', 'plomb', 'lithium', 'comparaison'],
      author: 'CARLITE',
      published: true,
      featured: false,
      readTime: 7,
      publishDate: new Date('2026-09-14T00:00:00.000Z'),
    },
    {
      title: 'L\'E-SAM : le véhicule utilitaire électrique qui fait tout',
      slug: 'e-sam-vehicule-utilitaire-electrique-polyvalent',
      excerpt: 'De 2 à 9 places, avec benne, caisse fermée ou banquettes : découvrez toutes les configurations de l\'E-SAM, le couteau suisse de CARLITE.',
      content: `L'E-SAM n'est pas un véhicule utilitaire ordinaire. C'est une plateforme modulable qui s'adapte à presque tous les besoins professionnels et de loisirs.

## Une plateforme, mille usages

L'E-SAM repose sur un châssis robuste équipé d'une transmission **4x4** et d'un moteur électrique de 7,5 kW. Cette base commune permet de créer des configurations très différentes grâce au système de plateau arrière interchangeable.

## Les configurations disponibles

### E-SAM Benne (2 places)
- Plateau basculant arrière
- Charge utile : jusqu'à **500 kg**
- Idéal pour : espaces verts, chantiers, exploitation agricole
- Prix : à partir de **13 300 €**

### E-SAM Caisse fermée (2 places)
- Coffre fermé et verrouillable à l'arrière
- Volume de chargement : **1,2 m³**
- Idéal pour : livraisons, maintenance, stockage sécurisé
- Prix : à partir de **14 200 €**

### E-SAM 4 places
- Banquette arrière confortable
- Idéal pour : transport d'équipes, surveillance, accueil
- Prix : à partir de **14 500 €**

### E-SAM 6 places
- Deux rangées de banquettes arrière
- Idéal pour : navettes, visites de sites, transport de groupes
- Prix : à partir de **16 000 €**

### E-SAM 9 places (navette)
- Configuration navette avec trois rangées
- Idéal pour : campings, parcs, hôtels, domaines
- Prix : à partir de **17 500 €**

### E-SAM PMR
- Adaptation pour personnes à mobilité réduite
- Rampe d'accès intégrée
- Idéal pour : établissements médicaux, collectivités
- Prix : **sur devis**

## Les secteurs d'activité

L'E-SAM est utilisé dans de nombreux secteurs :
- **Golfs et country clubs** : transport des joueurs et entretien du parcours
- **Campings et resorts** : navette clients et logistique
- **Industrie** : logistique interne et transport inter-bâtiments
- **Agriculture** : travaux légers et déplacements dans les exploitations
- **Collectivités** : espaces verts, voirie, surveillance

## Caractéristiques techniques

- **Moteur** : électrique 7,5 kW, transmission 4x4
- **Batterie** : lithium 10 kWh
- **Autonomie** : jusqu'à 80 km
- **Vitesse max** : 40 km/h
- **Charge utile** : jusqu'à 500 kg (selon configuration)
- **Permis** : B

## Essayez l'E-SAM

Venez découvrir l'E-SAM dans notre showroom de Boulogne-Billancourt ou demandez une démonstration sur site. Contactez-nous au **06 13 930 930**.`,
      imageUrl: '/images/esam.jpg',
      category: 'Guide',
      tags: ['E-SAM', 'utilitaire', 'polyvalent', 'professionnel'],
      author: 'CARLITE',
      published: true,
      featured: false,
      readTime: 6,
      publishDate: new Date('2026-09-21T00:00:00.000Z'),
    },
    {
      title: 'Quadricycle électrique et copropriété : installer une prise de recharge',
      slug: 'quadricycle-electrique-copropriete-prise-recharge',
      excerpt: 'Vous habitez en copropriété ? Voici comment installer une prise de recharge pour votre quadricycle électrique grâce au droit à la prise.',
      content: `Installer une prise de recharge en copropriété est un droit garanti par la loi. Voici comment procéder simplement et efficacement.

## Le droit à la prise

Depuis 2011, le **droit à la prise** permet à tout copropriétaire ou locataire de demander l'installation d'une prise de recharge sur sa place de parking, aux frais du demandeur. La copropriété ne peut s'y opposer que pour des motifs sérieux et légitimes (techniques ou de sécurité).

## Les étapes pour installer une prise

### 1. Notifier le syndic
Envoyez une lettre recommandée au syndic avec :
- Votre projet d'installation
- Un descriptif technique
- Un devis d'un installateur qualifié IRVE

### 2. Passage en assemblée générale
Le syndic inscrit le sujet à l'ordre du jour de la prochaine AG. La copropriété a **6 mois** pour s'opposer (mais les cas de refus sont rares et doivent être motivés).

### 3. Réalisation des travaux
Faites appel à un **installateur qualifié IRVE** (Infrastructure de Recharge de Véhicules Électriques). L'installation comprend généralement :
- Le tirage d'un câble depuis le tableau électrique
- L'installation d'un compteur individuel
- La pose de la prise ou de la wallbox

### 4. Mise en service
L'installation est vérifiée par un organisme agréé (Consuel) avant mise en service.

## Quel type d'installation ?

### Prise renforcée (3,2 kW)
- **Coût** : 500 à 800 €
- **Temps de charge CarCITY** : 3 à 4 heures
- **Suffisante** pour un quadricycle électrique
- **Installation** simple et peu coûteuse

### Wallbox (7,4 kW)
- **Coût** : 1 200 à 2 000 €
- **Temps de charge CarCITY** : 1h30 à 2h
- **Recommandée** si vous avez plusieurs véhicules électriques
- **Éligible** au crédit d'impôt de 300 €

## Les aides financières

- **Crédit d'impôt** : 300 € pour l'installation d'une borne (jusqu'au 31/12/2026)
- **Programme ADVENIR** : jusqu'à 50% du coût pris en charge (sous conditions)
- **TVA réduite à 5,5%** pour les installations résidentielles

## L'astuce CARLITE

Pour un quadricycle CARLITE avec sa batterie de 7 à 10 kWh, une simple **prise renforcée** suffit amplement. C'est l'installation la moins chère et la plus simple. Pas besoin de wallbox coûteuse pour un véhicule dont la batterie est bien plus petite que celle d'une voiture électrique classique.`,
      imageUrl: '/images/article_bornes.jpg',
      category: 'Pratique',
      tags: ['copropriété', 'recharge', 'installation', 'droit à la prise'],
      author: 'CARLITE',
      published: true,
      featured: false,
      readTime: 7,
      publishDate: new Date('2026-09-28T00:00:00.000Z'),
    },
    {
      title: 'Mobilité électrique en entreprise : avantages fiscaux et pratiques',
      slug: 'mobilite-electrique-entreprise-avantages-fiscaux',
      excerpt: 'TVA récupérable, amortissement, exonération de TVS : tous les avantages fiscaux de l\'achat d\'un quadricycle électrique pour votre entreprise.',
      content: `L'acquisition d'un quadricycle électrique pour votre entreprise offre des avantages fiscaux considérables. Voici le tour d'horizon complet.

## Les avantages fiscaux

### Amortissement accéléré
Les véhicules électriques bénéficient d'un **suramortissement de 40%** sur le prix d'acquisition (loi de finances 2024, reconduite en 2026). Concrètement, pour un E-SAM à 12 500 € :
- Amortissement classique : 12 500 €
- Suramortissement : 12 500 € × 40% = 5 000 €
- **Déduction totale** : 17 500 €

### Exonération de TVS
Les véhicules 100% électriques sont **totalement exonérés** de la Taxe sur les Véhicules de Société. Pour un quadricycle, l'économie est de 200 à 500 € par an.

### TVA récupérable sur l'électricité
Contrairement au carburant (TVA récupérable à 80%), l'électricité utilisée pour la recharge est **récupérable à 100%**.

### Bonus écologique professionnel
Les entreprises bénéficient du même bonus écologique que les particuliers : **900 €** pour un quadricycle électrique neuf.

## Les avantages pratiques

### Image de marque
Un quadricycle électrique aux couleurs de votre entreprise :
- Véhicule les valeurs environnementales de votre société
- Attire l'attention et crée de la visibilité
- Différencie votre entreprise de la concurrence

### Réduction des coûts opérationnels
- Énergie : **5 à 10 fois moins chère** que le diesel
- Entretien : **60% de coûts en moins**
- Assurance : **tarifs réduits** pour les flottes électriques

### Avantages pour les salariés
- Avantage en nature réduit pour les véhicules électriques mis à disposition
- Possibilité de recharge sur le lieu de travail

## Cas d'usage en entreprise

- **Livraisons urbaines** : derniers kilomètres en ville sans restriction ZFE
- **Déplacements inter-sites** : pour les campus et zones d'activité
- **Artisans** : transport d'outillage compact et économique
- **Gardiennage et sécurité** : rondes silencieuses
- **Hôtellerie-restauration** : navettes clients et logistique

## L'offre CARLITE Entreprise

- **Leasing professionnel** : à partir de 199 €/mois HT
- **Personnalisation corporate** : flocage aux couleurs de votre entreprise
- **Contrat d'entretien** tout inclus
- **Flotte sur mesure** : de 1 à 50 véhicules

Contactez notre service professionnel au **06 13 930 930** ou par email à **contact@carlite.fr**.`,
      imageUrl: '/images/article_economie.jpg',
      category: 'Économie',
      tags: ['entreprise', 'fiscal', 'TVA', 'professionnel'],
      author: 'CARLITE',
      published: true,
      featured: false,
      readTime: 7,
      publishDate: new Date('2026-10-05T00:00:00.000Z'),
    },
    {
      title: '10 idées reçues sur les voitures sans permis électriques',
      slug: '10-idees-recues-voitures-sans-permis-electriques',
      excerpt: 'Trop lentes, pas sûres, pour les vieux... Démêlons le vrai du faux sur les quadricycles électriques et déconstruisons les préjugés.',
      content: `Les voitures sans permis souffrent de nombreux préjugés. Il est temps de rétablir la vérité !

## 1. « C'est un jouet, pas une vraie voiture »

**FAUX.** Un quadricycle est un véhicule homologué, soumis à des normes strictes de sécurité. Il dispose de tous les équipements d'une voiture : ceintures, freins à disque, éclairage, pare-brise en verre feuilleté.

## 2. « C'est réservé aux personnes âgées »

**FAUX.** Les quadricycles légers sont accessibles dès 14 ans avec le permis AM. De plus en plus de jeunes les adoptent pour leur praticité et leur style moderne.

## 3. « C'est dangereux »

**FAUX.** À 45 km/h maximum, l'énergie cinétique en cas de choc est considérablement réduite. Les quadricycles offrent plus de protection qu'un scooter et sont adaptés à la circulation urbaine.

## 4. « Ça n'avance pas »

**PARTIELLEMENT VRAI.** Les quadricycles légers (L6e) sont limités à 45 km/h, ce qui est parfaitement adapté à la ville. Pour ceux qui veulent plus de vitesse, la CarCITY 80 roule à 78 km/h.

## 5. « L'autonomie est ridicule »

**FAUX.** La CarCITY 45 avec batterie lithium offre jusqu'à 140 km d'autonomie. Pour un usage urbain quotidien de 20-30 km, c'est plus que suffisant.

## 6. « C'est moche »

**FAUX.** Les quadricycles modernes comme la CarCITY ont un design soigné, des finitions premium et sont disponibles dans de nombreuses couleurs. Le temps des « pots de yaourt » est révolu.

## 7. « Ça coûte cher pour ce que c'est »

**FAUX.** À partir de 8 990 €, la CarCITY 45 est bien moins chère qu'une voiture classique. Et son coût d'utilisation (énergie + entretien + assurance) est 3 fois inférieur.

## 8. « On ne peut pas rouler sur les routes »

**FAUX.** Les quadricycles sont autorisés sur toutes les routes sauf les autoroutes et voies rapides. Ils ont toute leur place en ville et sur les routes départementales.

## 9. « La recharge est compliquée »

**FAUX.** Une simple prise 220V suffit. Branchez le soir, c'est chargé le matin. Pas besoin de borne spéciale ni d'installation coûteuse.

## 10. « C'est un achat qu'on regrette »

**FAUX.** Les propriétaires de quadricycles électriques affichent un taux de satisfaction de plus de **90%**. La plupart ne reviendraient pas en arrière.

---

Convaincu ? Venez essayer la CarCITY dans notre showroom de Boulogne-Billancourt. Nous sommes certains que vous changerez d'avis en quelques minutes de conduite !`,
      imageUrl: '/images/article_quadricycle.jpg',
      category: 'Guide',
      tags: ['idées reçues', 'mythes', 'voiture sans permis', 'vérité'],
      author: 'CARLITE',
      published: true,
      featured: false,
      readTime: 6,
      publishDate: new Date('2026-10-12T00:00:00.000Z'),
    },
    // --- 2 nouveaux articles (voiturettes de golf & espaces verts) ---
    {
      title: 'Voiturettes de golf électriques : confort, silence et personnalisation',
      slug: 'voiturettes-golf-electriques-carlite',
      excerpt: 'Pourquoi la voiturette de golf électrique s\'impose sur les parcours comme dans les domaines privés : silence, autonomie, confort et personnalisation. Découvrez comment la gamme CARLITE répond à ce besoin.',
      content: `La voiturette de golf électrique n\'est plus réservée aux seuls greens. Silencieuse, propre et maniable, elle est devenue un véritable outil de mobilité douce pour les golfs, mais aussi pour les domaines, hôtels et grandes propriétés.

## Le confort avant tout

Une bonne voiturette de golf, c\'est d\'abord une conduite souple et un silence total. Le moteur électrique élimine les vibrations et le bruit d\'un moteur thermique : vous profitez du calme du parcours sans déranger les autres joueurs. Les suspensions et les assises pensées pour de longues heures de jeu font le reste.

## Autonomie et recharge

Les voiturettes CARLITE embarquent des batteries dimensionnées pour tenir plusieurs parcours complets sur une seule charge. La recharge se fait simplement sur une prise 220V standard, du jour au lendemain, sans infrastructure lourde.

## Une personnalisation à votre image

Chez CARLITE, chaque voiturette peut être adaptée à votre usage :
- **Couleurs et habillage** aux teintes de votre club ou de votre établissement
- **Plateaux arrière** pour le transport de matériel, sacs ou équipements d\'entretien
- **Configurations 2, 4 ou 6 places** selon vos besoins
- **Toit, pare-brise et protections** pour rouler par tous les temps

## Au-delà du golf

La même base électrique séduit les **hôtels et resorts**, les **domaines viticoles**, les **campings** et les **grandes propriétés** pour déplacer personnes et matériel sans bruit ni émissions.

## L\'offre CARLITE

Notre utilitaire E-SAM et nos quadricycles se déclinent en versions adaptées à ces usages, disponibles en kit avec montage en option chez nos partenaires. Pour les flottes, nous proposons des remises volume et des contrats d\'entretien.

Contactez nos experts au **06 13 930 930** pour construire la voiturette qui vous ressemble.`,
      imageUrl: '/images/article_voiturette_golf.jpg',
      category: 'Guide',
      tags: ['voiturette de golf', 'golfette', 'personnalisation', 'électrique'],
      author: 'CARLITE',
      published: true,
      featured: false,
      readTime: 5,
      publishDate: new Date('2026-06-15T00:00:00.000Z'),
    },
    {
      title: 'Véhicules électriques pour espaces verts et parcs : la solution CARLITE',
      slug: 'vehicules-electriques-espaces-verts-parcs',
      excerpt: 'Entretien des parcs, jardins publics et espaces verts : découvrez pourquoi le véhicule électrique compact est la réponse idéale, et comment la gamme CARLITE accompagne collectivités et paysagistes.',
      content: `Entretenir un parc, un jardin public ou un grand espace vert impose des contraintes bien particulières : préserver la tranquillité des lieux, respecter l\'environnement et circuler dans des allées étroites. Le véhicule électrique compact coche toutes ces cases.

## Le silence, un atout dans les lieux publics

Dans un parc fréquenté par les promeneurs, le bruit d\'un moteur thermique est vite gênant. Un véhicule électrique CARLITE se déplace en silence : les équipes d\'entretien travaillent sans perturber le calme des lieux, tôt le matin comme en pleine journée.

## Zéro émission au cœur de la nature

Faire circuler des engins thermiques dans un espace vert est un paradoxe. Le 100% électrique supprime les émissions locales et les odeurs de carburant, en cohérence avec la vocation écologique de ces sites et les exigences des Zones à Faibles Émissions.

## Compact, maniable et utilitaire

Les allées de parc sont souvent étroites. Nos véhicules compacts se faufilent partout tout en offrant une vraie capacité de charge :
- **Plateaux arrière et bennes basculantes** pour évacuer déchets verts, terre et outillage
- **Caisses fermées** pour transporter le matériel en toute sécurité
- **Adaptations sur mesure** selon les besoins des équipes

## La gamme CARLITE au service des collectivités et paysagistes

Notre utilitaire **E-SAM**, décliné en versions plateau, benne ou caisse fermée, est particulièrement adapté à l\'entretien des espaces verts. Robuste, économique et simple à recharger sur une prise standard, il réduit fortement les coûts d\'exploitation face à un utilitaire thermique.

Disponibles en kit avec montage en option chez nos partenaires, nos véhicules s\'adaptent aux flottes des communes, des paysagistes et des gestionnaires de sites.

Contactez-nous au **06 13 930 930** pour étudier votre projet et obtenir un devis adapté à vos espaces verts.`,
      imageUrl: '/images/article_espaces_verts.jpg',
      category: 'Mobilité',
      tags: ['espaces verts', 'parcs', 'collectivités', 'E-SAM', 'utilitaire'],
      author: 'CARLITE',
      published: true,
      featured: false,
      readTime: 5,
      publishDate: new Date('2026-06-22T00:00:00.000Z'),
    },
  ];

  for (const article of articles) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: { publishDate: article.publishDate },
      create: article,
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e: any) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
