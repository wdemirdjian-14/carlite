'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Check, Clock, ArrowLeft, Mail, Phone, User, Car, PhoneCall, FileText, FileSignature } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const TYPE_BADGES: Record<string, { label: string; color: string; icon: any }> = {
  test_drive: { label: 'Essai', color: 'bg-primary/10 text-primary', icon: Car },
  callback: { label: 'Rappel', color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400', icon: PhoneCall },
  information: { label: 'Information', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', icon: FileText },
  quote: { label: 'Devis', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400', icon: FileSignature },
};

export function DemandesContent({ requests }: { requests: any[] }) {
  const [items, setItems] = useState(requests ?? []);
  const [filter, setFilter] = useState<string>('all');

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res?.ok) {
        setItems((prev: any[]) => prev?.map?.((r: any) => r?.id === id ? { ...(r ?? {}), status } : r) ?? []);
        toast?.success?.('Statut mis à jour');
      }
    } catch {
      toast?.error?.('Erreur');
    }
  };

  const filtered = filter === 'all' ? items : filter === 'pending' ? items.filter((r: any) => r?.status === 'pending') : items.filter((r: any) => r?.type === filter);
  const pendingCount = items.filter((r: any) => r?.status === 'pending').length;
  const callbackCount = items.filter((r: any) => r?.type === 'callback').length;
  const quoteCount = items.filter((r: any) => r?.type === 'quote').length;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="p-2 rounded-lg hover:bg-muted transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Demandes clients</h1>
          <p className="text-sm text-muted-foreground">{items?.length ?? 0} demande(s) • {pendingCount} en attente</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: `Toutes (${items.length})` },
          { key: 'pending', label: `En attente (${pendingCount})` },
          { key: 'callback', label: `Rappels (${callbackCount})` },
          { key: 'quote', label: `Devis (${quoteCount})` },
          { key: 'test_drive', label: 'Essais' },
          { key: 'information', label: 'Informations' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === tab.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {(filtered ?? []).map((r: any, i: number) => {
          const badge = TYPE_BADGES[r?.type] ?? TYPE_BADGES.information;
          const BadgeIcon = badge?.icon ?? FileText;
          return (
          <motion.div
            key={r?.id ?? i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="bg-card rounded-xl p-5 shadow-[var(--shadow-sm)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{r?.firstName ?? ''} {r?.lastName ? ` ${r.lastName}` : ''}</span>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${badge?.color}`}>
                    <BadgeIcon className="h-3 w-3" /> {badge?.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {r?.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {r.email}</span>}
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {r?.phone ?? ''}</span>
                  {r?.vehicleName && <span className="flex items-center gap-1"><Car className="h-3 w-3" /> {r.vehicleName}</span>}
                </div>
                {r?.message && <p className="text-sm text-muted-foreground whitespace-pre-line bg-muted/40 rounded-lg px-3 py-2">{r.message}</p>}
                <div className="text-xs text-muted-foreground">
                  {r?.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {r?.status === 'pending' ? (
                  <>
                    <span className="flex items-center gap-1 text-xs text-orange-500"><Clock className="h-3 w-3" /> En attente</span>
                    <button onClick={() => updateStatus(r?.id, 'treated')} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors">
                      <Check className="h-3 w-3 inline mr-1" /> Traité
                    </button>
                  </>
                ) : (
                  <button onClick={() => updateStatus(r?.id, 'pending')} className="flex items-center gap-1 text-xs text-green-600 hover:text-orange-500 transition-colors px-2 py-1 rounded-lg hover:bg-muted" title="Remettre en attente">
                    <Check className="h-3 w-3" /> Traité
                  </button>
                )}
              </div>
            </div>
          </motion.div>
          );
        })}
        {(filtered?.length ?? 0) === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            Aucune demande pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}
