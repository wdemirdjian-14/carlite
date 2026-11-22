import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ConfigManager } from './_components/config-manager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Configurateur – Admin' };

export default async function AdminConfiguratorPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session?.user as any)?.role !== 'admin') redirect('/login');

  let vehicle: any = null;
  try {
    vehicle = await prisma.vehicle.findUnique({
      where: { id: params?.id },
      include: {
        configCategories: {
          orderBy: { order: 'asc' },
          include: { options: { orderBy: { order: 'asc' } } },
        },
        configRules: { orderBy: { order: 'asc' } },
      },
    });
  } catch {}

  if (!vehicle) redirect('/admin/vehicules');

  return <ConfigManager vehicle={JSON.parse(JSON.stringify(vehicle))} />;
}
