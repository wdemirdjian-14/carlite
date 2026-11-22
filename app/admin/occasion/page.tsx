import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdminUsedVehicles } from './_components/admin-used-vehicles';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminOccasionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session?.user as any)?.role !== 'admin') redirect('/login');

  let usedVehicles: any[] = [];
  try {
    usedVehicles = await prisma.usedVehicle.findMany({ orderBy: { createdAt: 'desc' } });
  } catch {}

  return <AdminUsedVehicles vehicles={JSON.parse(JSON.stringify(usedVehicles ?? []))} />;
}
