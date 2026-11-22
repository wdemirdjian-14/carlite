export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request?.url ?? '');
    const q = searchParams?.get?.('q')?.trim?.() ?? '';
    if (!q) return NextResponse.json({ vehicles: [], accessories: [], usedVehicles: [], articles: [] });

    const [vehicles, accessories, usedVehicles, articles] = await Promise.all([
      prisma.vehicle.findMany({
        where: {
          available: true,
          published: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { category: { contains: q, mode: 'insensitive' } },
          ],
        },
      }),
      prisma.accessory.findMany({
        where: {
          inStock: true,
          published: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { category: { contains: q, mode: 'insensitive' } },
          ],
        },
      }),
      prisma.usedVehicle.findMany({
        where: {
          available: true,
          published: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
      }),
      prisma.article.findMany({
        where: {
          published: true,
          AND: [
            { OR: [{ publishDate: null }, { publishDate: { lte: new Date() } }] },
            { OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { excerpt: { contains: q, mode: 'insensitive' } },
              { content: { contains: q, mode: 'insensitive' } },
              { category: { contains: q, mode: 'insensitive' } },
            ] },
          ],
        },
        take: 10,
      }),
    ]);

    return NextResponse.json({ vehicles: vehicles ?? [], accessories: accessories ?? [], usedVehicles: usedVehicles ?? [], articles: articles ?? [] });
  } catch (error: any) {
    return NextResponse.json({ vehicles: [], accessories: [], usedVehicles: [], articles: [] });
  }
}
