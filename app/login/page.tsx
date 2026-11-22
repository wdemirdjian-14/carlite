import { PageLayout } from '@/components/page-layout';
import { LoginForm } from './_components/login-form';

export const metadata = { title: 'Connexion' };

export default function LoginPage() {
  return (
    <PageLayout>
      <LoginForm />
    </PageLayout>
  );
}
