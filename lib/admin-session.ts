import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/** Session admin ou null. Renvoie l'identité utilisée pour signer les notes et le journal. */
export async function getAdmin() {
  const session = await getServerSession(authOptions);
  const u = session?.user as any;
  if (!u || u.role !== 'admin') return null;
  return { id: (u.id as string) ?? null, email: (u.email as string) ?? '', name: (u.name as string) || (u.email as string)?.split('@')[0] || 'Admin' };
}
