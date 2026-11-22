export const dynamic = 'force-dynamic';
import { promises as fs } from 'fs';
import path from 'path';
import { mediaDir, safeMediaName, MEDIA_TYPES } from '@/lib/local-storage';

// Sert les photos uploadées localement (en production, Nginx les sert directement : voir deploy/nginx-carlite.conf).
export async function GET(_req: Request, { params }: { params: { path: string[] } }) {
  const name = params.path?.length === 1 ? safeMediaName(params.path[0]) : null;
  if (!name) return new Response('Not found', { status: 404 });
  try {
    const data = await fs.readFile(path.join(mediaDir(), name));
    return new Response(data, {
      headers: {
        'Content-Type': MEDIA_TYPES[path.extname(name).toLowerCase()] ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
