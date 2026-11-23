import { PageLayout } from '@/components/page-layout';

/** Mise en page des pages légales (texte long, lisible sur mobile). */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <PageLayout>
      <article className="max-w-3xl mx-auto px-4 pt-8 lg:pt-12">
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight leading-[0.95]">{title}</h1>
        <p className="text-sm text-muted-foreground mt-3">Dernière mise à jour : {updated}</p>
        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-foreground/85 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-foreground [&_h2]:mb-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1">
          {children}
        </div>
      </article>
    </PageLayout>
  );
}
