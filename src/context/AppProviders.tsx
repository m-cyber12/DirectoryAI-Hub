"use client";

import React, { createContext, useContext, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { applyStoredSnapTheme } from '@/lib/snapTheme';
import type { User } from '@supabase/supabase-js';

/* ============ Auth ============ */
interface AuthCtx {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthCtx>({ user: null, loading: true, signOut: async () => {} });
export const useAuth = () => useContext(AuthContext);

/* ============ Bookmarks ============ */
interface BookmarkCtx {
  bookmarks: string[];
  toggleBookmark: (slug: string) => void;
  isBookmarked: (slug: string) => boolean;
}
const BookmarkContext = createContext<BookmarkCtx>({ bookmarks: [], toggleBookmark: () => {}, isBookmarked: () => false });
export const useBookmarks = () => useContext(BookmarkContext);

/* ============ Compare ============ */
interface CompareCtx {
  compareList: string[];
  toggleCompare: (slug: string) => void;
  isCompared: (slug: string) => boolean;
  clearCompare: () => void;
}
const CompareContext = createContext<CompareCtx>({ compareList: [], toggleCompare: () => {}, isCompared: () => false, clearCompare: () => {} });
export const useCompare = () => useContext(CompareContext);

const MAX_COMPARE = 3;

export function AppProviders({ children }: { children: React.ReactNode }) {
  // Titan theme (Infinity Gauntlet snap): apply the persisted palette before
  // paint on every page so a snapped session stays red across navigation.
  useLayoutEffect(() => {
    applyStoredSnapTheme();
  }, []);

  // --- auth ---
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  }, []);

  // --- bookmarks (localStorage, synced to Supabase when signed in) ---
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cah_bookmarks');
      if (raw) setBookmarks(JSON.parse(raw));
    } catch {}
  }, []);
  const persistBookmarks = (next: string[]) => {
    setBookmarks(next);
    try { localStorage.setItem('cah_bookmarks', JSON.stringify(next)); } catch {}
    // best-effort cloud sync for signed-in users
    if (supabase && user) {
      supabase.from('user_bookmarks').upsert({ user_id: user.id, slugs: next }, { onConflict: 'user_id' }).then(() => {});
    }
  };
  const toggleBookmark = useCallback((slug: string) => {
    persistBookmarks(bookmarks.includes(slug) ? bookmarks.filter((s) => s !== slug) : [...bookmarks, slug]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookmarks, user]);
  const isBookmarked = useCallback((slug: string) => bookmarks.includes(slug), [bookmarks]);

  // --- compare ---
  const [compareList, setCompareList] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('cah_compare');
      if (raw) setCompareList(JSON.parse(raw));
    } catch {}
  }, []);
  const setCompare = (next: string[]) => {
    setCompareList(next);
    try { sessionStorage.setItem('cah_compare', JSON.stringify(next)); } catch {}
  };
  const toggleCompare = useCallback((slug: string) => {
    setCompare(
      compareList.includes(slug)
        ? compareList.filter((s) => s !== slug)
        : compareList.length >= MAX_COMPARE
          ? [...compareList.slice(1), slug]
          : [...compareList, slug]
    );
  }, [compareList]);
  const isCompared = useCallback((slug: string) => compareList.includes(slug), [compareList]);
  const clearCompare = useCallback(() => setCompare([]), []);

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      <BookmarkContext.Provider value={{ bookmarks, toggleBookmark, isBookmarked }}>
        <CompareContext.Provider value={{ compareList, toggleCompare, isCompared, clearCompare }}>
          {children}
        </CompareContext.Provider>
      </BookmarkContext.Provider>
    </AuthContext.Provider>
  );
}
