import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdminDashboard } from './_components/admin-dashboard';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session?.user as any)?.role !== 'admin') redirect('/login');

  let stats: any = {};
  try {
    const [vehicleCount, accessoryCount, usedCount, requestCount, pendingCount, articleCount, userCount, partCategoryCount, promotionCount] = await Promise.all([
      prisma.vehicle.count(),
      prisma.accessory.count(),
      prisma.usedVehicle.count(),
      prisma.testDriveRequest.count(),
      prisma.testDriveRequest.count({ where: { status: 'pending' } }),
      prisma.article.count(),
      prisma.user.count(),
      prisma.partCategory.count(),
      prisma.promotion.count({ where: { active: true } }),
    ]);
    stats = { vehicleCount, accessoryCount, usedCount, requestCount, pendingCount, articleCount, userCount, partCategoryCount, promotionCount };
  } catch {}

  return <AdminDashboard stats={stats ?? {}} />;
}
