'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, Newspaper, Tag } from 'lucide-react';
import { SectionWrapper } from '@/components/section-wrapper';

export function ArticleList({ articles }: { articles: any[] }) {
  const safe = articles ?? [];
  const categories = ['Tous', ...Array.from(new Set(safe.map((a: any) => a?.category).filter(Boolean)))];
  const [activeCategory, setActiveCategory] = useState('Tous');

  const filtered = activeCategory === 'Tous' ? safe : safe.filter((a: any) => a?.category === activeCategory);
  const featured = safe.find((a: any) => a?.featured);
  const rest = filtered.filter((a: any) => a?.id !== featured?.id);

  return (
    <div>
      {/* Hero */}
      <section className="bg-ink text-white">
        <div className="max-w-[1200px] mx-auto px-4 py-16">
          <SectionWrapper>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-3xl bg-brand/20 flex items-center justify-center">
                <Newspaper className="h-5 w-5 text-brand" />
              </div>
              <span className="text-sm text-brand font-medium uppercase tracking-wider">Blog & Actualités</span>
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight mb-3">Articles</h1>
            <p className="text-gray-400 max-w-lg text-lg">Restez informé sur la mobilité électrique, les quadricycles, la réglementation et bien plus.</p>
          </SectionWrapper>
        </div>
      </section>

      {/* Featured article */}
      {featured && (
        <section className="max-w-[1200px] mx-auto px-4 -mt-6">
          <SectionWrapper>
            <Link href={`/articles/${featured?.slug}`}>
              <div className="group relative rounded-2xl overflow-hidden shadow-[var(--shadow-lg)] bg-card">
                <div className="grid md:grid-cols-2">
                  <div className="relative aspect-[16/10] md:aspect-auto">
                    <Image src={featured?.imageUrl ?? ''} alt={featured?.title ?? ''} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-brand text-brand-foreground text-xs font-bold uppercase">
                      À la une
                    </div>
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-2 py-1 rounded-md bg-muted text-xs font-medium">{featured?.category}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {featured?.readTime} min</span>
                    </div>
                    <h2 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight mb-3 group-hover:text-brand-strong dark:group-hover:text-brand transition-colors">
                      {featured?.title}
                    </h2>
                    <p className="text-muted-foreground mb-4 line-clamp-3">{featured?.excerpt}</p>
                    <div className="flex items-center gap-2 text-sm font-medium text-brand-strong dark:text-brand">
                      Lire l&apos;article <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </SectionWrapper>
        </section>
      )}

      {/* Filters */}
      <section className="max-w-[1200px] mx-auto px-4 pt-12 pb-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-ink text-white dark:bg-white dark:text-gray-900'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Article grid */}
      <section className="max-w-[1200px] mx-auto px-4 pb-20">
        {rest.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">Aucun article dans cette catégorie pour le moment.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {rest.map((article: any, i: number) => (
              <motion.div
                key={article?.id ?? i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <Link href={`/articles/${article?.slug ?? ''}`}>
                  <div className="group bg-card rounded-3xl overflow-hidden shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                    <div className="relative aspect-[16/10] bg-muted">
                      <Image src={article?.imageUrl ?? ''} alt={article?.title ?? ''} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-brand/10 text-brand-strong dark:text-brand text-xs font-medium">{article?.category}</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {article?.readTime} min</span>
                      </div>
                      <h3 className="font-display font-extrabold text-lg mb-2 group-hover:text-brand-strong dark:group-hover:text-brand transition-colors line-clamp-2">{article?.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-3 flex-1">{article?.excerpt}</p>
                      {article?.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-auto">
                          {article.tags.slice(0, 3).map((tag: string, j: number) => (
                            <span key={j} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                              <Tag className="h-2.5 w-2.5" />{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
