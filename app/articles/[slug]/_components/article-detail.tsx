'use client';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, ArrowLeft, Tag, ArrowRight, Calendar } from 'lucide-react';
import { SectionWrapper } from '@/components/section-wrapper';

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return ''; }
}

export function ArticleDetail({ article, related }: { article: any; related: any[] }) {
  const a = article ?? {};
  const safeRelated = related ?? [];

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-ink text-white">
        <div className="absolute inset-0">
          <Image src={a?.imageUrl ?? ''} alt={a?.title ?? ''} fill className="object-cover opacity-30" priority />
        </div>
        <div className="relative max-w-[800px] mx-auto px-4 py-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Link href="/articles" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Retour aux articles
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-brand/20 text-brand text-xs font-bold uppercase">{a?.category}</span>
              <span className="flex items-center gap-1 text-sm text-gray-400"><Clock className="h-3.5 w-3.5" /> {a?.readTime ?? 5} min de lecture</span>
              <span className="flex items-center gap-1 text-sm text-gray-400"><Calendar className="h-3.5 w-3.5" /> {formatDate(a?.createdAt)}</span>
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight mb-4">{a?.title}</h1>
            <p className="text-lg text-gray-300">{a?.excerpt}</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-[800px] mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-10 shadow-[var(--shadow-lg)]">
            <Image src={a?.imageUrl ?? ''} alt={a?.title ?? ''} fill className="object-cover" />
          </div>

          {/* Article body */}
          <article className="prose prose-lg dark:prose-invert max-w-none
            prose-headings:font-display prose-headings:tracking-tight
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-strong:text-foreground
            prose-a:text-brand-strong dark:prose-a:text-brand prose-a:no-underline hover:prose-a:underline
            prose-li:text-muted-foreground
            prose-blockquote:border-brand prose-blockquote:bg-brand/5 prose-blockquote:rounded-r-xl prose-blockquote:py-1
          ">
            {a?.content?.split?.('\n')?.map?.((para: string, i: number) => {
              const trimmed = para?.trim?.() ?? '';
              if (!trimmed) return null;
              if (trimmed.startsWith('## ')) return <h2 key={i}>{trimmed.slice(3)}</h2>;
              if (trimmed.startsWith('### ')) return <h3 key={i}>{trimmed.slice(4)}</h3>;
              if (trimmed.startsWith('> ')) return <blockquote key={i}><p>{trimmed.slice(2)}</p></blockquote>;
              if (trimmed.startsWith('- ')) return <ul key={i}><li>{trimmed.slice(2)}</li></ul>;
              return <p key={i} dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
            }) ?? null}
          </article>

          {/* Tags */}
          {(a?.tags?.length ?? 0) > 0 && (
            <div className="mt-10 pt-8 border-t border-border">
              <div className="flex flex-wrap gap-2">
                {a.tags.map((tag: string, i: number) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm font-medium">
                    <Tag className="h-3 w-3" /> {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </section>

      {/* Related articles */}
      {safeRelated.length > 0 && (
        <section className="bg-muted/30">
          <div className="max-w-[1200px] mx-auto px-4 py-16">
            <SectionWrapper>
              <h2 className="font-display text-2xl font-extrabold tracking-tight mb-8">Articles similaires</h2>
            </SectionWrapper>
            <div className="grid md:grid-cols-3 gap-6">
              {safeRelated.map((r: any, i: number) => (
                <SectionWrapper key={r?.id ?? i} delay={i * 0.1}>
                  <Link href={`/articles/${r?.slug ?? ''}`}>
                    <div className="group bg-card rounded-3xl overflow-hidden shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 hover:-translate-y-1">
                      <div className="relative aspect-[16/10] bg-muted">
                        <Image src={r?.imageUrl ?? ''} alt={r?.title ?? ''} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-4">
                        <span className="text-xs font-medium text-brand-strong dark:text-brand">{r?.category}</span>
                        <h3 className="font-display font-extrabold mt-1 line-clamp-2 group-hover:text-brand-strong dark:group-hover:text-brand transition-colors">{r?.title}</h3>
                      </div>
                    </div>
                  </Link>
                </SectionWrapper>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-[800px] mx-auto px-4 py-12 text-center">
        <SectionWrapper>
          <p className="text-muted-foreground mb-4">Envie de découvrir nos véhicules électriques ?</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/vehicules" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-white text-sm font-medium hover:opacity-90 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
              Voir la gamme <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/articles" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-muted text-sm font-medium hover:bg-muted/80 transition-colors">
              Tous les articles
            </Link>
          </div>
        </SectionWrapper>
      </section>
    </div>
  );
}
