export const IMAGES = {
  hero: '/images/carlite_usines.png',
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

export const NAV_LINKS = [
  { href: '/vehicules', label: 'Véhicules' },
  { href: '/configurateur', label: 'Configurateur' },
  { href: '/accessoires', label: 'Pièces détachées' },
  { href: '/occasion', label: 'Occasion' },
  { href: '/articles', label: 'Articles' },
  { href: '/comparateur', label: 'Comparateur' },
] as const;

export const COMPANY_INFO = {
  name: 'SAS CARLITE',
  address: '80 rue Marcel Bontemps, 92100 Boulogne-Billancourt',
  showroom: 'Garage du Centre, 121 bd Victor Hugo, 92100 Boulogne-Billancourt',
  phone: '06 13 930 930',
  email: 'contact@carlite.fr',
  siren: '788 895 670',
  website: 'www.carlite.fr',
} as const;