'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Settings2, ExternalLink,
  Palette, Package, Battery, Sofa, Wrench, Settings, Zap, ShieldCheck, GitBranch, ListChecks,
  LayoutTemplate, X, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { EditModal } from '@/components/admin/edit-modal';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { CONFIG_TEMPLATES } from '@/lib/config-templates';

const ICON_MAP: Record<string, any> = { Palette, Package, Battery, Sofa, Wrench, Settings, Zap, ShieldCheck };

const ICON_ITEMS = [
  { value: '', label: 'Aucune' },
  { value: 'Palette', label: 'Palette (couleur)' },
  { value: 'Package', label: 'Colis (options)' },
  { value: 'Battery', label: 'Batterie' },
  { value: 'Sofa', label: 'Confort' },
  { value: 'Wrench', label: 'Technique / montage' },
  { value: 'Settings', label: 'Réglages' },
  { value: 'Zap', label: 'Énergie' },
  { value: 'ShieldCheck', label: 'Sécurité' },
];

const SELECTION_ITEMS = [
  { value: 'radio', label: 'Choix unique (boutons)' },
  { value: 'checkbox', label: 'Choix multiple (cases à cocher)' },
  { value: 'dropdown', label: 'Liste déroulante' },
];
const SELECTION_LABEL: Record<string, string> = { radio: 'Choix unique', checkbox: 'Choix multiple', dropdown: 'Liste déroulante' };

const RULE_TYPE_ITEMS = [
  { value: 'requires', label: 'Rend obligatoire (si A choisi → B obligatoire)' },
  { value: 'incompatible', label: 'Incompatible (A et B ne peuvent coexister)' },
  { value: 'show', label: 'Afficher B uniquement si A est choisi' },
  { value: 'hide', label: 'Masquer B si A est choisi' },
];
const RULE_TYPE_LABEL: Record<string, string> = {
  requires: 'rend obligatoire', incompatible: 'incompatible avec', show: 'affiche', hide: 'masque',
};

const CATEGORY_FIELDS = [
  { key: 'name', label: 'Nom de la catégorie', type: 'text' as const, placeholder: 'Couleur, Batterie, Confort, Accessoires…' },
  { key: 'selectionType', label: 'Type de sélection', type: 'select' as const, half: true, optionItems: SELECTION_ITEMS },
  { key: 'icon', label: 'Icône (facultatif)', type: 'select' as const, half: true, optionItems: ICON_ITEMS },
  { key: 'required', label: 'Catégorie obligatoire', type: 'checkbox' as const },
  { key: 'description', label: 'Description (facultatif)', type: 'textarea' as const },
];

const OPTION_FIELDS = [
  { key: 'name', label: "Nom de l'option", type: 'text' as const, half: true },
  { key: 'priceModifier', label: 'Supplément de prix (€, + ou –)', type: 'number' as const, half: true },
  { key: 'colorHex', label: 'Couleur (hex – pour carrosserie, facultatif)', type: 'text' as const, half: true, placeholder: '#16A34A' },
  { key: 'active', label: 'Disponible (activée)', type: 'checkbox' as const, half: true },
  { key: 'description', label: 'Description (facultatif)', type: 'textarea' as const },
  { key: 'imageUrl', label: 'Image (facultatif)', type: 'image' as const },
];

export function ConfigManager({ vehicle }: { vehicle: any }) {
  const vehicleId = vehicle?.id;
  const [cats, setCats] = useState<any[]>(() =>
    [...(vehicle?.configCategories ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  );
  const [rules, setRules] = useState<any[]>(vehicle?.configRules ?? []);

  const [editCat, setEditCat] = useState<any>(null);
  const [showNewCat, setShowNewCat] = useState(false);
  const [delCat, setDelCat] = useState<any>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [applyingKey, setApplyingKey] = useState<string | null>(null);

  const [optCtx, setOptCtx] = useState<{ categoryId: string } | null>(null); // new option context
  const [editOpt, setEditOpt] = useState<any>(null);
  const [delOpt, setDelOpt] = useState<any>(null);

  const [editRule, setEditRule] = useState<any>(null);
  const [showNewRule, setShowNewRule] = useState(false);
  const [delRule, setDelRule] = useState<any>(null);

  const [busy, setBusy] = useState(false);

  // Flat list of all options for rule dropdowns + labels
  const allOptionItems = useMemo(() => {
    const items: { value: string; label: string }[] = [];
    for (const c of cats) for (const o of (c.options ?? [])) items.push({ value: o.id, label: `${c.name} › ${o.name}` });
    return items;
  }, [cats]);
  const optionLabel = (id: string) => allOptionItems.find((i) => i.value === id)?.label ?? '(option supprimée)';

  const sortCats = (arr: any[]) => [...arr].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const sortOpts = (arr: any[]) => [...arr].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // ---------- CATEGORIES ----------
  const createCat = async (data: any) => {
    try {
      const res = await fetch('/api/admin/config-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, vehicleId }) });
      if (res.ok) { const c = await res.json(); setCats((p) => sortCats([...p, { ...c, options: c.options ?? [] }])); setShowNewCat(false); toast.success('Catégorie ajoutée'); }
      else toast.error('Erreur');
    } catch { toast.error('Erreur'); }
  };
  const applyTemplate = async (tpl: typeof CONFIG_TEMPLATES[number]) => {
    if (applyingKey) return;
    setApplyingKey(tpl.key);
    try {
      // 1. Créer la catégorie
      const catRes = await fetch('/api/admin/config-categories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId, name: tpl.label, icon: tpl.icon, description: tpl.description ?? '', selectionType: tpl.selectionType, required: !!tpl.required }),
      });
      if (!catRes.ok) throw new Error('cat');
      const cat = await catRes.json();
      // 2. Créer les options une par une
      const createdOptions: any[] = [];
      for (let i = 0; i < tpl.options.length; i++) {
        const o = tpl.options[i];
        const optRes = await fetch('/api/admin/config-options', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryId: cat.id, name: o.name, priceModifier: o.priceModifier ?? 0, colorHex: o.colorHex ?? '', description: o.description ?? '', active: true, order: i }),
        });
        if (optRes.ok) createdOptions.push(await optRes.json());
      }
      setCats((p) => sortCats([...p, { ...cat, options: sortOpts(createdOptions) }]));
      toast.success(`Modèle « ${tpl.label} » ajouté (${createdOptions.length} option(s))`);
    } catch {
      toast.error('Erreur lors de l\'ajout du modèle');
    }
    setApplyingKey(null);
  };

  const saveCat = async (data: any) => {
    if (!editCat?.id) return;
    try {
      const res = await fetch(`/api/admin/config-categories/${editCat.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) { const c = await res.json(); setCats((p) => sortCats(p.map((x) => x.id === c.id ? { ...c, options: x.options ?? c.options ?? [] } : x))); setEditCat(null); toast.success('Catégorie mise à jour'); }
      else toast.error('Erreur');
    } catch { toast.error('Erreur'); }
  };
  const removeCat = async () => {
    if (!delCat?.id) return; setBusy(true);
    try {
      const res = await fetch(`/api/admin/config-categories/${delCat.id}`, { method: 'DELETE' });
      if (res.ok) { setCats((p) => p.filter((x) => x.id !== delCat.id)); setDelCat(null); toast.success('Catégorie supprimée'); }
      else toast.error('Erreur');
    } catch { toast.error('Erreur'); }
    setBusy(false);
  };
  const moveCat = async (idx: number, dir: -1 | 1) => {
    const arr = sortCats(cats);
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    const a = arr[idx], b = arr[j];
    const ao = a.order ?? idx, bo = b.order ?? j;
    setCats((prev) => sortCats(prev.map((x) => x.id === a.id ? { ...x, order: bo } : x.id === b.id ? { ...x, order: ao } : x)));
    try {
      await Promise.all([
        fetch(`/api/admin/config-categories/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: bo }) }),
        fetch(`/api/admin/config-categories/${b.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: ao }) }),
      ]);
    } catch { toast.error('Erreur de réorganisation'); }
  };

  // ---------- OPTIONS ----------
  const createOpt = async (data: any) => {
    if (!optCtx?.categoryId) return;
    try {
      const res = await fetch('/api/admin/config-options', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, categoryId: optCtx.categoryId }) });
      if (res.ok) { const o = await res.json(); setCats((p) => p.map((c) => c.id === optCtx.categoryId ? { ...c, options: sortOpts([...(c.options ?? []), o]) } : c)); setOptCtx(null); toast.success('Option ajoutée'); }
      else toast.error('Erreur');
    } catch { toast.error('Erreur'); }
  };
  const saveOpt = async (data: any) => {
    if (!editOpt?.id) return;
    try {
      const res = await fetch(`/api/admin/config-options/${editOpt.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) { const o = await res.json(); setCats((p) => p.map((c) => c.id === o.categoryId ? { ...c, options: sortOpts((c.options ?? []).map((x: any) => x.id === o.id ? o : x)) } : c)); setEditOpt(null); toast.success('Option mise à jour'); }
      else toast.error('Erreur');
    } catch { toast.error('Erreur'); }
  };
  const removeOpt = async () => {
    if (!delOpt?.id) return; setBusy(true);
    try {
      const res = await fetch(`/api/admin/config-options/${delOpt.id}`, { method: 'DELETE' });
      if (res.ok) { setCats((p) => p.map((c) => ({ ...c, options: (c.options ?? []).filter((x: any) => x.id !== delOpt.id) }))); setDelOpt(null); toast.success('Option supprimée'); }
      else toast.error('Erreur');
    } catch { toast.error('Erreur'); }
    setBusy(false);
  };
  const moveOpt = async (cat: any, idx: number, dir: -1 | 1) => {
    const arr = sortOpts(cat.options ?? []);
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    const a = arr[idx], b = arr[j];
    const ao = a.order ?? idx, bo = b.order ?? j;
    setCats((prev) => prev.map((c) => c.id !== cat.id ? c : { ...c, options: sortOpts((c.options ?? []).map((x: any) => x.id === a.id ? { ...x, order: bo } : x.id === b.id ? { ...x, order: ao } : x)) }));
    try {
      await Promise.all([
        fetch(`/api/admin/config-options/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: bo }) }),
        fetch(`/api/admin/config-options/${b.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: ao }) }),
      ]);
    } catch { toast.error('Erreur de réorganisation'); }
  };

  // ---------- RULES ----------
  const RULE_FIELDS = [
    { key: 'ruleType', label: 'Type de règle', type: 'select' as const, optionItems: RULE_TYPE_ITEMS },
    { key: 'triggerOptionId', label: 'Option déclencheur (A)', type: 'select' as const, half: true, optionItems: allOptionItems },
    { key: 'targetOptionId', label: 'Option cible (B)', type: 'select' as const, half: true, optionItems: allOptionItems },
    { key: 'message', label: 'Message explicatif (facultatif)', type: 'textarea' as const, placeholder: 'Ex : Cette combinaison n’est pas disponible.' },
  ];
  const createRule = async (data: any) => {
    if (!data?.triggerOptionId || !data?.targetOptionId) { toast.error('Choisissez les deux options'); return; }
    try {
      const res = await fetch('/api/admin/config-rules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, vehicleId }) });
      if (res.ok) { const r = await res.json(); setRules((p) => [...p, r]); setShowNewRule(false); toast.success('Règle ajoutée'); }
      else toast.error('Erreur');
    } catch { toast.error('Erreur'); }
  };
  const saveRule = async (data: any) => {
    if (!editRule?.id) return;
    try {
      const res = await fetch(`/api/admin/config-rules/${editRule.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) { const r = await res.json(); setRules((p) => p.map((x) => x.id === r.id ? r : x)); setEditRule(null); toast.success('Règle mise à jour'); }
      else toast.error('Erreur');
    } catch { toast.error('Erreur'); }
  };
  const removeRule = async () => {
    if (!delRule?.id) return; setBusy(true);
    try {
      const res = await fetch(`/api/admin/config-rules/${delRule.id}`, { method: 'DELETE' });
      if (res.ok) { setRules((p) => p.filter((x) => x.id !== delRule.id)); setDelRule(null); toast.success('Règle supprimée'); }
      else toast.error('Erreur');
    } catch { toast.error('Erreur'); }
    setBusy(false);
  };

  const orderedCats = sortCats(cats);

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Link href="/admin/vehicules" className="p-2 rounded-lg hover:bg-muted transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2"><Settings2 className="h-5 w-5 text-green-600" /> Configurateur – {vehicle?.name}</h1>
            <p className="text-sm text-muted-foreground">Créez librement vos catégories, options et règles de compatibilité.</p>
          </div>
        </div>
        <Link href={`/configurateur?vehicule=${vehicle?.slug}`} target="_blank" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm font-medium hover:bg-muted/70">
          <ExternalLink className="h-4 w-4" /> Aperçu
        </Link>
      </div>

      {/* Status banner */}
      <div className={`rounded-xl p-4 mb-6 text-sm ${vehicle?.hasConfigurator ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400' : 'bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400'}`}>
        {vehicle?.hasConfigurator
          ? 'Le configurateur est activé pour ce véhicule et apparaît sur la page publique.'
          : 'Le configurateur est désactivé. Activez-le via la fiche véhicule (case « Activer le configurateur ») pour l’afficher au public.'}
        {vehicle?.montageAvailable && <span className="block mt-1">Option montage active : {vehicle?.montageLabel} (+{(vehicle?.montagePrice ?? 0)?.toLocaleString?.('fr-FR')} €)</span>}
      </div>

      {/* CATEGORIES */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold flex items-center gap-2"><ListChecks className="h-4 w-4 text-green-600" /> Catégories de configuration ({orderedCats.length})</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowTemplates(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-600 text-green-700 dark:text-green-400 text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/10"><LayoutTemplate className="h-4 w-4" /> Ajouter depuis un modèle</button>
            <button onClick={() => setShowNewCat(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"><Plus className="h-4 w-4" /> Catégorie</button>
          </div>
        </div>

        {orderedCats.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center bg-card rounded-xl">Aucune catégorie. Créez-en une pour commencer à construire le configurateur.</p>}

        <div className="space-y-5">
          {orderedCats.map((cat, ci) => {
            const Icon = ICON_MAP[cat.icon] ?? Package;
            const opts = sortOpts(cat.options ?? []);
            return (
              <div key={cat.id} className="bg-card rounded-xl shadow-[var(--shadow-sm)] overflow-hidden">
                <div className="flex items-center gap-3 p-4 border-b border-border">
                  <div className="flex flex-col">
                    <button onClick={() => moveCat(ci, -1)} disabled={ci === 0} className="p-0.5 disabled:opacity-30 hover:text-primary"><ChevronUp className="h-4 w-4" /></button>
                    <button onClick={() => moveCat(ci, 1)} disabled={ci === orderedCats.length - 1} className="p-0.5 disabled:opacity-30 hover:text-primary"><ChevronDown className="h-4 w-4" /></button>
                  </div>
                  <Icon className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate flex items-center gap-2">
                      {cat.name}
                      {cat.required && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/20 text-red-600">obligatoire</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{SELECTION_LABEL[cat.selectionType] ?? cat.selectionType} • {opts.length} option(s)</div>
                  </div>
                  <button onClick={() => setOptCtx({ categoryId: cat.id })} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted text-xs font-medium hover:bg-muted/70"><Plus className="h-3.5 w-3.5" /> Option</button>
                  <button onClick={() => setEditCat(cat)} className="p-1.5 rounded-lg hover:bg-muted text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDelCat(cat)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>

                <div className="p-3 grid sm:grid-cols-2 gap-2">
                  {opts.map((o: any, oi: number) => (
                    <div key={o.id} className={`rounded-lg p-2.5 flex items-center gap-2.5 border ${o.active ? 'border-border bg-background' : 'border-dashed border-border bg-muted/40 opacity-70'}`}>
                      <div className="flex flex-col">
                        <button onClick={() => moveOpt(cat, oi, -1)} disabled={oi === 0} className="p-0.5 disabled:opacity-30 hover:text-primary"><ChevronUp className="h-3.5 w-3.5" /></button>
                        <button onClick={() => moveOpt(cat, oi, 1)} disabled={oi === opts.length - 1} className="p-0.5 disabled:opacity-30 hover:text-primary"><ChevronDown className="h-3.5 w-3.5" /></button>
                      </div>
                      {o.colorHex ? (
                        <div className="w-9 h-9 rounded-full border-2 border-border flex-shrink-0" style={{ backgroundColor: o.colorHex }} />
                      ) : (
                        <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {o.imageUrl ? <Image src={o.imageUrl} alt={o.name} fill className="object-cover" /> : <div className="flex items-center justify-center h-full"><Package className="h-4 w-4 text-muted-foreground" /></div>}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{o.name}{!o.active && <span className="ml-1 text-[10px] text-muted-foreground">(inactive)</span>}</div>
                        <div className="text-xs text-muted-foreground">{(o.priceModifier ?? 0) === 0 ? 'Inclus' : `${o.priceModifier > 0 ? '+' : ''}${(o.priceModifier ?? 0).toLocaleString('fr-FR')} €`}</div>
                      </div>
                      <button onClick={() => setEditOpt(o)} className="p-1.5 rounded-lg hover:bg-muted text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDelOpt(o)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                  {opts.length === 0 && <p className="text-xs text-muted-foreground col-span-2 py-3 text-center">Aucune option. Ajoutez-en une.</p>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* RULES */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold flex items-center gap-2"><GitBranch className="h-4 w-4 text-green-600" /> Règles de compatibilité ({rules.length})</h2>
          <button onClick={() => { if (allOptionItems.length < 2) { toast.error('Créez au moins deux options d’abord'); return; } setShowNewRule(true); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"><Plus className="h-4 w-4" /> Règle</button>
        </div>
        <div className="space-y-2">
          {rules.map((r) => (
            <div key={r.id} className="bg-card rounded-xl p-3 shadow-[var(--shadow-sm)] flex items-center gap-3">
              <div className="flex-1 min-w-0 text-sm">
                <span className="font-medium">{optionLabel(r.triggerOptionId)}</span>
                <span className="text-muted-foreground"> {RULE_TYPE_LABEL[r.ruleType] ?? r.ruleType} </span>
                <span className="font-medium">{optionLabel(r.targetOptionId)}</span>
                {r.message && <div className="text-xs text-muted-foreground italic mt-0.5">« {r.message} »</div>}
              </div>
              <button onClick={() => setEditRule(r)} className="p-1.5 rounded-lg hover:bg-muted text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={() => setDelRule(r)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          {rules.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center bg-card rounded-xl">Aucune règle. Les règles sont facultatives.</p>}
        </div>
      </section>

      {/* MODALS */}
      <EditModal open={showNewCat} onClose={() => setShowNewCat(false)} onSave={createCat} title="Nouvelle catégorie" fields={CATEGORY_FIELDS} initialData={{ selectionType: 'radio', icon: '', required: false }} />
      <EditModal open={!!editCat} onClose={() => setEditCat(null)} onSave={saveCat} title="Modifier la catégorie" fields={CATEGORY_FIELDS} initialData={editCat ?? {}} />
      <EditModal open={!!optCtx} onClose={() => setOptCtx(null)} onSave={createOpt} title="Nouvelle option" fields={OPTION_FIELDS} initialData={{ priceModifier: 0, active: true, colorHex: '' }} />
      <EditModal open={!!editOpt} onClose={() => setEditOpt(null)} onSave={saveOpt} title="Modifier l'option" fields={OPTION_FIELDS} initialData={editOpt ?? {}} />
      <EditModal open={showNewRule} onClose={() => setShowNewRule(false)} onSave={createRule} title="Nouvelle règle" fields={RULE_FIELDS} initialData={{ ruleType: 'incompatible', triggerOptionId: allOptionItems[0]?.value ?? '', targetOptionId: allOptionItems[1]?.value ?? '' }} />
      <EditModal open={!!editRule} onClose={() => setEditRule(null)} onSave={saveRule} title="Modifier la règle" fields={RULE_FIELDS} initialData={editRule ?? {}} />
      <ConfirmDialog open={!!delCat} onClose={() => setDelCat(null)} onConfirm={removeCat} title="Supprimer cette catégorie ?" message={`« ${delCat?.name ?? ''} » et toutes ses options seront supprimées.`} confirmLabel="Supprimer" loading={busy} />
      <ConfirmDialog open={!!delOpt} onClose={() => setDelOpt(null)} onConfirm={removeOpt} title="Supprimer cette option ?" message={`« ${delOpt?.name ?? ''} » sera supprimée.`} confirmLabel="Supprimer" loading={busy} />
      <ConfirmDialog open={!!delRule} onClose={() => setDelRule(null)} onConfirm={removeRule} title="Supprimer cette règle ?" message="Cette règle de compatibilité sera supprimée." confirmLabel="Supprimer" loading={busy} />

      {/* TEMPLATE PICKER */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !applyingKey && setShowTemplates(false)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden z-10 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="font-display text-lg font-bold flex items-center gap-2"><LayoutTemplate className="h-5 w-5 text-green-600" /> Modèles de catégorie</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Ajoutez une catégorie pré-remplie en un clic. Vous pourrez ensuite modifier ou retirer les options.</p>
              </div>
              <button onClick={() => !applyingKey && setShowTemplates(false)} className="p-2 rounded-lg hover:bg-muted transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-y-auto px-6 py-5 space-y-3">
              {CONFIG_TEMPLATES.map((tpl) => {
                const Icon = ICON_MAP[tpl.icon] ?? Package;
                const exists = cats.some((c) => (c.name ?? '').trim().toLowerCase() === tpl.label.trim().toLowerCase());
                return (
                  <div key={tpl.key} className="flex items-center gap-3 rounded-xl border border-border p-3.5 bg-background">
                    <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/10 flex items-center justify-center flex-shrink-0"><Icon className="h-5 w-5 text-green-600" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm flex items-center gap-2">{tpl.label}{tpl.required && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/20 text-red-600">obligatoire</span>}</div>
                      <div className="text-xs text-muted-foreground truncate">{tpl.summary} • {tpl.options.length} option(s)</div>
                    </div>
                    <button
                      onClick={() => applyTemplate(tpl)}
                      disabled={!!applyingKey}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex-shrink-0"
                    >
                      {applyingKey === tpl.key ? <Loader2 className="h-4 w-4 animate-spin" /> : exists ? <Plus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      {exists ? 'Ajouter à nouveau' : 'Ajouter'}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-end px-6 py-4 border-t border-border bg-muted/30">
              <button onClick={() => !applyingKey && setShowTemplates(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
