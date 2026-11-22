// Client-side image utilities: optimisation (resize/compress) + détourage automatique.
// All functions run only in the browser.

export type OptimizeOptions = {
  maxSize?: number; // max width/height in px
  quality?: number; // 0..1 (jpeg/webp only)
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  background?: string; // fill colour when flattening to jpeg
};

async function loadBitmap(source: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(source);
    } catch {
      /* fall through to HTMLImageElement */
    }
  }
  return await new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(source);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/** Resize + re-encode an image entirely in the browser. Returns a new Blob. */
export async function optimizeImage(source: Blob, opts: OptimizeOptions = {}): Promise<Blob> {
  const { maxSize = 1600, quality = 0.85, format = 'image/jpeg', background = '#ffffff' } = opts;
  const bitmap = await loadBitmap(source);
  const srcW = (bitmap as any).width as number;
  const srcH = (bitmap as any).height as number;
  const scale = Math.min(1, maxSize / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas non supporté');

  if (format === 'image/jpeg') {
    // JPEG has no alpha channel -> flatten onto a solid background
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(bitmap as any, 0, 0, w, h);
  if ((bitmap as any).close) (bitmap as any).close();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), format, format === 'image/png' ? undefined : quality)
  );
  if (!blob) throw new Error("Échec de l'encodage de l'image");
  return blob;
}

// Loaded from a CDN at runtime so the heavy onnxruntime-web/wasm deps are never
// bundled by the build. Cached after the first load.
const IMGLY_CDN: string = 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm';
let _imglyPromise: Promise<any> | null = null;

async function loadImgly(): Promise<any> {
  if (!_imglyPromise) {
    // webpackIgnore keeps this dynamic import out of the webpack module graph.
    _imglyPromise = import(/* webpackIgnore: true */ IMGLY_CDN);
  }
  return _imglyPromise;
}

/** Automatic background removal (détourage). Returns a transparent PNG Blob. */
export async function removeImageBackground(
  source: Blob,
  onProgress?: (ratio: number) => void
): Promise<Blob> {
  const mod = await loadImgly();
  const removeBackground = (mod as any).removeBackground ?? (mod as any).default;
  const result: Blob = await removeBackground(source, {
    output: { format: 'image/png', quality: 0.9 },
    progress: (_key: string, current: number, total: number) => {
      if (onProgress && total > 0) onProgress(Math.min(1, current / total));
    },
  });
  return result;
}

export function blobToObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
