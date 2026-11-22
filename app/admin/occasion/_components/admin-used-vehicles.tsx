'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Pencil, Plus, Trash2, Copy, Eye, EyeOff, Search, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { EditModal } from '@/components/admin/edit-modal';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { STOCK_OPTIONS } from '@/components/stock-badge';

const USED_VEHICLE_FIELDS = [
  { key: 'name', label: 'Nom', type: 'text' as const, half: true, required: true },
  { key: 'slug', label: 'Slug (URL)', type: 'text' as const, half: true, required: true },
  { key: 'description', label: 'Description', type: 'textarea' as const, required: true },
  { key: 'price', label: 'Prix (€)', type: 'number' as const, half: true, required: true },
  { key: 'originalPrice', label: 'Prix d\'origine (€)', type: 'number' as const, half: true },
  { key: 'year', label: 'Année', type: 'number' as const, half: true },
  { key: 'mileage', label: 'Kilométrage', type: 'number' as const, half: true },
  { key: 'range', label: 'Autonomie (km)', type: 'number' as const, half: true },
  { key: 'battery', label: 'Batterie', type: 'text' as const, half: true },
  { key: 'color', label: 'Couleur', type: 'text' as const, half: true },
  { key: 'condition', label: 'État', type: 'select' as const, half: true, options: ['Comme neuf', 'Très bon état', 'Bon état', 'État correct'] },
  { key: 'seats', label: 'Nombre de places', type: 'number' as const, half: true },
  { key: 'homologation', label: 'Homologation', type: 'select' as const, half: true, options: ['', 'L6e (sans permis)', 'L7e (permis B / quadricycle lourd)', 'Route homologué', 'Non homologué route', 'Voie publique'] },
  { key: 'permitType', label: 'Permis requis', type: 'select' as const, half: true, options: ['', 'Sans permis', 'Permis AM (BSR)', 'Permis B', 'Permis B1'] },
  { key: 'features', label: 'Caractéristiques / équipements', type: 'taglist' as const, placeholder: 'Ex: Climatisation, Attelage, Benne basculante...' },
  { key: 'imageUrl', label: 'Image principale', type: 'image' as const },
  { key: 'gallery', label: 'Galerie de photos', type: 'gallery' as const },
  { key: 'featured', label: 'À la une (page d\'accueil)', type: 'checkbox' as const, half: true },
  { key: 'available', label: 'Disponible', type: 'checkbox' as const, half: true },
  { key: 'published', label: 'Publié sur le site', type: 'checkbox' as const, half: true },
  { key: 'stockStatus', label: 'État du stock', type: 'select' as const, half: true, optionItems: STOCK_OPTIONS },
  { key: 'keepVisible', label: 'Rester visible même en rupture', type: 'checkbox' as const, half: true },
];

type FilterTab = 'all' | 'published' | 'hidden';
type SortKey = 'name' | 'price' | 'year' | 'updatedAt';

export function AdminUsedVehicles({ vehicles }: { vehicles: any[] }) {
  const [items, setItems] = useState(vehicles ?? []);
  const [editItem, setEditItem] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortKey>('updatedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    let list = [...items];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((v: any) =>
        (v?.name ?? '').toLowerCase().includes(q) || (v?.color ?? '').toLowerCase().includes(q) || (v?.condition ?? '').toLowerCase().includes(q)
      );
    }
    if (filter === 'published') list = list.filter((v: any) => v?.published !== false);
    if (filter === 'hidden') list = list.filter((v: any) => v?.published === false);
    list.sort((a: any, b: any) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'price') return ((a?.price ?? 0) - (b?.price ?? 0)) * dir;
      if (sortBy === 'year') return ((a?.year ?? 0) - (b?.year ?? 0)) * dir;
      if (sortBy === 'updatedAt') return (new Date(a?.updatedAt ?? 0).getTime() - new Date(b?.updatedAt ?? 0).getTime()) * dir;
      return (a?.name ?? '').localeCompare(b?.name ?? '') * dir;
    });
    return list;
  }, [items, search, filter, sortBy, sortDir]);

  const counts = useMemo(() => ({
    all: items.length,
    published: items.filter((v: any) => v?.published !== false).length,
    hidden: items.filter((v: any) => v?.published === false).length,
  }), [items]);

  const patchItem = async (id: string, data: Record<string, any>) => {
    try {
      const res = await fetch(`/api/admin/used-vehicles/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res?.ok) { const u = await res.json(); setItems((p: any[]) => p.map((v: any) => v?.id === id ? { ...v, ...u } : v)); return true; }
    } catch {} return false;
  };

  const togglePublished = async (id: string, published: boolean) => {
    if (await patchItem(id, { published })) toast.success(published ? 'Véhicule publié' : 'Véhicule masqué');
    else toast.error('Erreur');
  };

  const handleSave = async (data: Record<string, any>) => {
    if (!editItem?.id) return;
    if (await patchItem(editItem.id, data)) { setEditItem(null); toast.success('Véhicule d\'occasion mis à jour'); }
    else toast.error('Erreur');
  };

  const handleCreate = async (data: Record<string, any>) => {
    try {
      const res = await fetch('/api/admin/used-vehicles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res?.ok) { const c = await res.json(); setItems((p: any[]) => [c, ...p]); setShowCreate(false); toast.success('Véhicule d\'occasion créé'); }
      else { const err = await res.json().catch(() => ({})); toast.error(err?.error || 'Erreur'); }
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async () => {
    if (!deleteItem?.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/used-vehicles/${deleteItem.id}`, { method: 'DELETE' });
      if (res?.ok) { setItems((p: any[]) => p.filter((v: any) => v?.id !== deleteItem.id)); setDeleteItem(null); toast.success('Véhicule supprimé'); }
      else toast.error('Erreur');
    } catch { toast.error('Erreur'); }
    setDeleting(false);
  };

  const handleDuplicate = async (item: any) => {
    const dup = { ...item }; delete dup.id; delete dup.createdAt; delete dup.updatedAt;
    dup.name = `${dup.name} (copie)`; dup.slug = `${dup.slug}-copie-${Date.now()}`; dup.published = false;
    try {
      const res = await fetch('/api/admin/used-vehicles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dup) });
      if (res?.ok) { const c = await res.json(); setItems((p: any[]) => [c, ...p]); toast.success('Véhicule dupliqué (en brouillon)'); }
      else toast.error('Erreur');
    } catch { toast.error('Erreur'); }
  };

  const toggleSort = (key: SortKey) => { if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortBy(key); setSortDir('asc'); } };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-lg hover:bg-muted transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Véhicules d'occasion</h1>
            <p className="text-sm text-muted-foreground">{items.length} véhicule(s)</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-md">
          <Plus className="h-4 w-4" /> Nouveau véhicule
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-card rounded-xl p-4 shadow-[var(--shadow-sm)] mb-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, couleur, état..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex items-center gap-1 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            {(['name', 'price', 'year', 'updatedAt'] as SortKey[]).map((k) => (
              <button key={k} onClick={() => toggleSort(k)}
                className={`px-2 py-1 rounded-md transition-colors ${sortBy === k ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'}`}>
                {k === 'name' ? 'Nom' : k === 'price' ? 'Prix' : k === 'year' ? 'Année' : 'Modifié'}
                {sortBy === k && <ArrowUpDown className="h-3 w-3 inline ml-0.5" />}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[{ key: 'all' as FilterTab, label: `Tous (${counts.all})` }, { key: 'published' as FilterTab, label: `Publiés (${counts.published})` }, { key: 'hidden' as FilterTab, label: `Masqués (${counts.hidden})` }].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((v: any, i: number) => (
          <div key={v?.id ?? i} className={`bg-card rounded-xl p-4 shadow-[var(--shadow-sm)] flex items-center gap-4 transition-opacity ${v?.published === false ? 'opacity-60' : ''}`}>
            <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <Image src={v?.imageUrl ?? ''} alt={v?.name ?? ''} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{v?.name ?? ''}</h3>
                {v?.published === false && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 font-medium">Masqué</span>}
                {!v?.available && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 font-medium">Vendu</span>}
              </div>
              <div className="text-sm text-muted-foreground">
                {v?.year ?? ''} • {(v?.mileage ?? 0)?.toLocaleString?.('fr-FR')} km • {(v?.price ?? 0)?.toLocaleString?.('fr-FR')} €
                {v?.updatedAt && <span className="ml-2 text-xs">• Modifié le {new Date(v.updatedAt).toLocaleDateString('fr-FR')}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => togglePublished(v?.id, !(v?.published !== false))}
                className={`p-2 rounded-lg transition-colors ${v?.published !== false ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10' : 'text-muted-foreground hover:bg-muted'}`}
                title={v?.published !== false ? 'Masquer' : 'Publier'}>
                {v?.published !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              <button onClick={() => setEditItem(v)} className="p-2 rounded-lg hover:bg-muted transition-colors text-blue-600 dark:text-blue-400" title="Modifier"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => handleDuplicate(v)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Dupliquer"><Copy className="h-4 w-4" /></button>
              <button onClick={() => setDeleteItem(v)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-500" title="Supprimer"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground">Aucun véhicule d'occasion trouvé.</div>}
      </div>

      <EditModal open={!!editItem} onClose={() => setEditItem(null)} onSave={handleSave}
        title={`Modifier : ${editItem?.name ?? ''}`} fields={USED_VEHICLE_FIELDS} initialData={editItem ?? {}} />
      <EditModal open={showCreate} onClose={() => setShowCreate(false)} onSave={handleCreate}
        title="Nouveau véhicule d'occasion" fields={USED_VEHICLE_FIELDS}
        initialData={{ condition: 'Bon état', available: true, published: true, year: new Date().getFullYear(), stockStatus: 'available', keepVisible: true }} />
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete}
        title="Supprimer ce véhicule ?" message={`Le véhicule « ${deleteItem?.name ?? ''} » sera définitivement supprimé. Cette action est irréversible.`}
        confirmLabel="Supprimer" loading={deleting} />
    </div>
  );
}
