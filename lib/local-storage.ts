// Stockage local des photos uploadées depuis l'admin, utilisé quand aucun bucket S3 n'est configuré.
// Les fichiers sont écrits dans MEDIA_DIR (dossier persistant, hors des versions déployées)
// et servis sous /media/... (par Nginx en production, par la route app/media sinon).
import path from 'path';

export function isS3Configured() {
  return !!(process.env.AWS_BUCKET_NAME && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

export function mediaDir() {
  return path.resolve(process.env.MEDIA_DIR || path.join(process.cwd(), 'media-uploads'));
}

export const MEDIA_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.heic': 'image/heic',
  '.pdf': 'application/pdf',
};

/** Nom de fichier sûr : uniquement [a-z0-9._-], pas de dossier, extension autorisée. */
export function safeMediaName(name: string): string | null {
  const base = path.basename(name || '').replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!base || base.startsWith('.')) return null;
  if (!MEDIA_TYPES[path.extname(base).toLowerCase()]) return null;
  return base;
}
