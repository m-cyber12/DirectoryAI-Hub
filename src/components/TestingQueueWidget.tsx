'use client';

import React from 'react';
import { FlaskConical, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from '@/i18n/navigation';
import { SmartImage } from '@/components/SmartImage';
import { ALL_TOOLS } from '@/data/tools';

interface QueueItem {
  slug: string;
  toolName: string;
  category: string;
  scheduledDate: string;
  status: 'voting' | 'scheduled' | 'in-progress';
}

const INITIAL_QUEUE: QueueItem[] = [
  { slug: 'synthesia', toolName: 'Synthesia', category: 'AI Avatars', scheduledDate: 'Aug 12, 2026', status: 'scheduled' },
  { slug: 'invideo', toolName: 'InVideo AI', category: 'Video Generation', scheduledDate: 'Aug 19, 2026', status: 'scheduled' },
  { slug: 'munch', toolName: 'Munch', category: 'Video Repurposing', scheduledDate: 'Aug 26, 2026', status: 'scheduled' },
  { slug: 'luma-dream-machine', toolName: 'Luma Dream Machine', category: 'Video Generation', scheduledDate: 'Sep 02, 2026', status: 'scheduled' },
];

export function TestingQueueWidget({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-surface-1 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-500/15 border border-accent-500/30 px-3 py-1 text-2xs font-bold text-accent-300 mb-2">
            <FlaskConical className="h-3 w-3" /> Editorial Lab Queue
          </span>
          <h3 className="text-xl font-extrabold text-white">Upcoming Tests</h3>
          <p className="mt-1 text-xs text-zinc-400">
            We test every tool on a standard 24-point benchmark brief. Schedule is tentative based on editorial capacity.
          </p>
        </div>

        <Link
          href="/benchmark"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-surface-2 border border-white/10 px-4 py-2.5 text-xs font-bold text-zinc-300 hover:text-white"
        >
          <span>Methodology</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {INITIAL_QUEUE.map((item, idx) => {
          const tool = ALL_TOOLS.find((t) => t.slug === item.slug);
          return (
            <div
              key={item.slug}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-4 hover:border-accent-500/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-zinc-500">#{idx + 1}</span>
                {tool && (
                  <SmartImage
                    src={tool.logo}
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-xl border border-white/10 object-cover"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/tool/${item.slug}`}
                      className="text-sm font-bold text-white hover:text-accent-300"
                    >
                      {item.toolName}
                    </Link>
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-2xs font-bold text-zinc-400">
                      {item.category}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-2xs text-zinc-500">
                    <Calendar className="h-3 w-3" />
                    <span>Scheduled: {item.scheduledDate}</span>
                    <span className="inline-flex items-center gap-1 text-amber-400">
                      <ShieldCheck className="h-3 w-3" /> Awaiting test
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 text-center">
        <p className="text-2xs text-zinc-500">
          Want a tool tested sooner?{' '}
          <Link href="/submit" className="text-accent-400 hover:text-accent-300 underline">
            Submit it for editorial review
          </Link>
        </p>
      </div>
    </div>
  );
}
