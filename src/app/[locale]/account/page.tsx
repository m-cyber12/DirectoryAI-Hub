"use client";

import React from 'react';
import Link from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ToolCard } from '@/components/ToolCard';
import { CompareBar } from '@/components/CompareBar';
import { useAuth, useBookmarks } from '@/context/AppProviders';
import { ALL_TOOLS } from '@/data/tools';
import { Bookmark, LogOut, User as UserIcon, Sparkles } from 'lucide-react';

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const { bookmarks } = useBookmarks();

  const saved = bookmarks
    .map((slug) => ALL_TOOLS.find((t) => t.slug === slug))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <Header />
      <main id="main" className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-500 text-black text-xl font-black">
              {user ? (user.email || 'U')[0].toUpperCase() : <UserIcon className="h-6 w-6" />}
            </div>
            <div>
              <h1 className="text-2xl font-black">My Creator Space</h1>
              <p className="text-xs text-zinc-500">
                {loading ? 'Loading…' : user ? user.email : 'Guest mode — bookmarks are stored on this device.'}
              </p>
            </div>
          </div>
          {user ? (
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-zinc-300 hover:bg-white/5 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-4 py-2.5 text-xs font-bold text-black hover:bg-accent-400 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" /> Sign in to sync across devices
            </Link>
          )}
        </div>

        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
          <Bookmark className="h-4 w-4 text-accent-400" /> Saved Tools ({saved.length})
        </h2>
        <p className="mb-6 text-xs text-zinc-500">Tools you bookmarked while browsing the directory.</p>

        {saved.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {saved.map((tool, i) => <ToolCard key={tool.slug} tool={tool} index={i} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-white/10 bg-zinc-900/30 py-20 text-center">
            <div className="mb-3 text-4xl">🔖</div>
            <h3 className="text-base font-bold">Nothing saved yet</h3>
            <p className="mt-1 max-w-sm text-xs text-zinc-500">
              Tap the bookmark icon on any tool card to build your personal AI toolbox.
            </p>
            <Link href="/tools" className="mt-5 rounded-xl bg-accent-500 px-5 py-2.5 text-xs font-bold text-black hover:bg-accent-400 transition-colors">
              Browse {ALL_TOOLS.length}+ Tools
            </Link>
          </div>
        )}
      </main>
      <CompareBar />
      <Footer />
    </div>
  );
}
