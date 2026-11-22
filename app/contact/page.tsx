import { PageLayout } from '@/components/page-layout';
import { ContactForm } from './_components/contact-form';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Contact & Demande d\'essai' };

export default async function ContactPage() {
  let vehicles: any[] = [];
  try {
    vehicles = await prisma.vehicle.findMany({ where: { available: true, published: true }, select: { id: true, name: true, slug: true } });
  } catch {}

  return (
    <PageLayout>
      <ContactForm vehicles={vehicles ?? []} />
    </PageLayout>
  );
}
