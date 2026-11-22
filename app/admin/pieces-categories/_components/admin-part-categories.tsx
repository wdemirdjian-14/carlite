'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, Plus, Trash2, Tag, Package, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { EditModal } from '@/components/admin/edit-modal';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

const CATEGORY_FIELDS = [
  { key: 'name', label: 'Nom de la catégorie', type: 'text' as const, placeholder: 'Ex: Sellerie, Batteries et chargeurs, Train roulant' },
  { key: 'description', label: 'Description (optionnelle)', type: 'textarea' as const },
  { key: 'order', label: "Ordre d'affichage", type: 'number' as const, half: true },
  { key: 'isAccessory', label: 'Catégorie « Accessoires »', type: 'checkbox' as const, half: true },
];

export function AdminPartCategories({ categories }: { categories: any[] }) {
  const [items, setItems] = useState(categories ?? []);
  const [editItem, setEditItem] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const sortItems = (list: any[]) => [...list].sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0) || (a?.name ?? '').localeCompare(b?.name ?? ''));

  const handleSave = async (data: Record<string, any>) => {
    if (!editItem?.id) return;
    try {
      const res = await fetch(`/api/admin/part-categories/${editItem.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res?.ok) { const u = await res.json(); setItems((p: any[]) => sortItems(p.map((c: any) => c?.id === editItem.id ? { ...c, ...u } : c))); setEditItem(null); toast.success('Catégorie mise à jour'); }
      else toast.error('Erreur lors de la sauvegarde');
    } catch { toast.error('Erreur'); }
  };

  const handleCreate = async (data: Record<string, any>) => {
    try {
      const res = await fetch('/api/admin/part-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res?.ok) { const c = await res.json(); setItems((p: any[]) => sortItems([...p, c])); setShowCreate(false); toast.success('Catégorie créée'); }
      else { const err = await res.json().catch(() => ({})); toast.error(err?.error || 'Erreur'); }
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async () => {
    if (!deleteItem?.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/part-categories/${deleteItem.id}`, { method: 'DELETE' });
      if (res?.ok) { setItems((p: any[]) => p.filter((c: any) => c?.id !== deleteItem.id)); setDeleteItem(null); toast.success('Catégorie supprimée'); }
      else toast.error('Erreur');
    } catch { toast.error('Erreur'); }
    setDeleting(false);
  };

  return (
    <div className="max-w-[900px] mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-lg hover:bg-muted transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Catégories de pièces</h1>
            <p className="text-sm text-muted-foreground">Organisez vos pièces détachées et accessoires par catégorie</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-md">
          <Plus className="h-4 w-4" /> Nouvelle catégorie
        </button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/20 rounded-xl p-4 mb-6 text-sm text-blue-800 dark:text-blue-300">
        Ces catégories apparaissent comme filtres sur la page « Pièces détachées » du site. Cochez « Catégorie Accessoires » pour la catégorie dédiée aux accessoires (bâches, protections, etc.).
      </div>

      <div className="space-y-3">
        {sortItems(items).map((c: any, i: number) => (
          <div key={c?.id ?? i} className="bg-card rounded-xl p-4 shadow-[var(--shadow-sm)] flex items-center gap-4">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary shrink-0">
              {c?.isAccessory ? <Package className="h-5 w-5" /> : <Tag className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{c?.name ?? ''}</h3>
                {c?.isAccessory && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Accessoires</span>}
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Ordre {c?.order ?? 0}</span>
              </div>
              {c?.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{c.description}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setEditItem(c)} className="p-2 rounded-lg hover:bg-muted transition-colors text-blue-600 dark:text-blue-400" title="Modifier"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => setDeleteItem(c)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-500" title="Supprimer"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && <div className="text-center py-12 text-muted-foreground">Aucune catégorie. Créez-en une pour organiser vos pièces détachées.</div>}

      <EditModal open={!!editItem} onClose={() => setEditItem(null)} onSave={handleSave}
        title={`Modifier : ${editItem?.name ?? ''}`} fields={CATEGORY_FIELDS} initialData={editItem ?? {}} />
      <EditModal open={showCreate} onClose={() => setShowCreate(false)} onSave={handleCreate}
        title="Nouvelle catégorie" fields={CATEGORY_FIELDS} initialData={{ order: items.length, isAccessory: false }} />
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete}
        title="Supprimer cette catégorie ?" message={`La catégorie « ${deleteItem?.name ?? ''} » sera supprimée. Les pièces associées ne seront pas supprimées mais perdront cette catégorie.`}
        confirmLabel="Supprimer" loading={deleting} />
    </div>
  );
}
