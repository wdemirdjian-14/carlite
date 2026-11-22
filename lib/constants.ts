export const IMAGES = {
  hero: '/images/carlite_usines.png',
  heroBanner: '/images/hero_banner_new.jpg',
  carcity: '/images/carcity.jpg',
  esam: '/images/esam.jpg',
  esamUtility: '/images/esam_utility.jpg',
  homeCharging: '/images/home_charging.jpg',
  plateauArriere: '/images/plateau_arriere.jpg',
  bacheProtection: '/images/bache_protection.jpg',
  batterieLithium: '/images/batterie_lithium.jpg',
  usedQuad1: '/images/used_quadricycle1.jpg',
  usedQuad2: '/images/used_quadricycle2.jpg',
} as const;

// Navigation principale (ordre = priorité métier)
export const NAV_LINKS = [
  { href: '/accessoires', label: 'Pièces détachées' },
  { href: '/vehicules', label: 'Véhicules neufs' },
  { href: '/occasion', label: 'Occasion' },
  { href: '/configurateur', label: 'Configurateur' },
  { href: '/articles', label: 'Conseils' },
] as const;

export const SECONDARY_LINKS = [
  { href: '/comparateur', label: 'Comparateur' },
  { href: '/recharge', label: 'Recharge' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
] as const;

export const COMPANY_INFO = {
  name: 'SAS CARLITE',
  address: '80 rue Marcel Bontemps, 92100 Boulogne-Billancourt',
  showroom: 'Garage du Centre, 121 bd Victor Hugo, 92100 Boulogne-Billancourt',
  phone: '06 13 930 930',
  phoneHref: 'tel:+33613930930',
  email: 'contact@carlite.fr',
  siren: '788 895 670',
  website: 'www.carlite.fr',
} as const;

// Événements globaux (ouverture du rappel / de la recherche depuis n'importe quel composant)
export const OPEN_CALLBACK_EVENT = 'carlite:open-callback';
export const OPEN_SEARCH_EVENT = 'carlite:open-search';
