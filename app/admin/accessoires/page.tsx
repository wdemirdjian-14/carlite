import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdminAccessories } from './_components/admin-accessories';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminAccessoiresPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session?.user as any)?.role !== 'admin') redirect('/login');

  let accessories: any[] = [];
  let categories: any[] = [];
  let vehicles: any[] = [];
  let usedVehicles: any[] = [];
  try {
    [accessories, categories, vehicles, usedVehicles] = await Promise.all([
      prisma.accessory.findMany({ orderBy: { category: 'asc' } }),
      prisma.partCategory.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] }),
      prisma.vehicle.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
      prisma.usedVehicle.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    ]);
  } catch {}

  return (
    <AdminAccessories
      accessories={JSON.parse(JSON.stringify(accessories ?? []))}
      categories={JSON.parse(JSON.stringify(categories ?? []))}
      vehicles={JSON.parse(JSON.stringify(vehicles ?? []))}
      usedVehicles={JSON.parse(JSON.stringify(usedVehicles ?? []))}
    />
  );
}
