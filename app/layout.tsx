import { DM_Sans, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';
import { ChunkLoadErrorHandler } from '@/components/chunk-load-error-handler';
import { FloatingCallback } from '@/components/floating-callback';

export const dynamic = 'force-dynamic';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' });
const jakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: {
    default: 'CARLITE – Pièces détachées et véhicules électriques (quadricycles, golfettes, utilitaires)',
    template: '%s | CARLITE',
  },
  description:
    "Pièces détachées pour véhicules électriques (chargeurs, batteries lithium, convertisseurs, éclairage LED), quadricycles sans permis, golfettes et utilitaires électriques neufs en kit et d'occasion. Plus de 20 ans d'expertise.",
  alternates: { canonical: '/' },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'CARLITE',
    images: ['/og-image.png'],
  },
  twitter: { card: 'summary_large_image' },
  // Balise de vérification Google Search Console / Merchant Center (facultative si le domaine est vérifié par DNS)
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${jakartaSans.variable} ${jetbrainsMono.variable} font-sans`}>
        <Providers>
          {children}
          <FloatingCallback />
          <Toaster position="top-center" />
          <ChunkLoadErrorHandler />
        </Providers>
      </body>
    </html>
  );
}
