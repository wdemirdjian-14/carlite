export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { published: true },
      include: { colors: true, wheels: true, options: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(vehicles ?? []);
  } catch {
    return NextResponse.json([]);
  }
}
