'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, User, Mail, Phone, MessageSquare, Car, CheckCircle } from 'lucide-react';
import { SectionWrapper } from '@/components/section-wrapper';
import { toast } from 'sonner';

export function ContactForm({ vehicles }: { vehicles: any[] }) {
  const safe = vehicles ?? [];
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', vehicleId: '', vehicleName: '', message: '', type: 'test_drive',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    const { name, value } = e?.target ?? {};
    if (name === 'vehicleId') {
      const v = safe?.find?.((v: any) => v?.id === value);
      setFormData({ ...(formData ?? {}), vehicleId: value ?? '', vehicleName: v?.name ?? '' });
    } else {
      setFormData({ ...(formData ?? {}), [name ?? '']: value ?? '' });
    }
  };

  const handleSubmit = async (e: any) => {
    e?.preventDefault?.();
    if (!formData?.firstName || !formData?.lastName || !formData?.email || !formData?.phone) {
      toast?.error?.('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/test-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res?.ok) {
        setSubmitted(true);
      } else {
        toast?.error?.('Une erreur est survenue. Veuillez réessayer.');
      }
    } catch {
      toast?.error?.('Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-20 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <CheckCircle className="h-16 w-16 text-secondary mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Demande envoyée !</h2>
          <p className="text-muted-foreground">Nous vous contacterons dans les plus brefs délais.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-12">
      <SectionWrapper>
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">Contact & Demande d’essai</h1>
          <p className="text-muted-foreground max-w-md mx-auto">Remplissez le formulaire ci-dessous et notre équipe vous recontactera rapidement.</p>
        </div>
      </SectionWrapper>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-8 shadow-[var(--shadow-md)] space-y-5">
          <div className="flex gap-2 mb-4">
            <button type="button" onClick={() => setFormData({ ...(formData ?? {}), type: 'test_drive' })} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${formData?.type === 'test_drive' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              Demande d’essai
            </button>
            <button type="button" onClick={() => setFormData({ ...(formData ?? {}), type: 'info' })} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${formData?.type === 'info' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              Demande d’information
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Prénom *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input name="firstName" value={formData?.firstName ?? ''} onChange={handleChange} required className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Nom *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input name="lastName" value={formData?.lastName ?? ''} onChange={handleChange} required className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Email *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input name="email" type="email" value={formData?.email ?? ''} onChange={handleChange} required className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Téléphone *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input name="phone" value={formData?.phone ?? ''} onChange={handleChange} required className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          {safe.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-1 block">Véhicule intéressé</label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select name="vehicleId" value={formData?.vehicleId ?? ''} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none">
                  <option value="">Sélectionnez un modèle</option>
                  {safe.map((v: any) => (<option key={v?.id} value={v?.id}>{v?.name ?? ''}</option>))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1 block">Message</label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <textarea name="message" value={formData?.message ?? ''} onChange={handleChange} rows={4} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? 'Envoi en cours...' : <><Send className="h-4 w-4" /> Envoyer ma demande</>}
          </button>
          <p className="text-xs text-muted-foreground text-center">Vos données sont traitées de manière confidentielle.</p>
        </form>
      </div>
    </div>
  );
}
