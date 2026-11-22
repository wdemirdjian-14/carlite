import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DemandesContent } from './_components/demandes-content';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function DemandesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session?.user as any)?.role !== 'admin') redirect('/login');

  let requests: any[] = [];
  try {
    requests = await prisma.testDriveRequest.findMany({ orderBy: { createdAt: 'desc' } });
  } catch {}

  return <DemandesContent requests={JSON.parse(JSON.stringify(requests ?? []))} />;
}
