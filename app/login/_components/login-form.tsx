'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Zap, Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e?.preventDefault?.();
    if (!email || !password) { toast?.error?.('Veuillez remplir tous les champs.'); return; }
    setLoading(true);
    try {
      const result = await signIn?.('credentials', { email, password, redirect: false });
      if (result?.ok) {
        router?.replace?.('/admin');
      } else {
        toast?.error?.('Identifiants invalides.');
      }
    } catch {
      toast?.error?.('Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight mb-1">Espace administration</h1>
        <p className="text-sm text-muted-foreground">Connectez-vous pour gérer le site CARLITE.</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-card rounded-3xl p-6 shadow-[var(--shadow-md)] space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="email" value={email} onChange={(e: any) => setEmail(e?.target?.value ?? '')} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="password" value={password} onChange={(e: any) => setPassword(e?.target?.value ?? '')} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
