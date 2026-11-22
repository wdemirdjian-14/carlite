import { PageLayout } from '@/components/page-layout';
import { RechargeContent } from './_components/recharge-content';

export const metadata = { title: 'Recharge & Autonomie' };

export default function RechargePage() {
  return (
    <PageLayout>
      <RechargeContent />
    </PageLayout>
  );
}
