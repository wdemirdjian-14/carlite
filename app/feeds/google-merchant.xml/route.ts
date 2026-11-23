export const dynamic = 'force-dynamic';
import { getVisibleParts } from '@/lib/catalog';
import { absUrl, pageUrl, priceTtc, siteUrl } from '@/lib/seo';
import { partBrand, partCategory, partType, OTHER_CATEGORY } from '@/lib/parts';

/**
 * Flux produits Google Merchant Center (format RSS 2.0 + espace de noms g:).
 * URL à déclarer dans Merchant Center : https://carlite.fr/feeds/google-merchant.xml
 *
 * Contient les pièces détachées et accessoires publiés, visibles et AVEC un prix
 * (Google refuse les produits « sur devis »). Les véhicules sont exclus : Google Shopping
 * n'accepte pas les véhicules à moteur dans les fiches produits standard.
 * Prix envoyés TTC (obligatoire pour la France), le prix promo en sale_price.
 */
const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const AVAIL: Record<string, string> = { available: 'in_stock', restocking: 'backorder', out_of_stock: 'out_of_stock' };
const day = (d: string | Date) => new Date(d).toISOString().slice(0, 19) + 'Z';

export async function GET() {
  const parts = (await getVisibleParts()).filter((p: any) => p.price > 0);

  const items = parts
    .map((p: any) => {
      const cat = partCategory(p);
      const type = partType(p);
      const brand = partBrand(p) ?? 'CARLITE';
      const images = [p.imageUrl, ...(p.gallery ?? [])].filter(Boolean).map((u: string) => absUrl(u)!);
      const promo = p.promo?.discountedPrice > 0 && p.promo.discountedPrice < p.price ? p.promo : null;
      const desc = p.description && p.description !== p.name ? p.description : `${p.name} – ${type}. Pièce détachée pour véhicule électrique (quadricycle, golfette, utilitaire), conseil technique CARLITE.`;
      return `    <item>
      <g:id>${esc(p.id)}</g:id>
      <g:title>${esc(p.name.slice(0, 150))}</g:title>
      <g:description>${esc(desc.slice(0, 5000))}</g:description>
      <g:link>${esc(pageUrl('/accessoires', p.slug))}</g:link>
      <g:image_link>${esc(images[0] ?? '')}</g:image_link>
${images.slice(1, 10).map((u: string) => `      <g:additional_image_link>${esc(u)}</g:additional_image_link>`).join('\n')}
      <g:availability>${AVAIL[p.stockStatus ?? 'available'] ?? 'in_stock'}</g:availability>
      <g:price>${priceTtc(p.price)} EUR</g:price>
${promo ? `      <g:sale_price>${priceTtc(promo.discountedPrice)} EUR</g:sale_price>\n` : ''}${promo && promo.startDate && promo.endDate ? `      <g:sale_price_effective_date>${day(promo.startDate)}/${day(promo.endDate)}</g:sale_price_effective_date>\n` : ''}      <g:condition>new</g:condition>
      <g:brand>${esc(brand)}</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>Vehicles &amp; Parts &gt; Vehicle Parts &amp; Accessories</g:google_product_category>
      <g:product_type>${esc(['Pièces détachées', cat !== OTHER_CATEGORY ? cat : null, type].filter(Boolean).join(' > '))}</g:product_type>
    </item>`.replace(/\n\n/g, '\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>CARLITE – Pièces détachées pour véhicules électriques</title>
    <link>${esc(siteUrl())}</link>
    <description>Catalogue des pièces détachées et accessoires CARLITE</description>
${items}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
