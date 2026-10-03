import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/src/lib/i18n';
import { Navbar } from '@/src/components/layout/Navbar';
import { Footer } from '@/src/components/layout/Footer';
import { MobileBottomNav } from '@/src/components/layout/MobileBottomNav';

export const metadata: Metadata = {
  title: 'Sadiqabad City Phone Directory | صادق آباد بزنس ڈائریکٹری',
  description:
    'Verified phone and business directory for Sadiqabad city (Punjab, Pakistan). One-tap Call, WhatsApp, directions, and hours for 500+ doctors, hospitals, restaurants, and shops.',
  keywords: [
    'Sadiqabad',
    'Sadiqabad phone directory',
    'Sadiqabad businesses',
    'Sadiqabad doctors',
    'Sadiqabad hospitals',
    'صادق آباد فون ڈائریکٹری',
    'Rahim Yar Khan',
  ],
  authors: [{ name: 'Sadiqabad City Directory' }],
  openGraph: {
    title: 'Sadiqabad City Phone Directory | صادق آباد بزنس ڈائریکٹری',
    description:
      'Search 500+ verified doctors, hospitals, pharmacies, restaurants, and shops in Sadiqabad with instant Call and WhatsApp.',
    type: 'website',
    locale: 'en_PK',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Noto+Nastaliq+Urdu:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-teal-500 selection:text-white transition-colors duration-200 pb-16 md:pb-0">
        <LanguageProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <MobileBottomNav />
        </LanguageProvider>
      </body>
    </html>
  );
}
