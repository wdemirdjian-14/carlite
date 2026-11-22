'use client';
import { useRef, useState } from 'react';
import { ProductImage } from '@/components/site/product-image';
import { cn } from '@/lib/utils';

/** Galerie photo balayable au doigt (scroll-snap) avec vignettes. */
export function Gallery({ images, alt, fit = 'cover', badge }: { images: string[]; alt: string; fit?: 'cover' | 'contain'; badge?: React.ReactNode }) {
  const list = images.filter(Boolean);
  const [idx, setIdx] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const go = (i: number) => {
    setIdx(i);
    track.current?.scrollTo({ left: i * (track.current?.clientWidth ?? 0), behavior: 'smooth' });
  };
  const bg = fit === 'contain' ? 'bg-[#f3f3f0] dark:bg-white/5' : '';
  if (!list.length) return <ProductImage src={null} alt={alt} className="aspect-square rounded-3xl" />;

  return (
    <div>
      <div className="relative">
        <div
          ref={track}
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== idx) setIdx(i);
          }}
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar rounded-3xl"
        >
          {list.map((src, i) => (
            <div key={src + i} className="snap-center shrink-0 w-full">
              <ProductImage src={src} alt={`${alt} — photo ${i + 1}`} fit={fit} priority={i === 0} sizes="(max-width: 1024px) 100vw, 50vw" className={cn('aspect-square sm:aspect-[4/3]', bg)} />
            </div>
          ))}
        </div>
        {badge && <div className="absolute top-4 left-4">{badge}</div>}
        {list.length > 1 && (
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 sm:hidden">
            {list.map((_, i) => (
              <span key={i} className={cn('h-1.5 rounded-full transition-all', i === idx ? 'w-5 bg-foreground' : 'w-1.5 bg-foreground/30')} />
            ))}
          </div>
        )}
      </div>
      {list.length > 1 && (
        <div className="hidden sm:flex gap-2 mt-3 overflow-x-auto no-scrollbar">
          {list.map((src, i) => (
            <button key={src + i} onClick={() => go(i)} className={cn('shrink-0 rounded-2xl ring-2 transition', i === idx ? 'ring-foreground' : 'ring-transparent opacity-70 hover:opacity-100')}>
              <ProductImage src={src} alt="" fit={fit} sizes="80px" className={cn('w-20 h-20 rounded-2xl', bg)} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
