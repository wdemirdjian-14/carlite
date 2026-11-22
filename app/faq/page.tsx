import { PageLayout } from '@/components/page-layout';
import { FaqContent } from './_components/faq-content';

export const metadata = { title: 'FAQ' };

export default function FaqPage() {
  return (
    <PageLayout>
      <FaqContent />
    </PageLayout>
  );
}
