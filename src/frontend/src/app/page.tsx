/**
 * Homepage
 *
 * Demo of the layout system with responsive grid and content blocks.
 *
 * @author Zara (UI/UX & React Components Specialist)
 */

'use client';

import { ResponsiveContainer, Grid, ContentBlock } from "@/components/Layout";

export default function Home() {
  return (
    <ResponsiveContainer>
      <Grid variant="single" spacing="normal">
        {/* Hero Section */}
        <ContentBlock className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
              Lupo's Art Portfolio
            </h1>
            <p className="text-xl sm:text-2xl text-white/80 max-w-2xl mx-auto">
              A breathtaking showcase of 50,000+ images with cinematic effects
            </p>
          </div>
        </ContentBlock>

        {/* Feature Blocks */}
        <Grid variant="side-by-side" spacing="normal">
          <ContentBlock>
            <h2 className="text-3xl font-bold text-white mb-4">
              Cinematic Parallax
            </h2>
            <p className="text-white/80 leading-relaxed">
              Content blocks float elegantly over dynamic backgrounds with smooth crossfade transitions.
            </p>
          </ContentBlock>

          <ContentBlock>
            <h2 className="text-3xl font-bold text-white mb-4">
              60fps Performance
            </h2>
            <p className="text-white/80 leading-relaxed">
              Optimized for lightning-fast performance on all devices, from mobile to desktop.
            </p>
          </ContentBlock>
        </Grid>

        {/* Masonry Grid Demo */}
        <ContentBlock>
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Layout System Components
          </h2>
          <Grid variant="masonry" columns={3} spacing="normal">
            <div className="bg-white/10 rounded-lg p-6 text-white">
              <h3 className="font-semibold mb-2">Navigation</h3>
              <p className="text-sm text-white/70">Scroll-based fade with hamburger menu</p>
            </div>
            <div className="bg-white/10 rounded-lg p-6 text-white">
              <h3 className="font-semibold mb-2">Grid System</h3>
              <p className="text-sm text-white/70">Responsive layouts with multiple variants</p>
            </div>
            <div className="bg-white/10 rounded-lg p-6 text-white">
              <h3 className="font-semibold mb-2">Background</h3>
              <p className="text-sm text-white/70">Dynamic image transitions</p>
            </div>
          </Grid>
        </ContentBlock>

        {/* Call to Action */}
        <ContentBlock className="text-center">
          <a
            href="/gallery"
            className="inline-block bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 backdrop-blur-sm border border-white/20"
          >
            View Gallery Demo →
          </a>
          <p className="text-white/60 text-sm mt-6">
            Layout foundation built by Zara • UI/UX & React Components Specialist
          </p>
        </ContentBlock>
      </Grid>
    </ResponsiveContainer>
  );
}
