'use client';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff, Star, StarOff, Newspaper, Pencil, Calendar, Clock, Plus, Trash2, Copy, Search, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { EditModal } from '@/components/admin/edit-modal';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

const ARTICLE_FIELDS = [
  { key: 'title', label: 'Titre', type: 'text' as const },
  { key: 'slug', label: 'Slug (URL)', type: 'text' as const, half: true },
  { key: 'category', label: 'Catégorie', type: 'select' as const, half: true, options: ['Guide', 'Pratique', 'Technologie', 'Réglementation', 'Actualité', 'Mobilité', 'Économie', 'Environnement'] },
  { key: 'publishDate', label: 'Date d\'activation', type: 'date' as const, half: true },
  { key: 'readTime', label: 'Temps de lecture (min)', type: 'number' as const, half: true },
  { key: 'excerpt', label: 'Extrait / Résumé', type: 'textarea' as const },
  { key: 'content', label: 'Contenu (Markdown)', type: 'textarea' as const },
  { key: 'imageUrl', label: 'Image de l\'article', type: 'image' as const },
  { key: 'author', label: 'Auteur', type: 'text' as const, half: true },
  { key: 'published', label: 'Publié', type: 'checkbox' as const, half: true },
  { key: 'featured', label: 'À la une', type: 'checkbox' as const, half: true },
];

function formatActivationDate(date: string | null | undefined): { label: string; color: string; icon: 'active' | 'scheduled' | 'none' } {
  if (!date) return { label: 'Pas de date', color: 'text-muted-foreground', icon: 'none' };
  const d = new Date(date);
  const now = new Date();
  const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  if (d <= now) return { label: `Actif depuis ${dateStr}`, color: 'text-green-600', icon: 'active' };
  return { label: `Programmé ${dateStr}`, color: 'text-amber-600', icon: 'scheduled' };
}

type FilterTab = 'all' | 'published' | 'hidden' | 'featured';
type SortKey = 'title' | 'category' | 'updatedAt';

export function AdminArticles({ articles }: { articles: any[] }) {
  const [items, setItems] = useState(articles ?? []);
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
      list = list.filter((a: any) =>
        (a?.title ?? '').toLowerCase().includes(q) || (a?.category ?? '').toLowerCase().includes(q) || (a?.author ?? '').toLowerCase().includes(q)
      );
    }
    if (filter === 'published') list = list.filter((a: any) => a?.published);
    if (filter === 'hidden') list = list.filter((a: any) => !a?.published);
    if (filter === 'featured') list = list.filter((a: any) => a?.featured);
    list.sort((a: any, b: any) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'category') return (a?.category ?? '').localeCompare(b?.category ?? '') * dir;
      if (sortBy === 'updatedAt') return (new Date(a?.updatedAt ?? 0).getTime() - new Date(b?.updatedAt ?? 0).getTime()) * dir;
      return (a?.title ?? '').localeCompare(b?.title ?? '') * dir;
    });
    return list;
  }, [items, search, filter, sortBy, sortDir]);

  const counts = useMemo(() => ({
    all: items.length,
    published: items.filter((a: any) => a?.published).length,
    hidden: items.filter((a: any) => !a?.published).length,
    featured: items.filter((a: any) => a?.featured).length,
  }), [items]);

  const patchItem = async (id: string, data: Record<string, any>) => {
    try {
      const res = await fetch(`/api/admin/articles/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res?.ok) { const u = await res.json(); setItems((p: any[]) => p.map((a: any) => a?.id === id ? { ...a, ...u } : a)); return true; }
    } catch {} return false;
  };

  const togglePublished = async (id: string, published: boolean) => {
    if (await patchItem(id, { published })) toast.success(published ? 'Article publié' : 'Article masqué');
    else toast.error('Erreur');
  };

  const toggleFeatured = async (id: string, featured: boolean) => {
    if (await patchItem(id, { featured })) toast.success(featured ? 'Article mis en avant' : 'À la une retiré');
    else toast.error('Erreur');
  };

  const handleSave = async (data: Record<string, any>) => {
    if (!editItem?.id) return;
    if (await patchItem(editItem.id, data)) { setEditItem(null); toast.success('Article mis à jour'); }
    else toast.error('Erreur');
  };

  const handleCreate = async (data: Record<string, any>) => {
    try {
      const res = await fetch('/api/admin/articles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res?.ok) { const c = await res.json(); setItems((p: any[]) => [c, ...p]); setShowCreate(false); toast.success('Article créé'); }
      else { const err = await res.json().catch(() => ({})); toast.error(err?.error || 'Erreur'); }
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async () => {
    if (!deleteItem?.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/articles/${deleteItem.id}`, { method: 'DELETE' });
      if (res?.ok) { setItems((p: any[]) => p.filter((a: any) => a?.id !== deleteItem.id)); setDeleteItem(null); toast.success('Article supprimé'); }
      else toast.error('Erreur');
    } catch { toast.error('Erreur'); }
    setDeleting(false);
  };

  const handleDuplicate = async (item: any) => {
    const dup = { ...item }; delete dup.id; delete dup.createdAt; delete dup.updatedAt;
    dup.title = `${dup.title} (copie)`; dup.slug = `${dup.slug}-copie-${Date.now()}`; dup.published = false; dup.featured = false;
    try {
      const res = await fetch('/api/admin/articles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dup) });
      if (res?.ok) { const c = await res.json(); setItems((p: any[]) => [c, ...p]); toast.success('Article dupliqué (en brouillon)'); }
      else toast.error('Erreur');
    } catch { toast.error('Erreur'); }
  };

  const toggleSort = (key: SortKey) => { if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortBy(key); setSortDir('asc'); } };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-lg hover:bg-muted transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-green-600" />
            <h1 className="font-display text-2xl font-bold">Articles ({items.length})</h1>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-md">
          <Plus className="h-4 w-4" /> Nouvel article
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-card rounded-xl p-4 shadow-[var(--shadow-sm)] mb-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par titre, catégorie, auteur..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex items-center gap-1 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            {(['title', 'category', 'updatedAt'] as SortKey[]).map((k) => (
              <button key={k} onClick={() => toggleSort(k)}
                className={`px-2 py-1 rounded-md transition-colors ${sortBy === k ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'}`}>
                {k === 'title' ? 'Titre' : k === 'category' ? 'Catégorie' : 'Modifié'}
                {sortBy === k && <ArrowUpDown className="h-3 w-3 inline ml-0.5" />}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {([{ key: 'all' as FilterTab, label: `Tous (${counts.all})` }, { key: 'published' as FilterTab, label: `Publiés (${counts.published})` }, { key: 'hidden' as FilterTab, label: `Masqués (${counts.hidden})` }, { key: 'featured' as FilterTab, label: `À la une (${counts.featured})` }]).map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((a: any) => {
          const activation = formatActivationDate(a?.publishDate);
          return (
            <div key={a?.id} className={`bg-card rounded-xl p-4 shadow-[var(--shadow-sm)] flex items-center gap-4 transition-opacity ${!a?.published ? 'opacity-60' : ''}`}>
              <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <Image src={a?.imageUrl ?? ''} alt={a?.title ?? ''} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-medium truncate">{a?.title}</div>
                  {!a?.published && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 font-medium">Masqué</span>}
                </div>
                <div className="text-xs text-muted-foreground">{a?.category} • {a?.readTime} min • {a?.author}</div>
                <div className={`flex items-center gap-1 text-xs mt-0.5 ${activation.color}`}>
                  {activation.icon === 'scheduled' ? <Clock className="h-3 w-3" /> : activation.icon === 'active' ? <Calendar className="h-3 w-3" /> : null}
                  {activation.label}
                  {a?.updatedAt && <span className="text-muted-foreground ml-2">• Modifié le {new Date(a.updatedAt).toLocaleDateString('fr-FR')}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => togglePublished(a?.id, !a?.published)}
                  className={`p-2 rounded-lg transition-colors ${a?.published ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10' : 'text-muted-foreground hover:bg-muted'}`}
                  title={a?.published ? 'Masquer' : 'Publier'}>
                  {a?.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => toggleFeatured(a?.id, !a?.featured)}
                  className={`p-2 rounded-lg transition-colors ${a?.featured ? 'bg-yellow-500/10 text-yellow-600' : 'hover:bg-muted text-muted-foreground'}`}
                  title={a?.featured ? 'Retirer de la une' : 'Mettre à la une'}>
                  {a?.featured ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
                </button>
                <button onClick={() => setEditItem(a)} className="p-2 rounded-lg hover:bg-muted transition-colors text-blue-600 dark:text-blue-400" title="Modifier"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => handleDuplicate(a)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Dupliquer"><Copy className="h-4 w-4" /></button>
                <button onClick={() => setDeleteItem(a)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-500" title="Supprimer"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground">Aucun article trouvé.</div>}
      </div>

      <EditModal open={!!editItem} onClose={() => setEditItem(null)} onSave={handleSave}
        title={`Modifier : ${editItem?.title ?? ''}`} fields={ARTICLE_FIELDS} initialData={editItem ?? {}} />
      <EditModal open={showCreate} onClose={() => setShowCreate(false)} onSave={handleCreate}
        title="Nouvel article" fields={ARTICLE_FIELDS}
        initialData={{ category: 'Actualité', author: 'CARLITE', readTime: 5, published: false }} />
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete}
        title="Supprimer cet article ?" message={`L'article « ${deleteItem?.title ?? ''} » sera définitivement supprimé. Cette action est irréversible.`}
        confirmLabel="Supprimer" loading={deleting} />
    </div>
  );
}
