// Données dérivées des pièces détachées, utilisées par le moteur de recherche multicritère.
import { normalize } from '@/lib/search';

export const OTHER_CATEGORY = 'Autres pièces';

export function partCategory(p: { category?: string | null }): string {
  const c = (p?.category ?? '').trim();
  return c && c !== 'Général' ? c : OTHER_CATEGORY;
}

/** Tensions électriques citées dans le nom ou la description (« 48 V », « 36/48V », « 12 V / 230 V »…). */
export function partVoltages(p: { name?: string; description?: string }): number[] {
  const text = `${p?.name ?? ''} ${p?.description ?? ''}`;
  const out = new Set<number>();
  // « 36/48V » : chaque valeur avant le V
  for (const m of text.matchAll(/((?:\d{1,3}\s*\/\s*)+\d{1,3})\s?V(?![a-zA-Z])/g)) {
    m[1].split('/').forEach((v) => out.add(parseInt(v, 10)));
  }
  for (const m of text.matchAll(/(\d{1,3})(?:[.,]\d)?\s?V(?![a-zA-Z])/g)) out.add(parseInt(m[1], 10));
  // Plages « 41–57 V » : on garde les bornes
  return [...out].filter((v) => [6, 12, 24, 36, 48, 60, 72, 80, 96].includes(v)).sort((a, b) => a - b);
}

/** Type de pièce déduit du nom : complète les catégories saisies dans l'admin. */
const PART_TYPES: { label: string; re: RegExp }[] = [
  { label: 'Chargeurs', re: /chargeur|mainteneur/ },
  { label: 'Recharge & câbles', re: /wallbox|borne|cable|prise (de )?recharge|type ?[12]\b/ },
  { label: 'Convertisseurs', re: /convertisseur|onduleur|dc ?\/ ?dc|dcdc/ },
  { label: 'Éclairage', re: /\bled\b|phare|rampe|projecteur|feu|voyant|eclairage/ },
  { label: 'Affichage & commandes', re: /ecran|afficheur|affichage|terminal|tableau de bord|compteur|pedale|cle\b|commodo|interrupteur/ },
  { label: 'Électronique de puissance', re: /controleur|variateur|contacteur|resistance|relais|fusible|connecteur|faisceau|coupe-batterie|egaliseur|power manager|dissipateur|can-?bus/ },
  { label: 'Batteries', re: /\bbatterie|lithium|\bah\b|\d+\s?ah\b/ },
  { label: 'Carrosserie & confort', re: /siege|housse|tapis|bache|coffre|retroviseur|jante|plateau|benne|pare|porte|vitre/ },
];

export function partType(p: { name?: string }): string {
  const n = normalize(p?.name);
  for (const t of PART_TYPES) if (t.re.test(n)) return t.label;
  return 'Divers';
}

/** Marques reconnues dans le nom (liste d'aide à la recherche, complétée par les marques trouvées). */
const KNOWN_BRANDS = [
  'Curtis', 'IES', 'Techni-Power', 'U-Ride', 'COBO', 'Topcon', 'Hella', 'Albright', 'Dunlop', 'PBM',
  'Flash Battery', 'MTM Power', 'LVYUAN', 'RS PRO', 'JIAYUAN', 'Eagle', 'CARLITE', 'Trojan', 'Bosch', 'Sevcon',
];

export function partBrand(p: { name?: string }): string | null {
  const n = normalize(p?.name);
  for (const b of KNOWN_BRANDS) {
    const nb = normalize(b);
    if (new RegExp(`(^|[^a-z0-9])${nb.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}([^a-z0-9]|$)`).test(n)) return b;
  }
  return null;
}

export function isPriceOnRequest(price: number | null | undefined) {
  return !price || price <= 0;
}

export function effectivePrice(p: { price?: number; promo?: { discountedPrice?: number } | null }): number {
  return p?.promo?.discountedPrice && p.promo.discountedPrice > 0 ? p.promo.discountedPrice : p?.price ?? 0;
}
