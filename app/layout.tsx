import type { Metadata, Viewport } from 'next';
import { Rajdhani } from 'next/font/google';
import React from 'react';
import './globals.css';
import { Providers } from './providers';
import { initFeatureFlags } from '@/lib/featureFlags.config';
import { getAllFlagValues } from '@/lib/featureFlags';

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://novibenocode.amllamojha.com'),
  title: 'No Vibe No Code',
  description:
    'Turn raw ideas into governed PRDs, roadmaps, and GitHub backlogs with AI-assisted workflows.',
  manifest: '/manifest.webmanifest',
  authors: [{ name: 'No Vibe No Code' }],
  alternates: {
    canonical: '/',
  },
  appleWebApp: {
    capable: true,
    title: 'No Vibe No Code',
    statusBarStyle: 'black-translucent',
  },
  keywords: [
    'AI product management',
    'PRD generator',
    'startup idea analyzer',
    'roadmap',
    'backlog',
  ],
  openGraph: {
    title: 'No Vibe No Code',
    description:
      'Turn raw ideas into governed PRDs, roadmaps, and GitHub backlogs with AI-assisted workflows.',
    url: 'https://novibenocode.amllamojha.com/',
    siteName: 'No Vibe No Code',
    type: 'website',
    images: [
      {
        url: 'https://novibenocode.amllamojha.com/screenshots/dashboard-light.png',
        width: 1920,
        height: 1080,
        alt: 'No Vibe No Code dashboard',
      },
      {
        url: 'https://novibenocode.amllamojha.com/screenshots/mobile-overview.png',
        width: 1242,
        height: 2688,
        alt: 'No Vibe No Code mobile overview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'No Vibe No Code',
    description:
      'Turn raw ideas into governed PRDs, roadmaps, and GitHub backlogs with AI-assisted workflows.',
    images: ['https://novibenocode.amllamojha.com/screenshots/dashboard-light.png'],
  },
  icons: {
    icon: [
      { url: '/icons/icon-48x48.png', sizes: '48x48' },
      { url: '/icons/icon-72x72.png', sizes: '72x72' },
      { url: '/icons/icon-96x96.png', sizes: '96x96' },
      { url: '/icons/icon-128x128.png', sizes: '128x128' },
      { url: '/icons/icon-144x144.png', sizes: '144x144' },
      { url: '/icons/icon-152x152.png', sizes: '152x152' },
      { url: '/icons/icon-192x192.png', sizes: '192x192' },
      { url: '/icons/icon-256x256.png', sizes: '256x256' },
      { url: '/icons/icon-384x384.png', sizes: '384x384' },
      { url: '/icons/icon-512x512.png', sizes: '512x512' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152' },
      { url: '/icons/icon-192x192.png', sizes: '192x192' },
    ],
    shortcut: '/icons/icon-192x192.png',
    other: [
      { rel: 'mask-icon', url: '/icons/safari-pinned-tab.svg', color: '#0d0d2b' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#0d0d2b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure flags are registered on the server and pass stable values to client
  initFeatureFlags();
  const flagValues = getAllFlagValues();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={rajdhani.className}>
        <script
          // Inject stable flag values for client to adopt and avoid hydration mismatches
          dangerouslySetInnerHTML={{
            __html: `window.__FF__ = ${JSON.stringify(flagValues)};`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
