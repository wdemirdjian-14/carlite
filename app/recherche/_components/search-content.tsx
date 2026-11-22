'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { euroHT } from '@/lib/pricing';

export function SearchContent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query?.trim?.()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query?.trim?.() ?? '')}`);
      const data = await res?.json?.();
      setResults(data ?? {});
    } catch {
      setResults({ vehicles: [], accessories: [], usedVehicles: [], articles: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">Recherche</h1>
        <p className="text-muted-foreground">Trouvez des véhicules, accessoires et véhicules d’occasion.</p>
      </div>

      <div className="max-w-xl mx-auto mb-10">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e: any) => setQuery(e?.target?.value ?? '')}
              onKeyDown={(e: any) => e?.key === 'Enter' && handleSearch()}
              placeholder="Rechercher un véhicule, accessoire..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button onClick={handleSearch} disabled={loading} className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Rechercher'}
          </button>
        </div>
      </div>

      {results && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          {/* Vehicles */}
          {(results?.vehicles?.length ?? 0) > 0 && (
            <div>
              <h2 className="font-display text-xl font-bold mb-4">Véhicules neufs</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {results?.vehicles?.map?.((v: any) => (
                  <Link key={v?.id} href={`/vehicules/${v?.slug ?? ''}`} className="group bg-card rounded-xl overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all">
                    <div className="relative aspect-[4/3] bg-muted"><Image src={v?.imageUrl ?? ''} alt={v?.name ?? ''} fill className="object-cover" /></div>
                    <div className="p-4">
                      <h3 className="font-display font-bold">{v?.name ?? ''}</h3>
                      <p className="text-sm font-mono text-primary">{euroHT(v?.basePrice)}</p>
                    </div>
                  </Link>
                )) ?? null}
              </div>
            </div>
          )}
          {/* Accessories */}
          {(results?.accessories?.length ?? 0) > 0 && (
            <div>
              <h2 className="font-display text-xl font-bold mb-4">Accessoires</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {results?.accessories?.map?.((a: any) => (
                  <div key={a?.id} className="bg-card rounded-xl overflow-hidden shadow-[var(--shadow-sm)]">
                    <div className="relative aspect-square bg-muted"><Image src={a?.imageUrl ?? ''} alt={a?.name ?? ''} fill className="object-cover" /></div>
                    <div className="p-4">
                      <h3 className="font-display font-bold">{a?.name ?? ''}</h3>
                      <p className="text-sm font-mono text-primary">{euroHT(a?.price)}</p>
                    </div>
                  </div>
                )) ?? null}
              </div>
            </div>
          )}
          {/* Used */}
          {(results?.usedVehicles?.length ?? 0) > 0 && (
            <div>
              <h2 className="font-display text-xl font-bold mb-4">Véhicules d’occasion</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {results?.usedVehicles?.map?.((v: any) => (
                  <div key={v?.id} className="bg-card rounded-xl overflow-hidden shadow-[var(--shadow-sm)]">
                    <div className="relative aspect-[4/3] bg-muted"><Image src={v?.imageUrl ?? ''} alt={v?.name ?? ''} fill className="object-cover" /></div>
                    <div className="p-4">
                      <h3 className="font-display font-bold">{v?.name ?? ''}</h3>
                      <p className="text-sm font-mono text-primary">{euroHT(v?.price)}</p>
                    </div>
                  </div>
                )) ?? null}
              </div>
            </div>
          )}
          {/* Articles */}
          {(results?.articles?.length ?? 0) > 0 && (
            <div>
              <h2 className="font-display text-xl font-bold mb-4">Articles</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {results?.articles?.map?.((a: any) => (
                  <Link key={a?.id} href={`/articles/${a?.slug ?? ''}`} className="group bg-card rounded-xl overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all flex">
                    <div className="relative w-32 shrink-0 bg-muted"><Image src={a?.imageUrl ?? ''} alt={a?.title ?? ''} fill className="object-cover" /></div>
                    <div className="p-4 flex-1">
                      <span className="text-xs font-medium text-primary">{a?.category ?? ''}</span>
                      <h3 className="font-display font-bold mt-1 line-clamp-2">{a?.title ?? ''}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a?.excerpt ?? ''}</p>
                    </div>
                  </Link>
                )) ?? null}
              </div>
            </div>
          )}
          {(results?.vehicles?.length ?? 0) === 0 && (results?.accessories?.length ?? 0) === 0 && (results?.usedVehicles?.length ?? 0) === 0 && (results?.articles?.length ?? 0) === 0 && (
            <div className="text-center py-12 text-muted-foreground">Aucun résultat pour « {query} »</div>
          )}
        </motion.div>
      )}
    </div>
  );
}