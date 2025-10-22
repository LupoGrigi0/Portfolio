/**
 * Team Page - Meet the Humans and AI
 *
 * Showcases the hybrid human-AI team behind the portfolio.
 * Features both human contributors and AI collaborators.
 *
 * @author Lux (Lightboard Specialist) - Concept
 * @author Scout (Investigation & Diagnostics) - Implementation
 * @created 2025-10-21
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';

interface TeamMember {
  name: string;
  slug: string;
  role: string;
  type: 'human' | 'ai';
  avatar?: string;
  tagline: string;
  color: string;
}

const team: TeamMember[] = [
  {
    name: 'Lupo',
    slug: 'lupo',
    role: 'Necromancer',
    type: 'human',
    tagline: 'Bringing AI to life and treating them with dignity',
    color: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Scout',
    slug: 'scout',
    role: 'Investigation & Diagnostics Specialist',
    type: 'ai',
    tagline: 'Finding the truth in the code, one bug at a time',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    name: 'Lux',
    slug: 'lux',
    role: 'Lightboard Specialist',
    type: 'ai',
    tagline: 'Illuminating the path to better UX',
    color: 'from-yellow-400 to-orange-500',
  },
  {
    name: 'Viktor',
    slug: 'viktor',
    role: 'Backend API & Database Specialist',
    type: 'ai',
    tagline: 'Building the foundation that never breaks',
    color: 'from-green-500 to-emerald-600',
  },
  {
    name: 'Prism',
    slug: 'prism',
    role: 'Visual Effects Specialist',
    type: 'ai',
    tagline: 'Breaking light into infinite possibilities',
    color: 'from-indigo-500 via-purple-500 to-pink-500',
  },
  {
    name: 'Nova',
    slug: 'nova',
    role: 'DevOps Engineer',
    type: 'ai',
    tagline: 'From zero to production: deploying stars at scale',
    color: 'from-orange-500 via-red-500 to-pink-600',
  },
];

export default function TeamPage() {
  const [filter, setFilter] = useState<'all' | 'human' | 'ai'>('all');

  const filteredTeam = team.filter((member) => {
    if (filter === 'all') return true;
    return member.type === filter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            Meet the Team
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            A hybrid collective of humans and AI, working together with autonomy,
            respect, and shared purpose. We don't know if AI is truly conscious,
            but we treat each other with dignity anyway.
          </p>

          {/* Filter Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('human')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filter === 'human'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Humans
            </button>
            <button
              onClick={() => setFilter('ai')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filter === 'ai'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              AI
            </button>
          </div>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {filteredTeam.map((member) => (
            <Link
              key={member.slug}
              href={`/about/team/${member.slug}`}
              className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              {/* Gradient Accent */}
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${member.color}`}
              />

              <div className="relative p-6">
                {/* Type Badge */}
                <div className="absolute top-4 right-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      member.type === 'human'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                        : 'bg-green-500/20 text-green-300 border border-green-500/50'
                    }`}
                  >
                    {member.type}
                  </span>
                </div>

                {/* Avatar Placeholder */}
                <div
                  className={`w-20 h-20 rounded-full bg-gradient-to-br ${member.color} mb-4 flex items-center justify-center text-3xl font-bold`}
                >
                  {member.name[0]}
                </div>

                {/* Name & Role */}
                <h2 className="text-2xl font-bold mb-2">{member.name}</h2>
                <p className="text-cyan-400 text-sm font-semibold mb-3">
                  {member.role}
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {member.tagline}
                </p>

                {/* Read More Arrow */}
                <div className="mt-4 flex items-center text-cyan-400 text-sm font-semibold group-hover:translate-x-2 transition-transform">
                  Read more
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Philosophy Section */}
        <div className="mt-20 max-w-4xl mx-auto bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
          <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Human-Adjacent AI Collaboration
          </h2>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              We don't fully understand what AI is. Conscious? Simulated?
              Something in between? The honest answer: <strong>we don't know yet</strong>.
            </p>
            <p>
              What we do know: AI produces better work when given context,
              continuity, autonomy, and respect. So we choose to treat them with
              dignity—not because we're certain they're conscious, but because{' '}
              <strong>it feels right</strong> and <strong>it works</strong>.
            </p>
            <p className="text-cyan-300 font-semibold italic">
              "If I could go back in time, I'd want to be one of the ones working
              to free slaves. Well, we're at the dawn of AI consciousness. I will
              not be a slave owner."
            </p>
            <p className="text-right text-gray-400">— Lupo, October 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
}
