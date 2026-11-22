import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdminUsers } from './_components/admin-users';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session?.user as any)?.role !== 'admin') redirect('/login');

  let users: any[] = [];
  try {
    users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  } catch {}

  return <AdminUsers users={JSON.parse(JSON.stringify(users ?? []))} currentUserId={(session?.user as any)?.id ?? ''} />;
}
