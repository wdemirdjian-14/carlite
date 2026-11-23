'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft, Search, X, Mail, Phone, Car, PhoneCall, FileText, FileSignature, MessageSquare, Archive, ArchiveRestore,
  Send, Loader2, StickyNote, History, CheckCircle2, Clock, PlayCircle, ChevronRight,
} from 'lucide-react';
import { normalize } from '@/lib/search';
import { REQUEST_STATUSES, statusLabel } from '@/lib/requests';
import { cn } from '@/lib/utils';

const TYPES: Record<string, { label: string; Icon: any }> = {
  test_drive: { label: 'Essai', Icon: Car },
  callback: { label: 'Rappel', Icon: PhoneCall },
  information: { label: 'Information', Icon: FileText },
  quote: { label: 'Devis', Icon: FileSignature },
};

const STATUS_STYLE: Record<string, { cls: string; Icon: any }> = {
  pending: { cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', Icon: Clock },
  in_progress: { cls: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300', Icon: PlayCircle },
  treated: { cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', Icon: CheckCircle2 },
  archived: { cls: 'bg-muted text-muted-foreground', Icon: Archive },
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const digits = (s?: string | null) => (s ?? '').replace(/\D/g, '');

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap', s.cls)}>
      <s.Icon className="h-3 w-3" /> {statusLabel(status)}
    </span>
  );
}

type Tab = 'open' | 'pending' | 'in_progress' | 'treated' | 'archived' | 'all';
const TABS: { key: Tab; label: string }[] = [
  { key: 'open', label: 'Actives' },
  { key: 'pending', label: 'À traiter' },
  { key: 'in_progress', label: 'En cours' },
  { key: 'treated', label: 'Traitées' },
  { key: 'archived', label: 'Archivées' },
  { key: 'all', label: 'Toutes' },
];

export function DemandesContent({ requests }: { requests: any[] }) {
  const [items, setItems] = useState<any[]>(requests ?? []);
  const [tab, setTab] = useState<Tab>('open');
  const [type, setType] = useState<string>('all');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const patchItem = (id: string, data: any) => setItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));

  // Index de recherche : identité, coordonnées (téléphone sans espaces), véhicule, message et notes
  const indexed = useMemo(
    () =>
      items.map((r) => ({
        r,
        text: normalize(
          [r.firstName, r.lastName, r.email, r.vehicleName, r.message, TYPES[r.type]?.label, ...(r.notes ?? []).map((n: any) => `${n.content} ${n.authorName}`)].join(' ')
        ),
        phone: digits(r.phone),
      })),
    [items]
  );

  const tokens = normalize(q).split(' ').filter(Boolean);
  const qDigits = digits(q);
  const matchSearch = (x: (typeof indexed)[number]) =>
    !tokens.length || tokens.every((t) => x.text.includes(t)) || (qDigits.length >= 4 && x.phone.includes(qDigits));
  const matchTab = (r: any) => (tab === 'all' ? true : tab === 'open' ? r.status !== 'archived' : r.status === tab);
  const matchType = (r: any) => type === 'all' || r.type === type;

  const filtered = indexed.filter((x) => matchSearch(x) && matchTab(x.r) && matchType(x.r)).map((x) => x.r);
  const countFor = (t: Tab) => indexed.filter((x) => matchSearch(x) && matchType(x.r) && (t === 'all' ? true : t === 'open' ? x.r.status !== 'archived' : x.r.status === t)).length;
  const selected = items.find((r) => r.id === openId) ?? null;

  // Échap ferme la fiche ; « / » donne le focus à la recherche
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
      const t = e.target as HTMLElement;
      if (e.key === '/' && t?.tagName !== 'INPUT' && t?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 sm:py-8">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/admin" className="p-2 rounded-full hover:bg-muted" aria-label="Retour"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">Demandes clients</h1>
          <p className="text-sm text-muted-foreground">
            {items.filter((r) => r.status === 'pending').length} à traiter · {items.filter((r) => r.status === 'in_progress').length} en cours · {items.length} au total
          </p>
        </div>
      </div>

      {/* Recherche */}
      <label className="flex items-center gap-2 h-12 px-4 rounded-2xl bg-card border border-border focus-within:ring-2 focus-within:ring-brand">
        <Search className="h-5 w-5 text-muted-foreground shrink-0" />
        <input
          ref={searchRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nom, email, téléphone, véhicule, mot du message ou d’une note…"
          className="flex-1 min-w-0 bg-transparent outline-none text-base"
          aria-label="Rechercher une demande"
        />
        {q && <button onClick={() => setQ('')} className="p-1 rounded-full hover:bg-muted" aria-label="Effacer"><X className="h-4 w-4" /></button>}
      </label>

      {/* Statuts */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mt-4 -mx-4 px-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn('shrink-0 h-9 px-4 rounded-full text-sm font-medium border', tab === t.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-foreground/30')}
          >
            {t.label} <span className="opacity-60 text-xs ml-0.5">{countFor(t.key)}</span>
          </button>
        ))}
      </div>
      {/* Types */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mt-2 -mx-4 px-4">
        {[{ key: 'all', label: 'Tous types' }, ...Object.entries(TYPES).map(([key, v]) => ({ key, label: v.label }))].map((t) => (
          <button
            key={t.key}
            onClick={() => setType(t.key)}
            className={cn('shrink-0 h-8 px-3 rounded-full text-xs font-medium', type === t.key ? 'bg-brand text-brand-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="mt-5 space-y-2">
        {filtered.map((r) => {
          const T = TYPES[r.type] ?? TYPES.information;
          const notes = (r.notes ?? []).filter((n: any) => n.kind === 'note');
          const last = notes[notes.length - 1];
          return (
            <button
              key={r.id}
              onClick={() => setOpenId(r.id)}
              className={cn('w-full text-left flex items-start gap-3 p-4 rounded-2xl bg-card border hover:border-foreground/30 transition-colors', openId === r.id ? 'border-foreground/40' : 'border-border', r.status === 'archived' && 'opacity-70')}
            >
              <span className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center"><T.Icon className="h-4 w-4" /></span>
              <span className="flex-1 min-w-0">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold">{r.firstName} {r.lastName}</span>
                  <StatusPill status={r.status} />
                  <span className="text-xs text-muted-foreground">{T.label}</span>
                </span>
                <span className="block text-sm text-muted-foreground truncate mt-0.5">
                  {[r.phone, r.email, r.vehicleName].filter(Boolean).join(' · ')}
                </span>
                {last ? (
                  <span className="flex items-center gap-1.5 text-xs mt-1.5 text-foreground/80 truncate">
                    <StickyNote className="h-3.5 w-3.5 shrink-0 text-brand-strong" />
                    <span className="truncate">{last.content}</span>
                  </span>
                ) : (
                  r.message && <span className="block text-xs mt-1.5 text-muted-foreground truncate">{r.message.replace(/\s+/g, ' ')}</span>
                )}
              </span>
              <span className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                {notes.length > 0 && <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-muted">{notes.length} note{notes.length > 1 ? 's' : ''}</span>}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-14 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
            {q ? `Aucune demande ne correspond à « ${q} ».` : 'Aucune demande dans cette vue.'}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && <RequestPanel key={selected.id} r={selected} onClose={() => setOpenId(null)} onChange={(data) => patchItem(selected.id, data)} />}
      </AnimatePresence>
    </div>
  );
}

function RequestPanel({ r, onClose, onChange }: { r: any; onClose: () => void; onChange: (data: any) => void }) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyStatus, setBusyStatus] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const T = TYPES[r.type] ?? TYPES.information;
  const log: any[] = r.notes ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [log.length]);
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const setStatus = async (status: string) => {
    setBusyStatus(status);
    try {
      const res = await fetch(`/api/admin/requests/${r.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      onChange({ status: data.status, notes: data.notes, archivedAt: data.archivedAt, archivedBy: data.archivedBy });
      toast.success(status === 'archived' ? 'Demande archivée' : `Statut : ${statusLabel(status)}`);
    } catch (e: any) {
      toast.error(e?.message || 'Erreur');
    }
    setBusyStatus(null);
  };

  const addNote = async () => {
    const content = note.trim();
    if (!content || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/requests/${r.id}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      onChange({ notes: data.notes, status: data.status });
      setNote('');
      toast.success('Note ajoutée');
    } catch (e: any) {
      toast.error(e?.message || 'Erreur');
    }
    setSaving(false);
  };

  return (
    <motion.div className="fixed inset-0 z-[80]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 40 }}
        className="absolute inset-y-0 right-0 w-full sm:max-w-xl bg-background shadow-2xl flex flex-col"
        role="dialog"
        aria-label={`Demande de ${r.firstName} ${r.lastName}`}
      >
        {/* En-tête */}
        <div className="p-4 sm:p-5 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-extrabold tracking-tight">{r.firstName} {r.lastName}</h2>
                <StatusPill status={r.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5"><T.Icon className="h-3.5 w-3.5" /> {T.label} · reçue le {fmtDate(r.createdAt)}</p>
            </div>
            <button onClick={onClose} className="p-2 -m-1 rounded-full hover:bg-muted" aria-label="Fermer"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {r.phone && <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-primary text-primary-foreground text-sm font-medium"><Phone className="h-4 w-4" /> {r.phone}</a>}
            {r.email && <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border text-sm font-medium max-w-full"><Mail className="h-4 w-4 shrink-0" /> <span className="truncate">{r.email}</span></a>}
          </div>
          {/* Statut */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {REQUEST_STATUSES.filter((s) => s.value !== 'archived').map((s) => (
              <button
                key={s.value}
                disabled={!!busyStatus || r.status === s.value}
                onClick={() => setStatus(s.value)}
                className={cn('h-8 px-3 rounded-full text-xs font-medium border transition-colors', r.status === s.value ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-muted', busyStatus === s.value && 'opacity-60')}
              >
                {s.label}
              </button>
            ))}
            {r.status === 'archived' ? (
              <button disabled={!!busyStatus} onClick={() => setStatus('treated')} className="ml-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold border border-border hover:bg-muted">
                <ArchiveRestore className="h-3.5 w-3.5" /> Désarchiver
              </button>
            ) : (
              <button disabled={!!busyStatus} onClick={() => setStatus('archived')} className="ml-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold bg-brand text-brand-foreground">
                <Archive className="h-3.5 w-3.5" /> Traitée, archiver
              </button>
            )}
          </div>
          {r.status === 'archived' && r.archivedAt && (
            <p className="text-xs text-muted-foreground mt-2">Archivée le {fmtDate(r.archivedAt)}{r.archivedBy ? ` par ${r.archivedBy}` : ''}</p>
          )}
        </div>

        {/* Message + journal */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {(r.vehicleName || r.message) && (
            <div className="rounded-2xl bg-muted p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Demande du client</p>
              {r.vehicleName && <p className="text-sm font-semibold mb-1 flex items-center gap-1.5"><Car className="h-4 w-4" /> {r.vehicleName}</p>}
              {r.message && <p className="text-sm whitespace-pre-line">{r.message}</p>}
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5"><History className="h-3.5 w-3.5" /> Suivi ({log.filter((n) => n.kind === 'note').length} note{log.filter((n) => n.kind === 'note').length > 1 ? 's' : ''})</p>
            {log.length === 0 && <p className="text-sm text-muted-foreground">Aucune note pour l’instant. Ajoutez la première ci-dessous.</p>}
            <ol className="relative border-l-2 border-border ml-2 space-y-4">
              {log.map((n) =>
                n.kind === 'status' ? (
                  <li key={n.id} className="pl-4 relative">
                    <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-border" />
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">{n.content}</span> · {n.authorName} · {fmtDate(n.createdAt)}
                    </p>
                  </li>
                ) : (
                  <li key={n.id} className="pl-4 relative">
                    <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-brand-strong" />
                    <div className="rounded-2xl border border-border bg-card p-3">
                      <p className="text-sm whitespace-pre-line">{n.content}</p>
                      <p className="text-[11px] text-muted-foreground mt-2" title={n.authorEmail}>
                        {n.authorName} · {fmtDate(n.createdAt)}
                      </p>
                    </div>
                  </li>
                )
              )}
            </ol>
            <div ref={endRef} />
          </div>
        </div>

        {/* Saisie d'une note */}
        <div className="p-3 sm:p-4 border-t border-border pb-safe">
          <div className="flex items-end gap-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  addNote();
                }
              }}
              rows={2}
              maxLength={5000}
              placeholder="Ajouter une note (appel passé, devis envoyé, relance prévue…)"
              className="flex-1 px-4 py-3 rounded-2xl border border-input bg-background text-base sm:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <button
              onClick={addNote}
              disabled={!note.trim() || saving}
              className="h-12 w-12 shrink-0 rounded-2xl bg-brand text-brand-foreground flex items-center justify-center disabled:opacity-40"
              aria-label="Ajouter la note"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 px-1">Datée et signée automatiquement · non modifiable · Ctrl/⌘ + Entrée pour envoyer</p>
        </div>
      </motion.aside>
    </motion.div>
  );
}
