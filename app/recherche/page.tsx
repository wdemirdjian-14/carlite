import { PageLayout } from '@/components/page-layout';
import { SearchContent } from './_components/search-content';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Recherche' };

export default function RecherchePage() {
  return (
    <PageLayout>
      <SearchContent />
    </PageLayout>
  );
}
