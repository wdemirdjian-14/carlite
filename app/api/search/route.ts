export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVisibleParts, getVisibleUsedVehicles, getVisibleVehicles } from '@/lib/catalog';
import { normalize, scoreText, tokenize } from '@/lib/search';
import { partCategory, partType } from '@/lib/parts';

// Recherche globale (barre de recherche du site) : insensible aux accents, pondérée par champ.
// Le catalogue est petit (quelques centaines de lignes) : le tri par pertinence se fait en mémoire.
export async function GET(request: Request) {
  const empty = { vehicles: [], accessories: [], usedVehicles: [], articles: [] };
  try {
    const params = new URL(request.url).searchParams;
    const tokens = tokenize(params.get('q') ?? '');
    if (!tokens.length) return NextResponse.json(empty);
    const limit = Math.min(50, Number(params.get('limit')) || 8);

    const [parts, used, vehicles, articles] = await Promise.all([
      getVisibleParts(),
      getVisibleUsedVehicles(),
      getVisibleVehicles(),
      prisma.article.findMany({
        where: { published: true, OR: [{ publishDate: null }, { publishDate: { lte: new Date() } }] },
        select: { id: true, title: true, slug: true, excerpt: true, imageUrl: true, category: true, tags: true },
      }),
    ]);

    const rank = <T,>(rows: T[], fields: (r: T) => { text: string; weight: number }[]) =>
      rows
        .map((r) => ({ r, s: scoreText(tokens, fields(r)) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, limit)
        .map((x) => x.r);

    return NextResponse.json({
      accessories: rank(parts, (p: any) => [
        { text: normalize(p.name), weight: 5 },
        { text: normalize(`${partCategory(p)} ${partType(p)}`), weight: 3 },
        { text: normalize(p.description), weight: 1 },
      ]).map((p: any) => ({ id: p.id, slug: p.slug, name: p.name, imageUrl: p.imageUrl, price: p.price, category: partCategory(p), promo: p.promo })),
      vehicles: rank(vehicles, (v: any) => [
        { text: normalize(v.name), weight: 5 },
        { text: normalize(`${v.category} ${v.permitType} ${v.tagline ?? ''}`), weight: 3 },
        { text: normalize(v.description), weight: 1 },
      ]).map((v: any) => ({ id: v.id, slug: v.slug, name: v.name, imageUrl: v.imageUrl, basePrice: v.basePrice, category: v.category })),
      usedVehicles: rank(used, (v: any) => [
        { text: normalize(v.name), weight: 5 },
        { text: normalize(`${v.year} ${v.color} ${v.condition} ${v.battery}`), weight: 2 },
        { text: normalize(v.description), weight: 1 },
      ]).map((v: any) => ({ id: v.id, slug: v.slug, name: v.name, imageUrl: v.imageUrl, price: v.price, year: v.year, mileage: v.mileage })),
      articles: rank(articles, (a) => [
        { text: normalize(a.title), weight: 5 },
        { text: normalize(`${a.category} ${(a.tags ?? []).join(' ')}`), weight: 3 },
        { text: normalize(a.excerpt), weight: 1 },
      ]),
    });
  } catch {
    return NextResponse.json(empty);
  }
}
