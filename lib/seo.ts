// Référencement : URL absolues et données structurées schema.org (JSON-LD) lues par Google.
import { COMPANY_INFO } from '@/lib/constants';
import { htToTtc } from '@/lib/pricing';
import { partBrand, partCategory, partType, OTHER_CATEGORY } from '@/lib/parts';

export function siteUrl(path = '') {
  const base = (process.env.NEXTAUTH_URL || 'https://carlite.fr').replace(/\/$/, '');
  return `${base}${path}`;
}

/** URL absolue d'une fiche, segment encodé (les slugs peuvent contenir des accents). */
export function pageUrl(prefix: string, slug: string) {
  return siteUrl(`${prefix}/${encodeURIComponent(slug)}`);
}

export function absUrl(u?: string | null) {
  if (!u) return undefined;
  return /^https?:\/\//.test(u) ? u : siteUrl(u.startsWith('/') ? u : `/${u}`);
}

const AVAILABILITY: Record<string, string> = {
  available: 'https://schema.org/InStock',
  restocking: 'https://schema.org/BackOrder',
  out_of_stock: 'https://schema.org/OutOfStock',
};

/** Les prix sont saisis HT ; Google exige le prix TTC payé par un particulier. */
export function priceTtc(ht: number) {
  return htToTtc(ht).toFixed(2);
}

const SELLER = { '@type': 'Organization', name: 'CARLITE', url: 'https://carlite.fr' };

export function partJsonLd(part: any, price: number) {
  const brand = partBrand(part) ?? 'CARLITE';
  const cat = partCategory(part);
  const data: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: part.name,
    description: (part.description || part.name).slice(0, 5000),
    image: [part.imageUrl, ...(part.gallery ?? [])].filter(Boolean).map(absUrl),
    sku: part.id,
    brand: { '@type': 'Brand', name: brand },
    category: cat !== OTHER_CATEGORY ? cat : partType(part),
    url: pageUrl('/accessoires', part.slug),
  };
  if (price > 0) {
    data.offers = {
      '@type': 'Offer',
      url: pageUrl('/accessoires', part.slug),
      priceCurrency: 'EUR',
      price: priceTtc(price),
      itemCondition: 'https://schema.org/NewCondition',
      availability: AVAILABILITY[part.stockStatus ?? 'available'] ?? AVAILABILITY.available,
      seller: SELLER,
      ...(part.promo?.endDate ? { priceValidUntil: new Date(part.promo.endDate).toISOString().slice(0, 10) } : {}),
    };
  }
  return data;
}

export function usedVehicleJsonLd(v: any, price: number) {
  return {
    '@context': 'https://schema.org',
    '@type': ['Product', 'Car'],
    name: v.name,
    description: (v.description || v.name).slice(0, 5000),
    image: [v.imageUrl, ...(v.gallery ?? [])].filter(Boolean).map(absUrl),
    url: pageUrl('/occasion', v.slug),
    vehicleModelDate: String(v.year),
    mileageFromOdometer: { '@type': 'QuantitativeValue', value: v.mileage, unitCode: 'KMT' },
    color: v.color || undefined,
    seatingCapacity: v.seats,
    fuelType: 'Électrique',
    itemCondition: 'https://schema.org/UsedCondition',
    offers:
      price > 0
        ? {
            '@type': 'Offer',
            priceCurrency: 'EUR',
            price: priceTtc(price),
            itemCondition: 'https://schema.org/UsedCondition',
            availability: v.stockStatus === 'out_of_stock' || !v.available ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
            seller: SELLER,
          }
        : undefined,
  };
}

export function vehicleJsonLd(v: any, price: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: v.name,
    description: (v.tagline ? `${v.tagline}. ` : '') + 'Véhicule électrique vendu en kit, non monté.',
    image: [v.imageUrl, ...(v.gallery ?? [])].filter(Boolean).map(absUrl),
    url: pageUrl('/vehicules', v.slug),
    brand: { '@type': 'Brand', name: 'CARLITE' },
    category: v.category,
    offers:
      price > 0
        ? {
            '@type': 'Offer',
            priceCurrency: 'EUR',
            price: priceTtc(price),
            itemCondition: 'https://schema.org/NewCondition',
            availability: AVAILABILITY[v.stockStatus ?? 'available'] ?? AVAILABILITY.available,
            seller: SELLER,
          }
        : undefined,
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: siteUrl(it.path.split('/').map((seg) => (seg ? encodeURIComponent(decodeURIComponent(seg)) : seg)).join('/')) })),
  };
}

export function organizationJsonLd() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'AutoPartsStore',
      name: 'CARLITE',
      legalName: COMPANY_INFO.name,
      url: siteUrl(),
      logo: siteUrl('/logo-light.png'),
      image: siteUrl('/og-image.png'),
      telephone: '+33613930930',
      email: COMPANY_INFO.email,
      address: { '@type': 'PostalAddress', streetAddress: '80 rue Marcel Bontemps', postalCode: '92100', addressLocality: 'Boulogne-Billancourt', addressCountry: 'FR' },
      areaServed: 'FR',
      description: 'Pièces détachées, quadricycles, golfettes et utilitaires électriques. Vente, occasions révisées et conseil technique.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'CARLITE',
      url: siteUrl(),
      inLanguage: 'fr-FR',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: siteUrl('/accessoires?q={search_term_string}') },
        'query-input': 'required name=search_term_string',
      },
    },
  ];
}
