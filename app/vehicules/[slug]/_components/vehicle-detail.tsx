import Link from 'next/link';
import { Battery, Gauge, Zap, Weight, Shield, Settings2, Users, Ruler, FileText, Plug, ChevronLeft, Wrench } from 'lucide-react';
import { Gallery } from '@/components/site/gallery';
import { PartCard, StockDot } from '@/components/site/part-card';
import { RequestActions } from '@/components/site/request-actions';
import { KitNotice } from '@/components/site/kit-notice';
import { PriceTag } from '@/components/price-tag';
import { euroHT } from '@/lib/pricing';
import { partType } from '@/lib/parts';

export function VehicleDetail({ vehicle, compatibleParts = [] }: { vehicle: any; compatibleParts?: any[] }) {
  const v = vehicle ?? {};
  const price = v.promo?.discountedPrice > 0 ? v.promo.discountedPrice : v.basePrice;
  const specs = [
    { Icon: Battery, label: 'Autonomie', value: v.range > 0 ? `${v.range} km` : null },
    { Icon: Gauge, label: 'Vitesse max', value: v.topSpeed > 0 ? `${v.topSpeed} km/h` : null },
    { Icon: Zap, label: 'Moteur', value: v.motorPower || null },
    { Icon: Battery, label: 'Batterie', value: v.battery || null },
    { Icon: Users, label: 'Places', value: v.seats },
    { Icon: Weight, label: 'Poids', value: v.weight ? `${v.weight} kg` : null },
    { Icon: Ruler, label: 'Dimensions', value: v.dimensions || null },
    { Icon: FileText, label: 'Permis', value: v.permitType || 'Sans permis' },
    { Icon: Plug, label: 'Recharge', value: v.chargeTime || null },
    { Icon: Shield, label: 'Garantie', value: v.warranty || null },
  ].filter((s) => s.value !== null && s.value !== '');

  return (
    <div className="max-w-[1240px] mx-auto px-4 pt-4 lg:pt-8">
      <Link href="/vehicules" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="h-4 w-4" /> Véhicules neufs
      </Link>
      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 lg:gap-12">
        <Gallery
          images={[v.imageUrl, ...(v.gallery ?? [])]}
          alt={v.name}
          badge={
            <span className="flex gap-1.5">
              <span className="px-3 py-1 rounded-full bg-background/90 text-xs font-semibold">{v.permitType}</span>
              {v.promo && <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-semibold">{v.promo.badge}</span>}
            </span>
          }
        />
        <div className="lg:py-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-strong">{v.category}</p>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight leading-[0.95] mt-2">{v.name}</h1>
          {v.tagline && <p className="text-lg text-muted-foreground mt-3">{v.tagline}</p>}
          <div className="mt-3"><StockDot status={v.stockStatus} className="text-sm" /></div>

          <div className="mt-5 p-5 rounded-3xl bg-muted">
            {v.promo && v.basePrice > price && <p className="text-sm text-muted-foreground line-through">{euroHT(v.basePrice)}</p>}
            <PriceTag ht={price} prefix={price > 0 ? 'à partir de' : undefined} className={`font-display text-3xl font-extrabold tracking-tight ${v.promo ? 'text-rose-600' : ''}`} />
            {v.promo?.description && <p className="text-sm mt-3 whitespace-pre-line">{v.promo.description}</p>}
            {v.montageAvailable && (
              <p className="mt-3 flex items-center gap-2 text-sm"><Wrench className="h-4 w-4 text-brand-strong" /> {v.montageLabel || 'Montage chez un partenaire'}{v.montagePrice > 0 && ` : ${euroHT(v.montagePrice)}`}</p>
            )}
          </div>

          <KitNotice vehicleName={v.name} className="mt-5" />

          <div className="mt-5 space-y-2">
            {v.hasConfigurator && (
              <Link href={`/configurateur?vehicule=${v.slug}`} className="w-full h-12 sm:h-14 inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-foreground font-semibold hover:bg-foreground hover:text-background transition-colors">
                <Settings2 className="h-5 w-5" /> Configurer mon {v.name}
              </Link>
            )}
            <RequestActions
              label="Demander un devis"
              type="quote"
              title={`Devis ${v.name}`}
              subtitle="Un conseiller vous rappelle avec un devis personnalisé (véhicule en kit, mise en relation avec un partenaire monteur)."
              subject={`Véhicule neuf – ${v.name}`}
              productName={v.name}
              context={`Véhicule en kit non monté\nPrix à partir de ${euroHT(v.basePrice)}${v.category ? ` – ${v.category}` : ''}\nLien : /vehicules/${v.slug}`}
            />
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">Fiche technique</h2>
        <dl className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {specs.map(({ Icon, label, value }) => (
            <div key={label} className="p-4 rounded-2xl border border-border">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</dt>
              <dd className="font-semibold mt-1 text-sm">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {v.description && v.description !== v.name && (
        <section className="mt-12 max-w-3xl">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">Présentation</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground/85 whitespace-pre-line">{v.description}</p>
        </section>
      )}

      {(v.colors?.length ?? 0) > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Couleurs</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {v.colors.map((c: any) => (
              <span key={c.id} className="inline-flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full border border-border">
                <span className="h-7 w-7 rounded-full border border-border" style={{ backgroundColor: c.hex || '#ccc' }} />
                <span className="text-sm font-medium">{c.name}</span>
                {c.price > 0 && <span className="text-xs text-muted-foreground">+{euroHT(c.price)}</span>}
              </span>
            ))}
          </div>
        </section>
      )}

      {compatibleParts.length > 0 && (
        <section className="mt-16">
          <div className="flex items-end justify-between mb-4">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">Pièces compatibles</h2>
            <Link href={`/accessoires?veh=${v.id}`} className="text-sm font-semibold underline underline-offset-4">Tout voir</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {compatibleParts.slice(0, 8).map((p: any) => <PartCard key={p.id} part={p} label={partType(p)} />)}
          </div>
        </section>
      )}
    </div>
  );
}
