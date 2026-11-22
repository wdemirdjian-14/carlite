export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { promises as fs } from 'fs';
import path from 'path';
import { authOptions } from '@/lib/auth';
import { mediaDir, safeMediaName } from '@/lib/local-storage';

const MAX_BYTES = 15 * 1024 * 1024;

// Réception d'une photo (PUT, corps = fichier brut) quand aucun bucket S3 n'est configuré.
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }
  const name = safeMediaName(new URL(request.url).searchParams.get('name') ?? '');
  if (!name) return NextResponse.json({ error: 'Nom de fichier invalide' }, { status: 400 });
  const buf = Buffer.from(await request.arrayBuffer());
  if (!buf.length || buf.length > MAX_BYTES) return NextResponse.json({ error: 'Fichier vide ou trop lourd (15 Mo max)' }, { status: 413 });
  const dir = mediaDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buf, { flag: 'wx' }).catch(async (e) => {
    if (e?.code !== 'EEXIST') throw e;
  });
  return new NextResponse(null, { status: 200 });
}
