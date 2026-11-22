'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, Percent, Star, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { EditModal } from '@/components/admin/edit-modal';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { euroHT, euroTTC } from '@/lib/pricing';

type Props = {
  promotions: any[];
  vehicles: any[];
  accessories: any[];
  usedVehicles: any[];
};

export function AdminPromotions({ promotions, vehicles, accessories, usedVehicles }: Props) {
  const [items, setItems] = useState(promotions ?? []);
  const [editItem, setEditItem] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const targetItems = useMemo(() => {
    const list: { value: string; label: string }[] = [];
    (vehicles ?? []).forEach((v: any) => list.push({ value: `vehicle:${v.id}`, label: `Véhicule neuf — ${v.name}` }));
    (usedVehicles ?? []).forEach((v: any) => list.push({ value: `used:${v.id}`, label: `Occasion — ${v.name}` }));
    (accessories ?? []).forEach((a: any) => list.push({ value: `accessory:${a.id}`, label: `Pièce — ${a.name}` }));
    return list;
  }, [vehicles, accessories, usedVehicles]);

  const priceOf = (typeId: string): number | null => {
    if (!typeId || !typeId.includes(':')) return null;
    const [t, id] = typeId.split(':');
    if (t === 'vehicle') return vehicles.find((v: any) => v.id === id)?.basePrice ?? null;
    if (t === 'used') return usedVehicles.find((v: any) => v.id === id)?.price ?? null;
    if (t === 'accessory') return accessories.find((a: any) => a.id === id)?.price ?? null;
    return null;
  };

  const targetLabel = (p: any): string => {
    if (p?.targetType === 'vehicle') return vehicles.find((v: any) => v.id === p.vehicleId)?.name ?? 'Véhicule';
    if (p?.targetType === 'used') return usedVehicles.find((v: any) => v.id === p.usedVehicleId)?.name ?? 'Occasion';
    if (p?.targetType === 'accessory') return accessories.find((a: any) => a.id === p.accessoryId)?.name ?? 'Pièce';
    return '—';
  };

  const targetValueOf = (p: any): string => {
    if (p?.targetType === 'vehicle') return `vehicle:${p.vehicleId ?? ''}`;
    if (p?.targetType === 'used') return `used:${p.usedVehicleId ?? ''}`;
    if (p?.targetType === 'accessory') return `accessory:${p.accessoryId ?? ''}`;
    return '';
  };

  const FIELDS = useMemo(() => ([
    { key: 'title', label: 'Titre de la promotion', type: 'text' as const, required: true, placeholder: 'Ex: Déstockage fin de série' },
    { key: 'target', label: 'Produit concerné', type: 'select' as const, optionItems: targetItems, required: true },
    { key: 'discountedPrice', label: 'Prix promotionnel (€ HT)', type: 'number' as const, half: true, required: true },
    { key: 'badge', label: 'Badge affiché', type: 'text' as const, half: true, placeholder: 'Offre spéciale' },
    { key: 'description', label: 'Description (optionnelle)', type: 'textarea' as const },
    { key: 'startDate', label: 'Début (optionnel)', type: 'date' as const, half: true },
    { key: 'endDate', label: 'Fin (optionnel)', type: 'date' as const, half: true },
    { key: 'featured', label: 'Mettre en avant sur l\'accueil', type: 'checkbox' as const, half: true },
    { key: 'active', label: 'Promotion active', type: 'checkbox' as const, half: true },
  ]), [targetItems]);

  const handleCreate = async (data: Record<string, any>) => {
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (res?.ok) {
        const created = await res.json();
        setItems((prev: any[]) => [created, ...prev]);
        setShowCreate(false);
        toast.success('Promotion créée');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || 'Erreur lors de la création');
      }
    } catch { toast.error('Erreur lors de la création'); }
  };

  const handleSave = async (data: Record<string, any>) => {
    if (!editItem?.id) return;
    try {
      const res = await fetch(`/api/admin/promotions/${editItem.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (res?.ok) {
        const updated = await res.json();
        setItems((prev: any[]) => prev.map((p: any) => p?.id === editItem.id ? { ...p, ...updated } : p));
        setEditItem(null);
        toast.success('Promotion mise à jour');
      } else toast.error('Erreur lors de la sauvegarde');
    } catch { toast.error('Erreur'); }
  };

  const toggleActive = async (p: any) => {
    try {
      const res = await fetch(`/api/admin/promotions/${p.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !p.active }),
      });
      if (res?.ok) {
        const updated = await res.json();
        setItems((prev: any[]) => prev.map((x: any) => x?.id === p.id ? { ...x, ...updated } : x));
      }
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteItem?.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/promotions/${deleteItem.id}`, { method: 'DELETE' });
      if (res?.ok) {
        setItems((prev: any[]) => prev.filter((p: any) => p?.id !== deleteItem.id));
        setDeleteItem(null);
        toast.success('Promotion supprimée');
      } else toast.error('Erreur lors de la suppression');
    } catch { toast.error('Erreur'); }
    setDeleting(false);
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Retour au tableau de bord
      </Link>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
            <Percent className="h-7 w-7 text-primary" /> Promotions
          </h1>
          <p className="text-muted-foreground">Créez des offres à prix réduit affichées sur les fiches produits et l'accueil.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Nouvelle promotion
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl shadow-[var(--shadow-sm)]">
          <Percent className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Aucune promotion pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((p: any) => {
            const orig = priceOf(targetValueOf(p));
            return (
              <div key={p?.id} className={`bg-card rounded-xl p-4 shadow-[var(--shadow-sm)] flex items-center gap-4 flex-wrap ${p?.active ? '' : 'opacity-60'}`}>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{p?.title}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{p?.badge}</span>
                    {p?.featured && <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 font-medium"><Star className="h-3 w-3" /> Accueil</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{targetLabel(p)}</p>
                </div>
                <div className="text-right">
                  {orig != null && orig > (p?.discountedPrice ?? 0) && (
                    <div className="text-xs text-muted-foreground line-through">{euroHT(orig)}</div>
                  )}
                  <div className="font-bold text-primary">{euroHT(p?.discountedPrice ?? 0)}</div>
                  <div className="text-[11px] text-muted-foreground">soit {euroTTC(p?.discountedPrice ?? 0)}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleActive(p)}
                    className={`p-2 rounded-lg transition-colors ${p?.active ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10' : 'text-muted-foreground hover:bg-muted'}`}
                    title={p?.active ? 'Désactiver' : 'Activer'}>
                    {p?.active ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </button>
                  <button onClick={() => setEditItem(p)} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors" title="Modifier">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteItem(p)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors" title="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EditModal open={!!editItem} onClose={() => setEditItem(null)} onSave={handleSave}
        title={`Modifier : ${editItem?.title ?? ''}`} fields={FIELDS}
        initialData={editItem ? {
          title: editItem.title,
          target: targetValueOf(editItem),
          discountedPrice: editItem.discountedPrice,
          badge: editItem.badge,
          description: editItem.description,
          startDate: editItem.startDate ? String(editItem.startDate).slice(0, 10) : '',
          endDate: editItem.endDate ? String(editItem.endDate).slice(0, 10) : '',
          featured: editItem.featured,
          active: editItem.active,
        } : {}} />
      <EditModal open={showCreate} onClose={() => setShowCreate(false)} onSave={handleCreate}
        title="Nouvelle promotion" fields={FIELDS}
        initialData={{ badge: 'Offre spéciale', active: true, featured: false }} />
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete}
        title="Supprimer cette promotion ?" message={`La promotion « ${deleteItem?.title ?? ''} » sera définitivement supprimée.`}
        confirmLabel="Supprimer" loading={deleting} />
    </div>
  );
}
