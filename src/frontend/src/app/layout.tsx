'use client';

import { Geist, Geist_Mono } from "next/font/google";
import { ProjectionManagerProvider } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { LightboardProvider, Lightboard } from '@/components/Lightboard';
import './globals.css';
import { useEffect, useState } from 'react';
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
        <ProjectionManagerProvider>
          <LightboardProvider>
            {/* Navigation (includes hamburger, drawer, and breadcrumbs) */}
            <Navigation
              config={siteConfig?.navigation}
              collections={collections}
              siteConfig={siteConfig}
            />

            {/* Main content */}
            {children}

            {/* Lightboard design panel */}
            <Lightboard />
          </LightboardProvider>
        </ProjectionManagerProvider>
      </body>
    </html>
  );
}
