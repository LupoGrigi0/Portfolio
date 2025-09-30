/**
 * Root Layout
 *
 * Main application layout with Navigation and Background system.
 *
 * @author Zara (UI/UX & React Components Specialist)
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation, BackgroundProvider } from "@/components/Layout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lupo's Art Portfolio",
  description: "A breathtaking showcase of artistic vision and creativity",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <BackgroundProvider>
          <Navigation
            logoSrc="/branding/logo.png"
            menuItems={[
              { label: 'Home', href: '/' },
              { label: 'Gallery Demo', href: '/gallery', featured: true },
            ]}
          />
          <main className="pt-16 min-h-screen">
            {children}
          </main>
        </BackgroundProvider>
      </body>
    </html>
  );
}
