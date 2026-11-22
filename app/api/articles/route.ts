import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    const articles = await prisma.article.findMany({
      where: {
        published: true,
        OR: [
          { publishDate: null },
          { publishDate: { lte: now } },
        ],
      },
      orderBy: { publishDate: 'desc' },
    });
    return NextResponse.json(articles ?? []);
  } catch {
    return NextResponse.json([]);
  }
}
