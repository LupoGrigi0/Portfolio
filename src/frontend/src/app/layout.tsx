'use client';

import { Geist, Geist_Mono } from "next/font/google";
import { MidgroundProjectionProvider } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import './globals.css';
import { useEffect, useState } from 'react';
import type { Collection, SiteConfig } from '@/lib/api-client';
import { getSiteConfig, getCollections } from '@/lib/api-client';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);

  // Fetch site config and collections on mount
  useEffect(() => {
    // Fetch site config
    getSiteConfig().then(config => {
      if (config) {
        setSiteConfig(config);
      }
    });

    // Fetch collections for menu
    getCollections().then(collections => {
      setCollections(collections);
    });
  }, []);

  return (
    <html lang="en">
      <head>
        {siteConfig?.branding?.faviconUrl && (
          <link rel="icon" href={siteConfig.branding.faviconUrl} />
        )}
        <title>{siteConfig?.siteName || 'Portfolio'}</title>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <MidgroundProjectionProvider>
          {/* Navigation (includes hamburger, drawer, and breadcrumbs) */}
          <Navigation
            config={siteConfig?.navigation}
            collections={collections}
            siteConfig={siteConfig}
          />

          {/* Main content */}
          {children}
        </MidgroundProjectionProvider>
      </body>
    </html>
  );
}
