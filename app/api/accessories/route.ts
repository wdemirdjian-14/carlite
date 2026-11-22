export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const accessories = await prisma.accessory.findMany({ where: { published: true }, orderBy: { category: 'asc' } });
    return NextResponse.json(accessories ?? []);
  } catch {
    return NextResponse.json([]);
  }
}
