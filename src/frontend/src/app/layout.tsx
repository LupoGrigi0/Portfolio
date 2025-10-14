'use client';

import { Geist, Geist_Mono } from "next/font/google";
import { MidgroundProjectionProvider } from '@/components/Layout';
import './globals.css';
import { useEffect, useState } from 'react';

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
  const [branding, setBranding] = useState<{ favicon?: string; title?: string } | null>(null);

  useEffect(() => {
    // Fetch site config from API (includes branding)
    fetch('/api/site/config')
      .then(r => {
        if (!r.ok) throw new Error(`Site config API returned ${r.status}`);
        return r.json();
      })
      .then(response => {
        // Extract branding from site config response
        const data = response.data;
        setBranding({
          title: data.siteName || 'Portfolio',
          favicon: data.branding?.faviconUrl || data.branding?.favicon,
        });
      })
      .catch(err => {
        console.error('Failed to load site config:', err);
        // Set fallback branding
        setBranding({ title: 'Portfolio' });
      });
  }, []);

  return (
    <html lang="en">
      <head>
        {branding?.favicon && <link rel="icon" href={branding.favicon} />}
        <title>{branding?.title || 'Portfolio'}</title>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <MidgroundProjectionProvider>
          {children}
        </MidgroundProjectionProvider>
      </body>
    </html>
  );
}
