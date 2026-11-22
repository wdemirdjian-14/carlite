'use client';
import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Plus, X } from 'lucide-react';
import { SectionWrapper } from '@/components/section-wrapper';
import { euroHT, euroTTC } from '@/lib/pricing';

export function Comparator({ vehicles }: { vehicles: any[] }) {
  const safe = vehicles ?? [];
  const [selected, setSelected] = useState<string[]>([]);

  const addVehicle = (id: string) => {
    if ((selected?.length ?? 0) < 3 && !selected?.includes?.(id)) {
      setSelected([...(selected ?? []), id]);
    }
  };
  const removeVehicle = (id: string) => {
    setSelected(selected?.filter?.((s: string) => s !== id) ?? []);
  };

  const selectedVehicles = selected?.map?.((id: string) => safe?.find?.((v: any) => v?.id === id))?.filter?.(Boolean) ?? [];

  const specs = [
    { key: 'basePrice', label: 'Prix', format: (v: any) => `${euroHT(v)} (${euroTTC(v)})` },
    { key: 'category', label: 'Catégorie', format: (v: any) => v ?? '-' },
    { key: 'permitType', label: 'Permis', format: (v: any) => v ?? '-' },
    { key: 'range', label: 'Autonomie', format: (v: any) => `${v ?? 0} km` },
    { key: 'topSpeed', label: 'Vitesse max', format: (v: any) => `${v ?? 0} km/h` },
    { key: 'motorPower', label: 'Puissance', format: (v: any) => v ?? '-' },
    { key: 'battery', label: 'Batterie', format: (v: any) => v ?? '-' },
    { key: 'seats', label: 'Places', format: (v: any) => `${v ?? 0}` },
    { key: 'weight', label: 'Poids', format: (v: any) => `${v ?? 0} kg` },
    { key: 'dimensions', label: 'Dimensions', format: (v: any) => v ?? '-' },
    { key: 'chargeTime', label: 'Temps de charge', format: (v: any) => v ?? '-' },
    { key: 'warranty', label: 'Garantie', format: (v: any) => v ?? '-' },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-12">
      <SectionWrapper>
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">Comparateur</h1>
          <p className="text-muted-foreground">Comparez les véhicules CARLITE côte à côte pour trouver celui qui vous convient.</p>
        </div>
      </SectionWrapper>

      <div className="bg-card rounded-xl p-5 shadow-[var(--shadow-md)] mb-8">
        <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-green-600" /> Sélectionner des véhicules ({selected?.length ?? 0}/3)
        </h3>
        <div className="flex flex-wrap gap-2">
          {safe.map((v: any) => {
            const isSelected = selected?.includes?.(v?.id);
            return (
              <button
                key={v?.id}
                onClick={() => isSelected ? removeVehicle(v?.id) : addVehicle(v?.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isSelected ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {v?.name ?? ''}
                {isSelected && <X className="inline h-3 w-3 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {selectedVehicles.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Plus className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          Sélectionnez au moins un véhicule pour commencer la comparaison.
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${selectedVehicles.length}, 1fr)` }}>
            <div />
            {selectedVehicles.map((v: any) => (
              <div key={v?.id} className="bg-card rounded-xl p-4 shadow-[var(--shadow-md)] text-center">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted mb-3">
                  <Image src={v?.imageUrl ?? ''} alt={v?.name ?? ''} fill className="object-cover" />
                </div>
                <h3 className="font-display font-bold">{v?.name ?? ''}</h3>
                <p className="text-xs text-muted-foreground">{v?.category ?? ''}</p>
              </div>
            ))}

            {specs.map((spec: any, i: number) => (
              <>
                <div key={`label-${i}`} className={`flex items-center text-sm font-medium px-3 py-3 rounded-l-lg ${i % 2 === 0 ? 'bg-muted/50' : ''}`}>
                  {spec?.label}
                </div>
                {selectedVehicles.map((v: any) => (
                  <div key={`${v?.id}-${i}`} className={`flex items-center justify-center text-sm font-mono px-3 py-3 ${i % 2 === 0 ? 'bg-muted/50' : ''}`}>
                    {spec?.format?.(v?.[spec?.key])}
                  </div>
                ))}
              </>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
