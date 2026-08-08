'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from '@/i18n/navigation';
import { Menu, X, Zap, User as UserIcon, LogOut, Bookmark, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth, useBookmarks } from '@/context/AppProviders';
import { REAL_CATEGORIES, categorySlug } from '@/lib/categories';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function Header() {
  const t = useTranslations('header');
  const tc = useTranslations('categories');

  const directoryLinks = [
    { href: '/tools', label: t('browseTools') },
    { href: '/compare', label: t('compareTools') },
    { href: '/stack-builder', label: t('buildStack') },
    { href: '/calculators', label: t('budgetPlanner') },
  ];

  const navLinks = [
    { href: '/ai-studio', label: t('aiStudio') },
    { href: '/methodology', label: t('methodology') },
    { href: '/guide', label: t('gettingStarted') },
    { href: '/blog', label: t('guides') },
  ];

  const moreLinks = [
    { href: '/best-of', label: t('bestOf') },
    { href: '/deals', label: t('deals') },
    { href: '/calculators', label: t('calculators') },
    { href: '/benchmark', label: t('benchmark') },
    { href: '/changelog', label: t('whatsNew') },
    { href: '/news', label: t('news') },
    { href: '/graveyard', label: t('graveyard') },
  ];

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user, signOut } = useAuth();
  const { bookmarks } = useBookmarks();

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(window.scrollY / max, 1) : 0);
        setScrolled(window.scrollY > 12);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const accountRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (mobileOpen) {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
      }
      setAccountOpen(false);
      setCategoriesOpen(false);
      setMoreOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (accountRef.current && !accountRef.current.contains(target)) setAccountOpen(false);
      if (categoriesRef.current && !categoriesRef.current.contains(target)) setCategoriesOpen(false);
      if (moreRef.current && !moreRef.current.contains(target)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const localizedCategory = (c: string) =>
    tc.has(c) ? tc(c) : c;

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-[background-color,box-shadow,border-color] duration-300 ${
        scrolled
          ? 'border-white/10 bg-surface-0/80 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.55)]'
          : 'border-white/5 bg-surface-0/60'
      }`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent-500 via-fuchsia-500 to-cyan-400 transition-[width] duration-150 ease-out"
        style={{ width: `${progress * 100}%`, boxShadow: '0 0 12px rgba(247,201,72,0.8)' }}
      />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex shrink-0 items-center gap-2"
          aria-label="CreatorAI Hub — home (opens in a new tab)"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500 shadow-[0_0_18px_rgba(247,201,72,0.45)] transition-shadow group-hover:shadow-[0_0_26px_rgba(247,201,72,0.7)]">
            <Zap className="h-4 w-4 text-black" aria-hidden="true" />
          </span>
          <span className="hidden text-lg font-bold text-white sm:block">
            CreatorAI <span className="text-gradient-amber">Hub</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Main">
          <div className="relative" ref={categoriesRef}>
            <button
              onClick={() => setCategoriesOpen(!categoriesOpen)}
              aria-expanded={categoriesOpen}
              aria-haspopup="true"
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5 hover:text-white"
            >
              {t('categoriesLabel')}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
            {categoriesOpen && (
              <div className="absolute start-0 mt-2 w-[30rem] max-w-[90vw] rounded-xl border border-white/10 bg-surface-1 p-2 shadow-2xl">
                <div className="grid grid-cols-2 gap-1 border-b border-white/10 pb-2">
                  {directoryLinks.map((link) => (
                    <Link key={link.href} href={link.href} onClick={() => setCategoriesOpen(false)} className="rounded-lg px-3 py-2 text-2xs font-semibold text-zinc-200 hover:bg-white/5 hover:text-accent-300">
                      {link.label}
                    </Link>
                  ))}
                </div>
                <p className="px-3 pb-1 pt-3 text-2xs font-bold uppercase tracking-wider text-zinc-600">{t('browseTools')}</p>
                <div className="grid grid-cols-2 gap-1">
                  {REAL_CATEGORIES.map((c) => (
                    <Link
                      key={c}
                      href={`/category/${categorySlug(c)}`}
                      onClick={() => setCategoriesOpen(false)}
                      className="rounded-lg px-3 py-2 text-2xs font-medium text-zinc-300 hover:bg-white/5 hover:text-accent-300"
                    >
                      {localizedCategory(c)}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}

          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              aria-expanded={moreOpen}
              aria-haspopup="true"
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              {t('more')}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
            {moreOpen && (
              <div className="absolute end-0 mt-2 grid w-56 grid-cols-1 gap-1 rounded-xl border border-white/10 bg-surface-1 p-2 shadow-2xl">
                {moreLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    className="rounded-lg px-3 py-2 text-2xs font-medium text-zinc-300 hover:bg-white/5 hover:text-accent-300"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          <Link
            href="/account"
            className="relative hidden rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white sm:inline-flex"
            aria-label={`Saved tools${bookmarks.length ? ` (${bookmarks.length})` : ''}`}
          >
            <Bookmark className="h-4 w-4" aria-hidden="true" />
            {bookmarks.length > 0 && (
              <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 font-mono text-2xs font-bold tabular-nums text-black">
                {bookmarks.length}
              </span>
            )}
          </Link>

          <ThemeToggle />

          {user ? (
            <div className="relative hidden sm:block" ref={accountRef}>
              <button
                onClick={() => setAccountOpen(!accountOpen)}
                aria-expanded={accountOpen}
                aria-haspopup="true"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 text-2xs font-bold text-black ring-2 ring-white/10"
                aria-label={t('account')}
              >
                {(user.email || 'U')[0].toUpperCase()}
              </button>
              {accountOpen && (
                <div className="absolute end-0 mt-2 w-52 rounded-xl border border-white/10 bg-surface-1 p-2 shadow-2xl">
                  <p className="truncate px-3 py-2 text-2xs text-zinc-500">{user.email}</p>
                  <Link
                    href="/account"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-2xs font-semibold text-zinc-300 hover:bg-white/5"
                  >
                    <UserIcon className="h-3.5 w-3.5" aria-hidden="true" /> {t('account')}
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setAccountOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-2xs font-semibold text-rose-400 hover:bg-white/5"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> {t('signOut')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden items-center rounded-lg border border-white/10 px-3 py-2 text-2xs font-bold text-zinc-300 transition-colors hover:bg-white/5 hover:text-white sm:inline-flex"
            >
              {t('signIn')}
            </Link>
          )}

          <Link
            href="/submit"
            className="hidden items-center rounded-lg bg-accent-500 px-3 py-2 text-2xs font-bold text-black transition-opacity hover:opacity-90 sm:inline-flex"
          >
            {t('submitTool')}
          </Link>

          <button
            ref={menuButtonRef}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white xl:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-menu"
          className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-white/5 bg-surface-0 px-4 py-4 xl:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            <p className="px-3 text-2xs font-bold uppercase tracking-wider text-zinc-600">{t('categoriesLabel')}</p>
            {directoryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <div className="my-2 border-t border-white/5" />
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            {moreLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}

            <p className="mt-3 px-3 text-2xs font-bold uppercase tracking-wider text-zinc-600">{t('categoriesLabel')}</p>
            {REAL_CATEGORIES.map((c) => (
              <Link
                key={c}
                href={`/category/${categorySlug(c)}`}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-2xs text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                {localizedCategory(c)}
              </Link>
            ))}

            <Link
              href={user ? '/account' : '/login'}
              onClick={() => setMobileOpen(false)}
              className="mt-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/5"
            >
              {user ? t('account') : t('signIn')}
            </Link>
            <Link
              href="/submit"
              onClick={() => setMobileOpen(false)}
              className="mt-2 rounded-lg bg-accent-500 px-3 py-2.5 text-center text-sm font-bold text-black"
            >
              {t('submitTool')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
