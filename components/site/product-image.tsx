'use client';
import Image from 'next/image';
import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Image produit avec fond neutre et repli si le fichier manque.
 * `fit="contain"` pour les photos de pièces (détourées / sur fond clair), `cover` pour les véhicules.
 */
export function ProductImage({
  src,
  alt,
  className,
  fit = 'cover',
  sizes = '(max-width: 640px) 50vw, 25vw',
  priority,
  imgClassName,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fit?: 'cover' | 'contain';
  sizes?: string;
  priority?: boolean;
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn('relative overflow-hidden bg-muted', className)}>
      {src && !failed ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onError={() => setFailed(true)}
          className={cn(fit === 'contain' ? 'object-contain p-[8%] mix-blend-multiply dark:mix-blend-normal' : 'object-cover', imgClassName)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50">
          <ImageOff className="h-1/4 w-1/4 max-h-8 max-w-8" />
        </div>
      )}
    </div>
  );
}
