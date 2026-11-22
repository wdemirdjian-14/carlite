'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Camera,
  ImagePlus,
  Loader2,
  Scissors,
  Sparkles,
  RotateCcw,
  Check,
  ArrowLeft,
  PackagePlus,
  Trash2,
  Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { optimizeImage, removeImageBackground } from '@/lib/image-tools';
import { STOCK_OPTIONS } from '@/components/stock-badge';
import { formatEuro, htToTtc } from '@/lib/pricing';

type Cat = { id: string; name: string };

const EMPTY_FORM = {
  name: '',
  description: '',
  quantity: '1',
  price: '',
  category: '',
  stockStatus: 'available',
};

export function QuickStock({ categories }: { categories: Cat[] }) {
  const [origBlob, setOrigBlob] = useState<Blob | null>(null);
  const [origUrl, setOrigUrl] = useState<string>('');
  const [finalBlob, setFinalBlob] = useState<Blob | null>(null);
  const [finalUrl, setFinalUrl] = useState<string>('');
  const [transparent, setTransparent] = useState(false);

  const [detourage, setDetourage] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<string>('');

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (origUrl) URL.revokeObjectURL(origUrl);
      if (finalUrl) URL.revokeObjectURL(finalUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (k: keyof typeof form, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (k === 'name' && v.trim()) setNameError(false);
  };

  const process = useCallback(
    async (source: Blob, withDetourage: boolean) => {
      setProcessing(true);
      setProgress(0);
      try {
        let result: Blob;
        if (withDetourage) {
          setStage('Détourage en cours…');
          const cut = await removeImageBackground(source, (r) => setProgress(r));
          setStage('Optimisation…');
          result = await optimizeImage(cut, { format: 'image/png', maxSize: 1400 });
          setTransparent(true);
        } else {
          setStage('Optimisation…');
          result = await optimizeImage(source, { format: 'image/jpeg', maxSize: 1600, quality: 0.85 });
          setTransparent(false);
        }
        setFinalBlob(result);
        setFinalUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(result);
        });
      } catch (e) {
        console.error('Traitement image échoué:', e);
        toast.error("Le détourage a échoué. L'image originale optimisée sera utilisée.");
        try {
          const fallback = await optimizeImage(source, { format: 'image/jpeg', maxSize: 1600, quality: 0.85 });
          setTransparent(false);
          setFinalBlob(fallback);
          setFinalUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(fallback);
          });
        } catch {}
      } finally {
        setProcessing(false);
        setStage('');
        setProgress(0);
      }
    },
    []
  );

  const onPick = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image.');
      return;
    }
    setOrigBlob(file);
    setOrigUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    // reset previous result
    setFinalBlob(null);
    setFinalUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    // auto-process
    process(file, detourage);
  };

  const toggleDetourage = () => {
    const next = !detourage;
    setDetourage(next);
    if (origBlob) process(origBlob, next);
  };

  const clearPhoto = () => {
    setOrigBlob(null);
    setFinalBlob(null);
    setOrigUrl((p) => {
      if (p) URL.revokeObjectURL(p);
      return '';
    });
    setFinalUrl((p) => {
      if (p) URL.revokeObjectURL(p);
      return '';
    });
  };

  const uploadBlob = async (blob: Blob): Promise<string> => {
    const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
    const base = (form.name.trim() || 'produit')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const fileName = `${base || 'produit'}-${Date.now()}.${ext}`;
    const presignRes = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, contentType: blob.type }),
    });
    if (!presignRes.ok) throw new Error('presign');
    const { uploadUrl, publicUrl } = await presignRes.json();
    const headers: Record<string, string> = { 'Content-Type': blob.type };
    const u = new URL(uploadUrl);
    if ((u.searchParams.get('X-Amz-SignedHeaders') ?? '').includes('content-disposition')) {
      headers['Content-Disposition'] = 'attachment';
    }
    const put = await fetch(uploadUrl, { method: 'PUT', headers, body: blob });
    if (!put.ok) throw new Error('upload');
    return publicUrl;
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setNameError(true);
      toast.error('Le nom du produit est obligatoire.');
      return;
    }
    setSaving(true);
    try {
      let imageUrl: string | undefined;
      const blob = finalBlob ?? origBlob;
      if (blob) {
        setStage("Envoi de l'image…");
        imageUrl = await uploadBlob(blob);
      }
      const qty = Math.max(0, parseInt(form.quantity) || 0);
      const res = await fetch('/api/admin/accessories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || form.name.trim(),
          price: parseFloat(form.price) || 0,
          category: form.category || 'Général',
          quantity: qty,
          stockStatus: form.stockStatus,
          imageUrl,
          published: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Erreur');
      }
      toast.success(`« ${form.name.trim()} » ajouté au stock ✅`);
      setAddedCount((c) => c + 1);
      // reset for next product
      setForm({ ...EMPTY_FORM });
      setNameError(false);
      clearPhoto();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      console.error('Save error:', e);
      toast.error(e?.message || "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
      setStage('');
    }
  };

  const displayUrl = finalUrl || origUrl;
  const ttc = htToTtc(parseFloat(form.price) || 0);

  return (
    <div className="mx-auto w-full max-w-md px-4 py-5 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/admin"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/70"
          aria-label="Retour"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold leading-tight flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-green-600" /> Stock rapide
          </h1>
          <p className="text-xs text-muted-foreground">
            Ajoutez un produit en quelques secondes depuis votre mobile.
          </p>
        </div>
      </div>

      {addedCount > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-2 text-sm text-green-700 dark:text-green-300">
          <Check className="h-4 w-4" />
          {addedCount} produit(s) ajouté(s) durant cette session.
        </div>
      )}

      {/* Photo zone */}
      <div className="rounded-2xl bg-card shadow-[var(--shadow-md)] p-4 mb-4">
        <div
          className="relative w-full aspect-square rounded-xl overflow-hidden mb-3 flex items-center justify-center"
          style={{
            backgroundColor: '#f4f4f5',
            backgroundImage: transparent && finalUrl
              ? 'linear-gradient(45deg,#e4e4e7 25%,transparent 25%),linear-gradient(-45deg,#e4e4e7 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e4e4e7 75%),linear-gradient(-45deg,transparent 75%,#e4e4e7 75%)'
              : undefined,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0,0 10px,10px -10px,-10px 0px',
          }}
        >
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayUrl} alt="Aperçu du produit" className="h-full w-full object-contain" />
          ) : (
            <div className="text-center text-muted-foreground px-6">
              <Camera className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Prenez ou choisissez une photo du produit</p>
            </div>
          )}

          {processing && (
            <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center text-white gap-2">
              <Loader2 className="h-7 w-7 animate-spin" />
              <p className="text-sm font-medium">{stage || 'Traitement…'}</p>
              {progress > 0 && (
                <div className="w-40 h-1.5 rounded-full bg-white/30 overflow-hidden">
                  <div className="h-full bg-white transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
                </div>
              )}
            </div>
          )}

          {displayUrl && !processing && (
            <button
              onClick={clearPhoto}
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
              aria-label="Supprimer la photo"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Capture buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => cameraRef.current?.click()}
            disabled={processing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-3 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Camera className="h-4 w-4" /> Appareil photo
          </button>
          <button
            onClick={() => galleryRef.current?.click()}
            disabled={processing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-600 px-3 py-3 text-sm font-medium text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50"
          >
            <ImagePlus className="h-4 w-4" /> Galerie
          </button>
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            onPick(e.target.files?.[0]);
            if (e.target) e.target.value = '';
          }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            onPick(e.target.files?.[0]);
            if (e.target) e.target.value = '';
          }}
        />

        {/* Détourage toggle + actions */}
        <div className="mt-3 space-y-2">
          <label className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5 cursor-pointer">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Scissors className="h-4 w-4 text-green-600" /> Détourage automatique
            </span>
            <span
              onClick={(e) => {
                e.preventDefault();
                toggleDetourage();
              }}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                detourage ? 'bg-green-600' : 'bg-muted-foreground/30'
              )}
            >
              <span
                className={cn(
                  'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                  detourage ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </span>
          </label>
          {origBlob && !processing && (
            <button
              onClick={() => process(origBlob, detourage)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-muted px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/70"
            >
              <RotateCcw className="h-4 w-4" /> Relancer le traitement
            </button>
          )}
          <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <Wand2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Le fond est retiré et la photo est optimisée automatiquement. Le premier détourage peut prendre quelques secondes (chargement du modèle).
          </p>
        </div>
      </div>

      {/* Product fields */}
      <div className="rounded-2xl bg-card shadow-[var(--shadow-md)] p-4 space-y-4">
        <div>
          <label className={cn('block text-sm font-medium mb-1', nameError ? 'text-red-600' : 'text-muted-foreground')}>
            Nom du produit <span className="text-red-500">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Ex. Batterie lithium 72V 40Ah"
            className={cn(
              'w-full rounded-xl border bg-background px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-green-600',
              nameError ? 'border-red-500 ring-1 ring-red-500' : 'border-border'
            )}
          />
          {nameError && <p className="mt-1 text-xs text-red-600">Ce champ est obligatoire</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-muted-foreground">Description rapide</label>
          <textarea
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            rows={2}
            placeholder="Quelques mots sur le produit…"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-green-600 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">Quantité</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={form.quantity}
              onChange={(e) => setField('quantity', e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">Prix HT (€)</label>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={form.price}
              onChange={(e) => setField('price', e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-green-600"
            />
            {parseFloat(form.price) > 0 && (
              <p className="mt-1 text-[11px] text-muted-foreground">soit {formatEuro(ttc)} € TTC</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">Catégorie</label>
            <select
              value={form.category}
              onChange={(e) => setField('category', e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="">Général</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">État du stock</label>
            <select
              value={form.stockStatus}
              onChange={(e) => setField('stockStatus', e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-green-600"
            >
              {STOCK_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 backdrop-blur px-4 py-3">
        <div className="mx-auto max-w-md">
          <button
            onClick={handleSave}
            disabled={saving || processing}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3.5 text-base font-semibold text-white hover:bg-green-700 disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Enregistrement…
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" /> Ajouter au stock
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
