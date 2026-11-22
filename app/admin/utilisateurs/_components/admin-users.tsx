'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Shield, ShieldCheck, User, Pencil, Trash2, Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  admin: { label: 'Administrateur', color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400', icon: ShieldCheck },
  editor: { label: 'Éditeur', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', icon: Shield },
  user: { label: 'Utilisateur', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: User },
};

export function AdminUsers({ users, currentUserId }: { users: any[]; currentUserId: string }) {
  const [items, setItems] = useState(users ?? []);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'editor' });
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    if (!form?.email?.trim() || !form?.password?.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res?.ok) {
        const created = await res.json();
        setItems((prev: any[]) => [created, ...prev]);
        setShowCreate(false);
        setForm({ name: '', email: '', password: '', role: 'editor' });
        toast.success('Utilisateur créé avec succès');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || 'Erreur lors de la création');
      }
    } catch {
      toast.error('Erreur lors de la création');
    }
    setSaving(false);
  };

  const handleUpdateRole = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole }),
      });
      if (res?.ok) {
        const updated = await res.json();
        setItems((prev: any[]) => prev.map((u: any) => u?.id === id ? { ...u, ...updated } : u));
        setEditingId(null);
        toast.success('Rôle mis à jour');
      }
    } catch {
      toast.error('Erreur');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer l'utilisateur ${name} ?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res?.ok) {
        setItems((prev: any[]) => prev.filter((u: any) => u?.id !== id));
        toast.success('Utilisateur supprimé');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur');
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-lg hover:bg-muted transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Utilisateurs</h1>
            <p className="text-sm text-muted-foreground">{items?.length ?? 0} utilisateur(s)</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-md">
          <Plus className="h-4 w-4" /> Nouvel utilisateur
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-6 shadow-[var(--shadow-md)] mb-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold">Nouvel utilisateur</h2>
            <button onClick={() => setShowCreate(false)} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Nom</label>
              <input type="text" value={form?.name ?? ''} onChange={(e) => setForm({ ...form, name: e?.target?.value ?? '' })} placeholder="Jean Dupont" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Email *</label>
              <input type="email" value={form?.email ?? ''} onChange={(e) => setForm({ ...form, email: e?.target?.value ?? '' })} placeholder="email@exemple.fr" required className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Mot de passe *</label>
              <input type="password" value={form?.password ?? ''} onChange={(e) => setForm({ ...form, password: e?.target?.value ?? '' })} placeholder="••••••••" required className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Rôle</label>
              <select value={form?.role ?? 'editor'} onChange={(e) => setForm({ ...form, role: e?.target?.value ?? 'editor' })} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="admin">Administrateur</option>
                <option value="editor">Éditeur</option>
                <option value="user">Utilisateur</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm hover:bg-muted transition-colors">Annuler</button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Créer
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Users list */}
      <div className="space-y-3">
        {(items ?? []).map((u: any, i: number) => {
          const roleInfo = ROLE_LABELS[u?.role] ?? ROLE_LABELS.user;
          const RoleIcon = roleInfo?.icon ?? User;
          const isCurrentUser = u?.id === currentUserId;

          return (
            <motion.div
              key={u?.id ?? i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-card rounded-xl p-5 shadow-[var(--shadow-sm)] flex flex-wrap items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <RoleIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{u?.name || u?.email}</div>
                <div className="text-sm text-muted-foreground">{u?.email}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Créé le {new Date(u?.createdAt).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {editingId === u?.id ? (
                  <div className="flex items-center gap-2">
                    <select value={editRole} onChange={(e) => setEditRole(e?.target?.value)} className="px-2 py-1 rounded-lg border border-input bg-background text-xs">
                      <option value="admin">Admin</option>
                      <option value="editor">Éditeur</option>
                      <option value="user">Utilisateur</option>
                    </select>
                    <button onClick={() => handleUpdateRole(u?.id)} className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"><Save className="h-3 w-3" /></button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg hover:bg-muted"><X className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleInfo?.color}`}>
                      {roleInfo?.label}
                    </span>
                    {!isCurrentUser && (
                      <>
                        <button
                          onClick={() => { setEditingId(u?.id); setEditRole(u?.role ?? 'user'); }}
                          className="p-2 rounded-lg hover:bg-muted transition-colors text-blue-600 dark:text-blue-400"
                          title="Modifier le rôle"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u?.id, u?.name || u?.email)}
                          className="p-2 rounded-lg hover:bg-muted transition-colors text-red-600 dark:text-red-400"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {isCurrentUser && (
                      <span className="text-xs text-muted-foreground italic">Vous</span>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
        {(items?.length ?? 0) === 0 && (
          <div className="text-center py-12 text-muted-foreground">Aucun utilisateur.</div>
        )}
      </div>
    </div>
  );
}
