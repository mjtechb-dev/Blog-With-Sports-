import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Blog With Sports (BWS) — Independent Sports Stories & Analysis',
  description: 'Modern, clean, and lightweight international sports news, editorial analysis, and long-form journalism.',
  manifest: '/manifest.json',
  themeColor: '#064e3b',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  openGraph: {
    title: 'Blog With Sports (BWS)',
    description: 'Modern, clean, and lightweight international sports news, editorial analysis, and long-form journalism.',
    type: 'website',
    siteName: 'Blog With Sports',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog With Sports (BWS)',
    description: 'Modern, clean, and lightweight international sports news, editorial analysis, and long-form journalism.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="bg-[#FAF9F5] text-neutral-900 antialiased">
      <head>
        {/* Preconnect to ImgBB and Unsplash image CDNs for ultra-fast load times */}
        <link rel="preconnect" href="https://i.ibb.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://i.ibb.co" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-[#FAF9F5] text-neutral-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
        {children}
      </body>
    </html>
  );
}
