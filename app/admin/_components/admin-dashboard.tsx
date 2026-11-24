'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Car, ShoppingBag, Tag, MessageSquare, ArrowRight, AlertCircle, Newspaper, Users, Layers, Percent, PackagePlus, FileSpreadsheet } from 'lucide-react';

export function AdminDashboard({ stats }: { stats: any }) {
  const s = stats ?? {};
  const cards = [
    { icon: Car, label: 'Véhicules neufs', count: s?.vehicleCount ?? 0, href: '/admin/vehicules', color: 'bg-blue-500' },
    { icon: ShoppingBag, label: 'Pièces détachées', count: s?.accessoryCount ?? 0, href: '/admin/accessoires', color: 'bg-green-500' },
    { icon: Layers, label: 'Catégories de pièces', count: s?.partCategoryCount ?? 0, href: '/admin/pieces-categories', color: 'bg-lime-600' },
    { icon: Tag, label: 'Véhicules occasion', count: s?.usedCount ?? 0, href: '/admin/occasion', color: 'bg-orange-500' },
    { icon: Percent, label: 'Promotions', count: s?.promotionCount ?? 0, href: '/admin/promotions', color: 'bg-rose-500' },
    { icon: MessageSquare, label: 'Demandes clients', count: s?.requestCount ?? 0, href: '/admin/demandes', color: 'bg-purple-500' },
    { icon: Newspaper, label: 'Articles', count: s?.articleCount ?? 0, href: '/admin/articles', color: 'bg-teal-500' },
    { icon: Users, label: 'Utilisateurs', count: s?.userCount ?? 0, href: '/admin/utilisateurs', color: 'bg-indigo-500' },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-2">Tableau de bord</h1>
        <p className="text-muted-foreground">Bienvenue dans l’interface d’administration CARLITE.</p>
      </div>

      <Link href="/admin/stock-rapide" className="block mb-6">
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all hover:-translate-y-0.5">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <PackagePlus className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="font-display text-lg font-bold leading-tight">Stock rapide</div>
            <div className="text-sm text-white/90">Ajoutez un produit avec photo, détourage et quantité depuis votre mobile.</div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0" />
        </div>
      </Link>

      <Link href="/admin/import-export" className="block mb-6">
        <div className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all hover:-translate-y-0.5">
          <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="font-display text-lg font-bold leading-tight">Import / export produits</div>
            <div className="text-sm text-muted-foreground">Quantités, prix d’achat et prix de vente via Excel, avec aperçu et annulation.</div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0" />
        </div>
      </Link>

      {(s?.pendingCount ?? 0) > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 mb-6">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          <span className="text-sm font-medium">{s?.pendingCount} demande(s) en attente de traitement</span>
          <Link href="/admin/demandes" className="ml-auto text-sm text-primary font-medium hover:underline">Voir</Link>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card: any, i: number) => {
          const Icon = card?.icon ?? Car;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={card?.href ?? '#'}>
                <div className="bg-card rounded-xl p-6 shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all hover:-translate-y-0.5 group">
                  <div className={`w-10 h-10 rounded-lg ${card?.color ?? 'bg-primary'} flex items-center justify-center mb-4`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="font-mono text-3xl font-bold mb-1">{card?.count ?? 0}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{card?.label ?? ''}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
