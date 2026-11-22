'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight } from 'lucide-react';

const TRENDING = ['Chargeur 48V', 'Batterie lithium', 'Phare LED', 'Convertisseur DC/DC', 'Afficheur'];

/** Grande barre de recherche de pièces de la page d'accueil. */
export function HeroSearch() {
  const [q, setQ] = useState('');
  const router = useRouter();
  const go = (term: string) => router.push(term.trim() ? `/accessoires?q=${encodeURIComponent(term.trim())}` : '/accessoires');
  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
        className="flex items-center gap-2 p-1.5 pl-5 rounded-full bg-white text-ink shadow-2xl shadow-black/30 focus-within:ring-4 focus-within:ring-brand/50"
      >
        <Search className="h-5 w-5 text-ink/50 shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Quelle pièce cherchez-vous ?"
          className="flex-1 min-w-0 h-11 bg-transparent outline-none text-base placeholder:text-ink/50"
          enterKeyHint="search"
          aria-label="Rechercher une pièce détachée"
        />
        <button type="submit" className="h-11 w-11 sm:w-auto sm:px-6 shrink-0 rounded-full bg-brand text-brand-foreground font-semibold inline-flex items-center justify-center gap-2" aria-label="Rechercher">
          <span className="hidden sm:inline">Rechercher</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </form>
      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {TRENDING.map((t) => (
          <button key={t} onClick={() => go(t)} className="shrink-0 h-9 px-4 rounded-full border border-white/20 text-white/80 text-sm hover:bg-white/10 hover:text-white transition-colors">
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
