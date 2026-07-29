import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Orinoco Invest - Ahorra en USD. Invierte automático.',
  description: 'Ahorra en USD. Invierte automático. Retira cuando quieras. Plataforma de inversión segura para Venezuela.',
  keywords: 'inversión, ahorros, USD, automático, Venezuela, finanzas',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Orinoco Invest - Ahorra en USD. Invierte automático.',
    description: 'Ahorra en USD. Invierte automático. Retira cuando quieras.',
    type: 'website',
    locale: 'es_VE',
    siteName: 'Orinoco Invest',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Orinoco Invest - Ahorra en USD. Invierte automático.',
    description: 'Ahorra en USD. Invierte automático. Retira cuando quieras.',
  },
};

export const viewport: Viewport = {
  themeColor: '#22c55e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#22c55e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Orinoco Invest" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.className} bg-surface-50 min-h-screen flex flex-col`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1 pb-24 md:pb-0">
            {children}
          </main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
