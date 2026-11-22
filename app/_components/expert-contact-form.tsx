'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, Loader2, MessageSquare, Phone, Mail, User } from 'lucide-react';
import { SectionWrapper } from '@/components/section-wrapper';

export function ExpertContactForm() {
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: any) => {
    const { name, value } = e?.target ?? {};
    setForm((prev) => ({ ...prev, [name ?? '']: value ?? '' }));
    if (error) setError('');
  };

  const handleSubmit = async (e: any) => {
    e?.preventDefault?.();
    if (!form.nom?.trim() || !form.prenom?.trim() || !form.email?.trim() || !form.telephone?.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/contact-expert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res?.json?.();
      if (data?.success) {
        setSuccess(true);
        setForm({ nom: '', prenom: '', email: '', telephone: '', description: '' });
      } else {
        setError(data?.message ?? 'Erreur lors de l\'envoi.');
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact-expert" className="relative overflow-hidden scroll-mt-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-green-950" />
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(74,222,128,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(74,222,128,0.15) 0%, transparent 40%)' }} />

      <div className="relative max-w-[1200px] mx-auto px-4 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left: Text */}
          <SectionWrapper>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-6">
                <MessageSquare className="h-4 w-4" />
                Conseil personnalisé
              </div>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
                Vous voulez discuter avec un{' '}
                <span className="text-green-400">expert</span> ?
              </h2>
              <p className="text-lg text-gray-300 mb-4 leading-relaxed">
                Vous avez un projet de véhicule électrique adapté à vos besoins ? Nos experts sont là pour vous accompagner et vous aider à prendre la bonne décision.
              </p>
              <p className="text-gray-400 mb-8">
                Remplissez le formulaire ci-contre et un conseiller CARLITE vous recontactera rapidement pour discuter de votre projet.
              </p>
              <div className="flex flex-col gap-3 text-sm text-gray-400">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-green-400" />
                  </div>
                  <span>Un expert vous rappelle sous 24h</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </div>
                  <span>Conseil gratuit et sans engagement</span>
                </div>
              </div>
            </div>
          </SectionWrapper>

          {/* Right: Form */}
          <SectionWrapper delay={0.2}>
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-10 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-white mb-3">Message envoyé !</h3>
                  <p className="text-gray-400 mb-6">Merci pour votre demande. Un expert CARLITE vous contactera très rapidement pour discuter de votre projet.</p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="text-sm text-green-400 hover:text-green-300 transition-colors underline underline-offset-4"
                  >
                    Envoyer une autre demande
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleSubmit}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-10 space-y-5"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Prénom *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                          type="text"
                          name="prenom"
                          value={form.prenom}
                          onChange={handleChange}
                          placeholder="Votre prénom"
                          className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                          type="text"
                          name="nom"
                          value={form.nom}
                          onChange={handleChange}
                          placeholder="Votre nom"
                          className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="votre@email.fr"
                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Téléphone *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        type="tel"
                        name="telephone"
                        value={form.telephone}
                        onChange={handleChange}
                        placeholder="06 XX XX XX XX"
                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Description du projet <span className="text-gray-500 font-normal">(facultatif)</span>
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Décrivez brièvement votre projet ou vos besoins..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all resize-none"
                    />
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-red-400 text-sm"
                    >
                      {error}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/20"
                  >
                    {loading ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /> Envoi en cours...</>
                    ) : (
                      <><Send className="h-5 w-5" /> Prenez contact</>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center">* Champs obligatoires</p>
                </motion.form>
              )}
            </AnimatePresence>
          </SectionWrapper>
        </div>
      </div>
    </section>
  );
}
