'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, Image as ImageIcon, Upload, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { toast } from 'sonner';

type FieldDef = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'url' | 'date' | 'image' | 'multiselect' | 'taglist' | 'gallery';
  options?: string[];
  optionItems?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  half?: boolean;
};

interface EditModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Record<string, any>) => Promise<void>;
  title: string;
  fields: FieldDef[];
  initialData: Record<string, any>;
}

function ImageUploadField({ value, onChange, label }: { value: string; onChange: (url: string) => void; label: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = async (file: File) => {
    if (!file?.type?.startsWith?.('image/')) {
      toast.error('Seules les images sont acceptées');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 10 Mo');
      return;
    }
    setUploading(true);
    try {
      // 1. Get presigned URL
      const presignRes = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });
      if (!presignRes.ok) throw new Error('Erreur presign');
      const { uploadUrl, publicUrl } = await presignRes.json();

      // 2. Upload to S3 — check signed headers for content-disposition requirement
      const headers: Record<string, string> = { 'Content-Type': file.type };
      const url = new URL(uploadUrl);
      const signedHeaders = url.searchParams.get('X-Amz-SignedHeaders') ?? '';
      if (signedHeaders.includes('content-disposition')) {
        headers['Content-Disposition'] = 'attachment';
      }
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers,
        body: file,
      });
      if (!uploadRes.ok) throw new Error('Erreur upload S3');

      // 3. Set the public URL
      onChange(publicUrl);
      toast.success('Image uploadée');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('Erreur lors de l\'upload');
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <div className="col-span-2 space-y-2">
      <label className="block text-sm font-medium text-muted-foreground">{label}</label>

      {/* Preview */}
      {value && (
        <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-muted">
          <Image src={value} alt="Aperçu" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-4 py-2 rounded-lg bg-white/90 text-gray-900 text-sm font-medium shadow-lg flex items-center gap-2"
            >
              <Camera className="h-4 w-4" /> Changer l'image
            </button>
          </div>
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-black/60 text-white text-xs">
            <ImageIcon className="h-3 w-3" /> Aperçu
          </div>
        </div>
      )}

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-border hover:border-primary/50 hover:bg-muted/50'
        }`}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Upload en cours...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-1">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {value ? 'Glissez une nouvelle image ou cliquez' : 'Glissez une image ici ou cliquez pour parcourir'}
            </span>
            <span className="text-xs text-muted-foreground/60">JPG, PNG, WebP • Max 10 Mo</span>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target?.files?.[0];
            if (file) uploadFile(file);
            if (e.target) e.target.value = '';
          }}
        />
      </div>

      {/* Manual URL input */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">ou URL :</span>
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e?.target?.value ?? '')}
          placeholder="/images/mon-image.jpg ou https://..."
          className="flex-1 px-3 py-1.5 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  );
}

function GalleryUploadField({ value, onChange, label }: { value: string[]; onChange: (urls: string[]) => void; label: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const list = Array.isArray(value) ? value : [];

  const uploadFiles = async (files: FileList) => {
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      if (!file?.type?.startsWith?.('image/')) continue;
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} dépasse 10 Mo`); continue; }
      try {
        const presignRes = await fetch('/api/admin/upload', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, contentType: file.type }),
        });
        if (!presignRes.ok) throw new Error('presign');
        const { uploadUrl, publicUrl } = await presignRes.json();
        const headers: Record<string, string> = { 'Content-Type': file.type };
        const url = new URL(uploadUrl);
        if ((url.searchParams.get('X-Amz-SignedHeaders') ?? '').includes('content-disposition')) headers['Content-Disposition'] = 'attachment';
        const up = await fetch(uploadUrl, { method: 'PUT', headers, body: file });
        if (!up.ok) throw new Error('upload');
        uploaded.push(publicUrl);
      } catch { toast.error(`Erreur upload ${file.name}`); }
    }
    if (uploaded.length) { onChange([...list, ...uploaded]); toast.success(`${uploaded.length} image(s) ajoutée(s)`); }
    setUploading(false);
  };

  return (
    <div className="col-span-2 space-y-2">
      <label className="block text-sm font-medium text-muted-foreground">{label}</label>
      {list.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {list.map((u, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
              <Image src={u} alt={`Image ${i + 1}`} fill className="object-cover" />
              <button type="button" onClick={() => onChange(list.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div onClick={() => !uploading && fileRef.current?.click()}
        className="border-2 border-dashed border-border rounded-xl p-3 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
        {uploading ? (
          <div className="flex items-center justify-center gap-2 py-1"><Loader2 className="h-4 w-4 animate-spin text-primary" /><span className="text-xs text-muted-foreground">Upload...</span></div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-1"><Upload className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Ajouter des photos (plusieurs possibles)</span></div>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => { if (e.target?.files?.length) uploadFiles(e.target.files); if (e.target) e.target.value = ''; }} />
      </div>
    </div>
  );
}

function TagListField({ value, onChange, label, placeholder }: { value: string[]; onChange: (v: string[]) => void; label: string; placeholder?: string }) {
  const [input, setInput] = useState('');
  const list = Array.isArray(value) ? value : [];
  const add = () => { const t = input.trim(); if (t && !list.includes(t)) { onChange([...list, t]); } setInput(''); };
  return (
    <div className="col-span-2 space-y-2">
      <label className="block text-sm font-medium text-muted-foreground">{label}</label>
      {list.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {list.map((t, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {t}
              <button type="button" onClick={() => onChange(list.filter((_, idx) => idx !== i))}><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder ?? 'Saisir puis Entrée'}
          className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        <button type="button" onClick={add} className="px-3 py-2 rounded-lg bg-muted text-sm font-medium hover:bg-muted/70">Ajouter</button>
      </div>
    </div>
  );
}

function MultiSelectField({ value, onChange, label, items }: { value: string[]; onChange: (v: string[]) => void; label: string; items: { value: string; label: string }[] }) {
  const list = Array.isArray(value) ? value : [];
  const toggle = (v: string) => onChange(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  return (
    <div className="col-span-2 space-y-2">
      <label className="block text-sm font-medium text-muted-foreground">{label}</label>
      {(items ?? []).length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucun élément disponible.</p>
      ) : (
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
          {items.map((it) => (
            <button key={it.value} type="button" onClick={() => toggle(it.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${list.includes(it.value) ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-foreground border-border hover:bg-muted'}`}>
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function EditModal({ open, onClose, onSave, title, fields, initialData }: EditModalProps) {
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open && initialData) {
      setErrors({});
      const formData: Record<string, any> = {};
      for (const f of fields) {
        if (f.type === 'date') {
          const val = initialData?.[f.key];
          formData[f.key] = val ? new Date(val).toISOString().split('T')[0] : '';
        } else if (f.type === 'multiselect' || f.type === 'taglist' || f.type === 'gallery') {
          formData[f.key] = Array.isArray(initialData?.[f.key]) ? initialData[f.key] : [];
        } else {
          formData[f.key] = initialData?.[f.key] ?? (f.type === 'number' ? 0 : f.type === 'checkbox' ? false : '');
        }
      }
      setForm(formData);
    }
  }, [open, initialData]);

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: false } : prev));
  };

  const isEmptyValue = (f: FieldDef, value: any) => {
    if (f.type === 'multiselect' || f.type === 'taglist' || f.type === 'gallery') {
      return !Array.isArray(value) || value.length === 0;
    }
    if (f.type === 'number') {
      return value === null || value === undefined || value === '' || Number.isNaN(value);
    }
    if (f.type === 'checkbox') {
      return false;
    }
    return value === null || value === undefined || String(value).trim() === '';
  };

  const handleSubmit = async (e: any) => {
    e?.preventDefault?.();
    const newErrors: Record<string, boolean> = {};
    for (const f of fields) {
      if (f.required && isEmptyValue(f, form?.[f.key])) {
        newErrors[f.key] = true;
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Veuillez remplir tous les champs obligatoires (en rouge)');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, any> = { ...form };
      for (const f of fields) {
        if (f.type === 'date' && payload[f.key]) {
          payload[f.key] = new Date(payload[f.key] + 'T00:00:00.000Z').toISOString();
        } else if (f.type === 'date' && !payload[f.key]) {
          payload[f.key] = null;
        }
      }
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="font-display text-lg font-bold">{title}</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(85vh-130px)] px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {fields.map((f) => {
                if (f.type === 'image') {
                  return (
                    <ImageUploadField
                      key={f.key}
                      value={form?.[f.key] ?? ''}
                      onChange={(url) => handleChange(f.key, url)}
                      label={f.label}
                    />
                  );
                }

                if (f.type === 'gallery') {
                  return <GalleryUploadField key={f.key} value={form?.[f.key] ?? []} onChange={(urls) => handleChange(f.key, urls)} label={f.label} />;
                }

                if (f.type === 'taglist') {
                  return <TagListField key={f.key} value={form?.[f.key] ?? []} onChange={(v) => handleChange(f.key, v)} label={f.label} placeholder={f.placeholder} />;
                }

                if (f.type === 'multiselect') {
                  return <MultiSelectField key={f.key} value={form?.[f.key] ?? []} onChange={(v) => handleChange(f.key, v)} label={f.label} items={f.optionItems ?? []} />;
                }

                if (f.type === 'checkbox') {
                  return (
                    <label key={f.key} className="flex items-center gap-3 col-span-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!form?.[f.key]}
                        onChange={(e: any) => handleChange(f.key, e?.target?.checked)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium">{f.label}</span>
                    </label>
                  );
                }

                if (f.type === 'select') {
                  return (
                    <div key={f.key} className={f.half ? '' : 'col-span-2'}>
                      <label className={`block text-sm font-medium mb-1.5 ${errors[f.key] ? 'text-red-600' : 'text-muted-foreground'}`}>{f.label}{f.required && <span className="text-red-500"> *</span>}</label>
                      <select
                        value={form?.[f.key] ?? ''}
                        onChange={(e: any) => handleChange(f.key, e?.target?.value)}
                        className={`w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 ${errors[f.key] ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500' : 'border-input focus:ring-ring'}`}
                      >
                        {f.optionItems?.length
                          ? f.optionItems.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)
                          : f.options?.map?.((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  );
                }

                if (f.type === 'textarea') {
                  return (
                    <div key={f.key} className="col-span-2">
                      <label className={`block text-sm font-medium mb-1.5 ${errors[f.key] ? 'text-red-600' : 'text-muted-foreground'}`}>{f.label}{f.required && <span className="text-red-500"> *</span>}</label>
                      <textarea
                        value={form?.[f.key] ?? ''}
                        onChange={(e: any) => handleChange(f.key, e?.target?.value)}
                        placeholder={f.placeholder}
                        rows={f.key === 'content' ? 10 : 3}
                        className={`w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 resize-none ${errors[f.key] ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500' : 'border-input focus:ring-ring'}`}
                      />
                    </div>
                  );
                }

                if (f.type === 'date') {
                  return (
                    <div key={f.key} className={f.half ? '' : 'col-span-2'}>
                      <label className={`block text-sm font-medium mb-1.5 ${errors[f.key] ? 'text-red-600' : 'text-muted-foreground'}`}>{f.label}{f.required && <span className="text-red-500"> *</span>}</label>
                      <input
                        type="date"
                        value={form?.[f.key] ?? ''}
                        onChange={(e: any) => handleChange(f.key, e?.target?.value)}
                        className={`w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 ${errors[f.key] ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500' : 'border-input focus:ring-ring'}`}
                      />
                    </div>
                  );
                }

                return (
                  <div key={f.key} className={f.half ? '' : 'col-span-2'}>
                    <label className={`block text-sm font-medium mb-1.5 ${errors[f.key] ? 'text-red-600' : 'text-muted-foreground'}`}>{f.label}{f.required && <span className="text-red-500"> *</span>}</label>
                    <input
                      type={f.type === 'number' ? 'number' : 'text'}
                      value={form?.[f.key] ?? ''}
                      onChange={(e: any) => handleChange(f.key, f.type === 'number' ? parseFloat(e?.target?.value) || 0 : e?.target?.value)}
                      placeholder={f.placeholder}
                      step={f.type === 'number' ? 'any' : undefined}
                      className={`w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 ${errors[f.key] ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500' : 'border-input focus:ring-ring'}`}
                    />
                    {errors[f.key] && <p className="mt-1 text-xs text-red-600">Ce champ est obligatoire</p>}
                  </div>
                );
              })}
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
