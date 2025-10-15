'use client';

import { Geist, Geist_Mono } from "next/font/google";
import { MidgroundProjectionProvider } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import './globals.css';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { Collection, SiteConfig } from '@/lib/api-client';
import { getSiteConfig, getCollections } from '@/lib/api-client';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [currentCollectionName, setCurrentCollectionName] = useState<string | undefined>();
  const pathname = usePathname();

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

  // Extract current collection name from pathname
  useEffect(() => {
    if (pathname?.startsWith('/collections/')) {
      const slug = pathname.split('/')[2];
      // Find collection by slug
      const collection = collections.find(c => c.slug === slug);
      setCurrentCollectionName(collection?.name || collection?.title);
    } else if (pathname === '/') {
      setCurrentCollectionName(undefined);
    }
  }, [pathname, collections]);

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
          {/* Navigation (includes top bar, breadcrumbs, and drawer) */}
          <Navigation
            config={siteConfig?.navigation}
            collections={collections}
            currentCollectionName={currentCollectionName}
          />

          {/* Main content */}
          {children}
        </MidgroundProjectionProvider>
      </body>
    </html>
  );
}
