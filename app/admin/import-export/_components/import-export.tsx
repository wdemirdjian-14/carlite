'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Download, Upload, FileSpreadsheet, FileText, Loader2, CheckCircle2, AlertTriangle, XCircle, Undo2, History, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Values = { quantity: number; purchasePrice: number | null; price: number; stockStatus: string };
type Change = { id: string; name: string; line: number; before: Values; after: Values; fields: (keyof Values)[] };
type Issue = { line: number; id?: string; name?: string; message: string };
type Result = { mode: 'preview' | 'apply'; fileName: string; changes: Change[]; errors: Issue[]; warnings: Issue[]; unchanged: number; read: number; importId?: string };

const FIELD_LABEL: Record<keyof Values, string> = { quantity: 'Quantité', purchasePrice: 'Prix d’achat HT', price: 'Prix de vente HT', stockStatus: 'Statut' };
const STATUS: Record<string, string> = { available: 'Disponible', restocking: 'Réappro.', out_of_stock: 'Rupture' };
const show = (k: keyof Values, v: any) => {
  if (k === 'stockStatus') return STATUS[v] ?? v;
  if (k === 'quantity') return String(v);
  if (v == null) return '—';
  if (k === 'price' && v === 0) return 'Sur devis';
  return `${Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
};
const fmtDate = (d: string) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function ImportExport({ initialImports, stats }: { initialImports: any[]; stats: { total: number; withPurchase: number; onRequest: number } }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<'preview' | 'apply' | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [imports, setImports] = useState<any[]>(initialImports);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const send = async (f: File, mode: 'preview' | 'apply') => {
    setBusy(mode);
    try {
      const fd = new FormData();
      fd.append('file', f);
      fd.append('mode', mode);
      const res = await fetch('/api/admin/products/import', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Import impossible');
      setResult(data);
      if (mode === 'apply') {
        toast.success(`${data.changes.length} produit(s) mis à jour`);
        const h = await fetch('/api/admin/products/import').then((r) => r.json());
        if (Array.isArray(h)) setImports(h);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Erreur');
      if (mode === 'preview') setResult(null);
    }
    setBusy(null);
  };

  const pick = (f?: File | null) => {
    if (!f) return;
    if (!/\.(xlsx|csv)$/i.test(f.name)) {
      toast.error('Choisissez le fichier .xlsx ou .csv exporté depuis le site.');
      return;
    }
    setFile(f);
    setResult(null);
    send(f, 'preview');
  };

  const undo = async (id: string) => {
    if (!confirm('Annuler cet import ? Les produits reprennent leurs valeurs d’avant (sauf ceux modifiés depuis).')) return;
    const res = await fetch(`/api/admin/products/imports/${id}/undo`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) return toast.error(data?.error || 'Erreur');
    toast.success(`${data.restored} produit(s) restauré(s)${data.skipped.length ? ` · ${data.skipped.length} laissé(s) tel(s) quel(s)` : ''}`);
    if (data.skipped.length) alert(`Non restaurés :\n- ${data.skipped.join('\n- ')}`);
    const h = await fetch('/api/admin/products/import').then((r) => r.json());
    if (Array.isArray(h)) setImports(h);
  };

  const applied = result?.mode === 'apply';

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6 sm:py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="p-2 rounded-full hover:bg-muted" aria-label="Retour"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">Import / export produits</h1>
          <p className="text-sm text-muted-foreground">Mettez à jour quantités, prix d’achat et prix de vente depuis Excel.</p>
        </div>
      </div>

      {/* 1. Export */}
      <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-strong">Étape 1</p>
        <h2 className="font-display text-xl font-extrabold mt-1">Exporter le listing</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {stats.total} pièces · {stats.withPurchase} avec prix d’achat · {stats.onRequest} « sur devis » (prix de vente 0). Les colonnes vertes sont modifiables.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <a href="/api/admin/products/export?format=xlsx" className="h-12 px-5 rounded-2xl bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2">
            <FileSpreadsheet className="h-5 w-5" /> Télécharger en Excel (.xlsx)
          </a>
          <a href="/api/admin/products/export?format=csv" className="h-12 px-5 rounded-2xl border border-border font-semibold inline-flex items-center justify-center gap-2 hover:bg-muted">
            <FileText className="h-5 w-5" /> CSV (séparateur ;)
          </a>
        </div>
      </section>

      {/* 2. Import */}
      <section className="rounded-3xl border border-border bg-card p-5 sm:p-6 mt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-strong">Étape 2</p>
        <h2 className="font-display text-xl font-extrabold mt-1">Importer le fichier modifié</h2>
        <p className="text-sm text-muted-foreground mt-1">Un aperçu s’affiche : rien n’est modifié tant que vous n’avez pas validé.</p>
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          className={cn('mt-4 w-full rounded-3xl border-2 border-dashed p-8 text-center transition-colors', drag ? 'border-brand-strong bg-brand/10' : 'border-border hover:bg-muted')}
        >
          {busy === 'preview' ? <Loader2 className="h-8 w-8 mx-auto animate-spin" /> : <Upload className="h-8 w-8 mx-auto text-muted-foreground" />}
          <p className="mt-2 font-semibold">{file ? file.name : 'Choisir ou déposer le fichier (.xlsx ou .csv)'}</p>
          <p className="text-xs text-muted-foreground mt-1">5 Mo maximum</p>
        </button>
        <input ref={input} type="file" accept=".xlsx,.csv" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />

        {result && (
          <div className="mt-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Stat label="Lignes lues" value={result.read} />
              <Stat label={applied ? 'Produits mis à jour' : 'À modifier'} value={result.changes.length} tone="brand" />
              <Stat label="Inchangés" value={result.unchanged} />
              <Stat label="Lignes ignorées" value={result.errors.length} tone={result.errors.length ? 'bad' : undefined} />
            </div>

            {applied && (
              <p className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 p-4 text-sm font-medium">
                <CheckCircle2 className="h-5 w-5 shrink-0" /> Import appliqué. Il est enregistré dans l’historique ci-dessous et peut être annulé.
              </p>
            )}

            {result.errors.length > 0 && (
              <Issues title="Lignes ignorées" Icon={XCircle} tone="text-rose-600" items={result.errors} />
            )}
            {result.warnings.length > 0 && <Issues title="À vérifier" Icon={AlertTriangle} tone="text-amber-600" items={result.warnings} />}

            {result.changes.length > 0 && (
              <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="p-3">Produit</th>
                      <th className="p-3">Changements</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.changes.map((c) => (
                      <tr key={c.id} className="border-t border-border align-top">
                        <td className="p-3 font-medium min-w-[180px]">
                          {c.name}
                          <span className="block text-[11px] text-muted-foreground font-normal">ligne {c.line}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1.5">
                            {c.fields.map((f) => (
                              <span key={f} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-xs whitespace-nowrap">
                                <span className="text-muted-foreground">{FIELD_LABEL[f]} :</span>
                                <span className="line-through opacity-60">{show(f, c.before[f])}</span>
                                <ArrowRight className="h-3 w-3" />
                                <span className="font-semibold">{show(f, c.after[f])}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!applied && result.changes.length > 0 && file && (
              <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
                <button onClick={() => { setFile(null); setResult(null); }} className="h-12 px-5 rounded-2xl border border-border font-medium">Annuler</button>
                <button
                  onClick={() => send(file, 'apply')}
                  disabled={!!busy}
                  className="h-12 px-6 rounded-2xl bg-brand text-brand-foreground font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {busy === 'apply' ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                  Appliquer {result.changes.length} modification{result.changes.length > 1 ? 's' : ''}
                </button>
              </div>
            )}
            {!applied && result.changes.length === 0 && (
              <p className="mt-4 text-sm text-muted-foreground">Aucune différence avec le site : rien à mettre à jour.</p>
            )}
          </div>
        )}
      </section>

      {/* 3. Historique */}
      <section className="rounded-3xl border border-border bg-card p-5 sm:p-6 mt-4">
        <h2 className="font-display text-xl font-extrabold flex items-center gap-2"><History className="h-5 w-5" /> Historique des imports</h2>
        {imports.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">Aucun import pour l’instant.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {imports.map((i) => (
              <li key={i.id} className="py-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-medium text-sm">{i.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmtDate(i.createdAt)} · {i.authorName} · {i.rowsChanged} produit{i.rowsChanged > 1 ? 's' : ''} modifié{i.rowsChanged > 1 ? 's' : ''} sur {i.rowsRead} lignes
                  </p>
                  {i.undoneAt && <p className="text-xs text-amber-600">Annulé le {fmtDate(i.undoneAt)} par {i.undoneBy}</p>}
                </div>
                {!i.undoneAt && i.rowsChanged > 0 && (
                  <button onClick={() => undo(i.id)} className="h-9 px-3 rounded-full border border-border text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-muted">
                    <Undo2 className="h-3.5 w-3.5" /> Annuler cet import
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
        <Download className="h-3.5 w-3.5" /> Le prix d’achat et la marge restent privés : ils n’apparaissent jamais sur le site public ni dans le flux Google.
      </p>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'brand' | 'bad' }) {
  return (
    <div className={cn('rounded-2xl p-3', tone === 'brand' ? 'bg-brand/20' : tone === 'bad' ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-muted')}>
      <p className="font-display text-2xl font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Issues({ title, Icon, tone, items }: { title: string; Icon: any; tone: string; items: Issue[] }) {
  return (
    <details className="mt-4 rounded-2xl border border-border p-4" open={items.length <= 5}>
      <summary className={cn('cursor-pointer font-semibold text-sm flex items-center gap-2', tone)}>
        <Icon className="h-4 w-4" /> {title} ({items.length})
      </summary>
      <ul className="mt-2 space-y-1 text-sm">
        {items.map((e, i) => (
          <li key={i}>
            <span className="text-muted-foreground">Ligne {e.line}</span>
            {e.name ? ` · ${e.name}` : ''} — {e.message}
          </li>
        ))}
      </ul>
    </details>
  );
}
