import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminPromotions } from './_components/admin-promotions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Promotions' };

export default async function AdminPromotionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session?.user as any)?.role !== 'admin') redirect('/login');

  let promotions: any[] = [];
  let vehicles: any[] = [];
  let accessories: any[] = [];
  let usedVehicles: any[] = [];
  try {
    [promotions, vehicles, accessories, usedVehicles] = await Promise.all([
      prisma.promotion.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.vehicle.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, basePrice: true } }),
      prisma.accessory.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, price: true } }),
      prisma.usedVehicle.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, price: true } }),
    ]);
  } catch {}

  return (
    <AdminPromotions
      promotions={JSON.parse(JSON.stringify(promotions ?? []))}
      vehicles={JSON.parse(JSON.stringify(vehicles ?? []))}
      accessories={JSON.parse(JSON.stringify(accessories ?? []))}
      usedVehicles={JSON.parse(JSON.stringify(usedVehicles ?? []))}
    />
  );
}
