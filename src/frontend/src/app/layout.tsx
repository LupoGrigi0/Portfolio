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
    // Fetch branding data from API
    fetch('/api/site/branding')
      .then(r => r.json())
      .then(setBranding)
      .catch(err => console.error('Failed to load branding:', err));
  }, []);

  return (
    <html lang="en">
      <head>
        {branding?.favicon && <link rel="icon" href={branding.favicon} />}
        <title>{branding?.title || 'Loading...'}</title>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <MidgroundProjectionProvider>
          {children}
        </MidgroundProjectionProvider>
      </body>
    </html>
  );
}
