import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdminVehicles } from './_components/admin-vehicles';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminVehiculesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session?.user as any)?.role !== 'admin') redirect('/login');

  let vehicles: any[] = [];
  try {
    vehicles = await prisma.vehicle.findMany({
      include: { colors: true, wheels: true, options: true },
      orderBy: { createdAt: 'desc' },
    });
  } catch {}

  return <AdminVehicles vehicles={JSON.parse(JSON.stringify(vehicles ?? []))} />;
}
