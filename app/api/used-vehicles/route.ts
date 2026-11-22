export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const usedVehicles = await prisma.usedVehicle.findMany({ where: { published: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(usedVehicles ?? []);
  } catch {
    return NextResponse.json([]);
  }
}
