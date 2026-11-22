export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generatePresignedUploadUrl, getFileUrl } from '@/lib/s3';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { fileName, contentType } = body ?? {};

    if (!fileName || !contentType) {
      return NextResponse.json({ error: 'fileName et contentType requis' }, { status: 400 });
    }

    // Product images are public
    const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(
      fileName,
      contentType,
      true
    );

    const publicUrl = getFileUrl(cloud_storage_path, true);

    return NextResponse.json({
      uploadUrl,
      cloud_storage_path,
      publicUrl,
    });
  } catch (error: any) {
    console.error('Upload presign error:', error);
    return NextResponse.json({ error: 'Erreur lors de la préparation de l\'upload' }, { status: 500 });
  }
}
