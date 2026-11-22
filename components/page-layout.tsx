import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BottomNav } from '@/components/site/bottom-nav';
import { SearchOverlay } from '@/components/site/search-overlay';

export function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <BottomNav />
      <SearchOverlay />
    </div>
  );
}
