'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Pencil, Plus, Trash2, Copy, Eye, EyeOff, Search, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { EditModal } from '@/components/admin/edit-modal';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { STOCK_OPTIONS } from '@/components/stock-badge';

type FilterTab = 'all' | 'published' | 'hidden';
type SortKey = 'name' | 'price' | 'updatedAt';

export function AdminAccessories({ accessories, categories = [], vehicles = [], usedVehicles = [] }: { accessories: any[]; categories?: any[]; vehicles?: any[]; usedVehicles?: any[] }) {
  const [items, setItems] = useState(accessories ?? []);

  const categoryOptions = useMemo(() => (categories ?? []).map((c: any) => c?.name).filter(Boolean), [categories]);
  const vehicleItems = useMemo(() => (vehicles ?? []).map((v: any) => ({ value: v?.id, label: v?.name })).filter((o: any) => o.value), [vehicles]);
  const usedVehicleItems = useMemo(() => (usedVehicles ?? []).map((v: any) => ({ value: v?.id, label: v?.name })).filter((o: any) => o.value), [usedVehicles]);

  const ACCESSORY_FIELDS = useMemo(() => ([
    { key: 'name', label: 'Nom', type: 'text' as const, half: true, required: true },
    { key: 'slug', label: 'Slug (URL)', type: 'text' as const, half: true, required: true },
    { key: 'description', label: 'Description', type: 'textarea' as const, required: true },
    { key: 'price', label: 'Prix de vente HT (€) — 0 = sur devis', type: 'number' as const, half: true, required: true },
    { key: 'purchasePrice', label: "Prix d'achat HT (€) — privé", type: 'number' as const, half: true },
    categoryOptions.length > 0
      ? { key: 'category', label: 'Catégorie', type: 'select' as const, half: true, options: categoryOptions }
      : { key: 'category', label: 'Catégorie', type: 'text' as const, half: true, placeholder: 'Créez des catégories dans « Catégories de pièces »' },
    { key: 'imageUrl', label: 'Image principale', type: 'image' as const },
    { key: 'gallery', label: 'Galerie de photos (optionnelle)', type: 'gallery' as const },
    { key: 'compatibleVehicleIds', label: 'Véhicules neufs compatibles (fiche produit)', type: 'multiselect' as const, optionItems: vehicleItems },
    { key: 'compatibleUsedVehicleIds', label: "Véhicules d'occasion compatibles", type: 'multiselect' as const, optionItems: usedVehicleItems },
    { key: 'inStock', label: 'En stock', type: 'checkbox' as const, half: true },
    { key: 'published', label: 'Publié sur le site', type: 'checkbox' as const, half: true },
    { key: 'quantity', label: 'Quantité en stock', type: 'number' as const, half: true },
    { key: 'stockStatus', label: 'État du stock', type: 'select' as const, half: true, optionItems: STOCK_OPTIONS },
    { key: 'keepVisible', label: 'Rester visible même en rupture', type: 'checkbox' as const, half: true },
  ]), [categoryOptions, vehicleItems, usedVehicleItems]);

  const [editItem, setEditItem] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    let list = [...items];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a: any) =>
        (a?.name ?? '').toLowerCase().includes(q) || (a?.category ?? '').toLowerCase().includes(q)
      );
    }
    if (filter === 'published') list = list.filter((a: any) => a?.published !== false);
    if (filter === 'hidden') list = list.filter((a: any) => a?.published === false);
    list.sort((a: any, b: any) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'price') return ((a?.price ?? 0) - (b?.price ?? 0)) * dir;
      if (sortBy === 'updatedAt') return (new Date(a?.updatedAt ?? 0).getTime() - new Date(b?.updatedAt ?? 0).getTime()) * dir;
      return (a?.name ?? '').localeCompare(b?.name ?? '') * dir;
    });
    return list;
  }, [items, search, filter, sortBy, sortDir]);

  const counts = useMemo(() => ({
    all: items.length,
    published: items.filter((a: any) => a?.published !== false).length,
    hidden: items.filter((a: any) => a?.published === false).length,
  }), [items]);

  const patchItem = async (id: string, data: Record<string, any>) => {
    try {
      const res = await fetch(`/api/admin/accessories/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res?.ok) { const u = await res.json(); setItems((p: any[]) => p.map((a: any) => a?.id === id ? { ...a, ...u } : a)); return true; }
    } catch {} return false;
  };

  const togglePublished = async (id: string, published: boolean) => {
    if (await patchItem(id, { published })) toast.success(published ? 'Accessoire publié' : 'Accessoire masqué');
    else toast.error('Erreur');
  };

  const handleSave = async (data: Record<string, any>) => {
    if (!editItem?.id) return;
    if (await patchItem(editItem.id, data)) { setEditItem(null); toast.success('Accessoire mis à jour'); }
    else toast.error('Erreur lors de la sauvegarde');
  };

  const handleCreate = async (data: Record<string, any>) => {
    try {
      const res = await fetch('/api/admin/accessories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res?.ok) { const c = await res.json(); setItems((p: any[]) => [c, ...p]); setShowCreate(false); toast.success('Accessoire créé'); }
      else { const err = await res.json().catch(() => ({})); toast.error(err?.error || 'Erreur'); }
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async () => {
    if (!deleteItem?.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/accessories/${deleteItem.id}`, { method: 'DELETE' });
      if (res?.ok) { setItems((p: any[]) => p.filter((a: any) => a?.id !== deleteItem.id)); setDeleteItem(null); toast.success('Accessoire supprimé'); }
      else toast.error('Erreur');
    } catch { toast.error('Erreur'); }
    setDeleting(false);
  };

  const handleDuplicate = async (item: any) => {
    const dup = { ...item }; delete dup.id; delete dup.createdAt; delete dup.updatedAt;
    dup.name = `${dup.name} (copie)`; dup.slug = `${dup.slug}-copie-${Date.now()}`; dup.published = false;
    try {
      const res = await fetch('/api/admin/accessories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dup) });
      if (res?.ok) { const c = await res.json(); setItems((p: any[]) => [c, ...p]); toast.success('Accessoire dupliqué (en brouillon)'); }
      else toast.error('Erreur');
    } catch { toast.error('Erreur'); }
  };

  const toggleSort = (key: SortKey) => { if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortBy(key); setSortDir('asc'); } };

  const FILTERS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: `Tous (${counts.all})` },
    { key: 'published', label: `Publiés (${counts.published})` },
    { key: 'hidden', label: `Masqués (${counts.hidden})` },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-lg hover:bg-muted transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Accessoires</h1>
            <p className="text-sm text-muted-foreground">{items.length} accessoire(s)</p>
          </div>
        </div>
        <div className="flex gap-2">
        <Link href="/admin/import-export" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
          Import / export
        </Link>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-md">
          <Plus className="h-4 w-4" /> Nouvel accessoire
        </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-card rounded-xl p-4 shadow-[var(--shadow-sm)] mb-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, catégorie..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex items-center gap-1 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            {(['name', 'price', 'updatedAt'] as SortKey[]).map((k) => (
              <button key={k} onClick={() => toggleSort(k)}
                className={`px-2 py-1 rounded-md transition-colors ${sortBy === k ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'}`}>
                {k === 'name' ? 'Nom' : k === 'price' ? 'Prix' : 'Modifié'}
                {sortBy === k && <ArrowUpDown className="h-3 w-3 inline ml-0.5" />}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((a: any, i: number) => (
          <div key={a?.id ?? i} className={`bg-card rounded-xl overflow-hidden shadow-[var(--shadow-sm)] transition-opacity ${a?.published === false ? 'opacity-60' : ''}`}>
            <div className="relative aspect-square bg-muted">
              <Image src={a?.imageUrl ?? ''} alt={a?.name ?? ''} fill className="object-cover" />
              {a?.published === false && (
                <div className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 font-medium">Masqué</div>
              )}
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <button onClick={() => togglePublished(a?.id, !(a?.published !== false))}
                  className={`p-1.5 rounded-lg shadow ${a?.published !== false ? 'bg-white/90 dark:bg-gray-900/90 text-green-600' : 'bg-white/90 dark:bg-gray-900/90 text-muted-foreground'}`}
                  title={a?.published !== false ? 'Masquer' : 'Publier'}>
                  {a?.published !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => setEditItem(a)} className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-900/90 shadow text-blue-600 dark:text-blue-400" title="Modifier">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="text-xs text-primary uppercase tracking-wider mb-1">{a?.category ?? ''}</div>
              <h3 className="font-medium mb-1 truncate">{a?.name ?? ''}</h3>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-primary">{(a?.price ?? 0)?.toLocaleString?.('fr-FR')} €</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${a?.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {a?.inStock ? 'En stock' : 'Rupture'}
                </span>
              </div>
              {a?.updatedAt && <div className="text-[10px] text-muted-foreground mt-2">Modifié le {new Date(a.updatedAt).toLocaleDateString('fr-FR')}</div>}
              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
                <button onClick={() => handleDuplicate(a)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Dupliquer"><Copy className="h-3.5 w-3.5" /></button>
                <button onClick={() => setDeleteItem(a)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-500" title="Supprimer"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground">Aucun accessoire trouvé.</div>}

      <EditModal open={!!editItem} onClose={() => setEditItem(null)} onSave={handleSave}
        title={`Modifier : ${editItem?.name ?? ''}`} fields={ACCESSORY_FIELDS} initialData={editItem ?? {}} />
      <EditModal open={showCreate} onClose={() => setShowCreate(false)} onSave={handleCreate}
        title="Nouvel accessoire" fields={ACCESSORY_FIELDS} initialData={{ inStock: true, published: true, stockStatus: 'available', keepVisible: true }} />
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete}
        title="Supprimer cet accessoire ?" message={`L'accessoire « ${deleteItem?.name ?? ''} » sera définitivement supprimé. Cette action est irréversible.`}
        confirmLabel="Supprimer" loading={deleting} />
    </div>
  );
}
