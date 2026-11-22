export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generatePresignedUploadUrl, getFileUrl } from '@/lib/s3';
import { isS3Configured, safeMediaName } from '@/lib/local-storage';

// Prépare l'envoi d'une photo depuis l'admin :
//  - bucket S3 configuré -> URL présignée (envoi direct navigateur -> bucket)
//  - sinon -> envoi sur le serveur lui-même (/api/admin/upload/local), fichier servi sous /media/
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    const { fileName, contentType } = (await request.json()) ?? {};
    if (!fileName || !contentType) {
      return NextResponse.json({ error: 'fileName et contentType requis' }, { status: 400 });
    }

    if (!isS3Configured()) {
      const safe = safeMediaName(`${Date.now()}-${fileName}`);
      if (!safe) return NextResponse.json({ error: 'Type de fichier non autorisé' }, { status: 400 });
      return NextResponse.json({
        uploadUrl: `/api/admin/upload/local?name=${encodeURIComponent(safe)}`,
        cloud_storage_path: `media/${safe}`,
        publicUrl: `/media/${safe}`,
      });
    }

    const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(fileName, contentType, true);
    return NextResponse.json({ uploadUrl, cloud_storage_path, publicUrl: getFileUrl(cloud_storage_path, true) });
  } catch (error: any) {
    console.error('Upload presign error:', error);
    return NextResponse.json({ error: "Erreur lors de la préparation de l'upload" }, { status: 500 });
  }
}
