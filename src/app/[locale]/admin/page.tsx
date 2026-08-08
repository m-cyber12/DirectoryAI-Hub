'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from '@/i18n/navigation';
import {
  Loader2,
  LogOut,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  MessageSquare,
  Inbox,
  Megaphone,
  ExternalLink,
  Newspaper,
  LayoutDashboard,
  Download,
  CheckCheck,
  Trash2,
  Languages,
} from 'lucide-react';

/**
 * Admin panel — rebuilt.
 *
 * Audit fix 6.2. The previous version was 1,392 lines (the largest file in the
 * project) and its two biggest tabs did nothing at all:
 *
 *   - "Content" edited hero_title_main ("THE BOLD AI STUDIO"), hero_badge
 *     ("Inspired by Bold Studio • MotionSites.ai 3D Edition") and
 *     hero_description. The only consumer of /api/settings was the Hero3D
 *     component, which was orphaned — the homepage hardcoded everything. So
 *     these fields could never change the live site, and the badge still
 *     named the template the project was copied from.
 *   - "Design" offered ten colour themes, grid_layout, card_style and
 *     hero_animation. None were read by any rendered component.
 *
 * It also had: a Persian UI on an English site, one POST per settings key in a
 * loop (12+ sequential requests to save one form), `any` types throughout, no
 * CSRF token, and no audit log.
 *
 * This version keeps only what genuinely operates the site — moderation,
 * submissions, and the one announcement that is actually rendered — in English,
 * against the hardened session (lib/adminAuth.ts) and service-role writes.
 */

type Tab = 'overview' | 'submissions' | 'reviews' | 'news' | 'announcement' | 'i18n';

interface AdminStats {
  catalog: { total: number; handsOnTested: number; pricingVerified: number; listedOnly: number };
  db: {
    configured: boolean;
    submissionsPending: number;
    reviewsPending: number;
    newsPending: number;
    newsApproved: number;
    newsletterConfirmed: number;
    newsletterWaiting: number;
    poll: { writing: number; editing: number; voiceover: number; thumbnails: number };
  };
}

interface NewsRow {
  slug: string;
  title: string;
  excerpt: string;
  source: string;
  source_url: string;
  category: string;
  published_at: string;
  approved: boolean;
  ai_summarized: boolean;
}

interface Submission {
  id: string;
  tool_name: string;
  website_url: string;
  tagline: string;
  category: string;
  pricing: string;
  founder_email: string;
  status: string;
  created_at: string;
}

interface Review {
  id: string;
  tool_slug: string;
  rating: number;
  title: string;
  body: string;
  author_name: string;
  status: string;
  created_at: string;
}

const TABS: { id: Tab; label: string; icon: typeof Inbox }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'submissions', label: 'Submissions', icon: Inbox },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
  { id: 'news', label: 'News Queue', icon: Newspaper },
  { id: 'announcement', label: 'Announcement', icon: Megaphone },
  { id: 'i18n', label: 'Translation', icon: Languages },
];

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [csrf, setCsrf] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [busy, setBusy] = useState(false);

  const [tab, setTab] = useState<Tab>('overview');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [ingestBusy, setIngestBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const [announcement, setAnnouncement] = useState({
    announcement_title: '',
    announcement_desc: '',
    announcement_enabled: 'false',
  });

  // i18n provider config (admin-panel managed translation keys)
  const [i18n, setI18n] = useState({
    provider: '',
    geminiApiKey: '',
    openrouterApiKey: '',
    openaiApiKey: '',
    geminiModel: '',
    openrouterModel: '',
    effective: '',
    effectiveModel: '',
    env: { provider: '', hasOpenAI: false, hasGemini: false, hasOpenRouter: false } as {
      provider: string;
      hasOpenAI: boolean;
      hasGemini: boolean;
      hasOpenRouter: boolean;
    },
  });
  const [i18nBusy, setI18nBusy] = useState(false);
  const [i18nTest, setI18nTest] = useState<{ ok: boolean; message: string } | null>(null);

  const flash = (kind: 'ok' | 'err', text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 4000);
  };

  // ── auth ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/admin/auth')
      .then((r) => r.json())
      .then((d) => setAuthed(!!d.authenticated))
      .catch(() => setAuthed(false));
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setAuthError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: mutHeaders(),
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setAuthed(true);
      setPassword('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setAuthed(false);
  };

  // ── data ────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, revRes, newsRes, setRes, i18nRes, statsRes] = await Promise.all([
        fetch('/api/admin/submissions'),
        fetch('/api/admin/reviews'),
        fetch('/api/admin/news'),
        fetch('/api/settings'),
        fetch('/api/admin/i18n/provider'),
        fetch('/api/admin/stats'),
      ]);
      if (subRes.ok) setSubmissions(await subRes.json());
      if (revRes.ok) setReviews(await revRes.json());
      if (newsRes.ok) setNews(await newsRes.json());
      if (statsRes.ok) {
        const st = await statsRes.json();
        // Defensive: only set when the shape is actually the stats payload.
        if (st && typeof st === 'object' && st.catalog) setStats(st);
      }
      if (i18nRes.ok) {
        try {
          const ip = await i18nRes.json();
          setI18n((prev) => ({
            ...prev,
            provider: ip.db?.provider ?? prev.provider,
            geminiModel: ip.db?.geminiModel ?? prev.geminiModel,
            openrouterModel: ip.db?.openrouterModel ?? prev.openrouterModel,
            effective: ip.effective ?? '',
            effectiveModel: ip.effectiveModel ?? '',
            env: ip.env ?? prev.env,
          }));
        } catch {
          /* non-JSON — ignore */
        }
      }
      if (setRes.ok) {
        const s = await setRes.json();
        setAnnouncement({
          announcement_title: s.announcement_title ?? '',
          announcement_desc: s.announcement_desc ?? '',
          announcement_enabled: s.announcement_enabled ?? 'false',
        });
      }
    } catch {
      flash('err', 'Could not load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadAll();
  }, [authed, loadAll]);

  // Fetch a CSRF token bound to this session and send it on every mutation
  // (audit fix 6.2 / 2.3). Without it, admin writes return 403.
  useEffect(() => {
    if (!authed) return;
    let cancelled = false;
    fetch('/api/admin/auth/csrf')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.token) setCsrf(d.token);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [authed]);

  // Helper: base headers for admin mutation requests, including the CSRF token.
  const mutHeaders = () => ({ 'Content-Type': 'application/json', 'x-csrf-token': csrf });

  const actOnSubmission = async (submission: Submission, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: mutHeaders(),
        body: JSON.stringify({ action, submission }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      flash('ok', `Submission ${action}d.`);
      loadAll();
    } catch (err) {
      flash('err', err instanceof Error ? err.message : 'Failed');
    }
  };

  /** Editorial gate for auto-aggregated news (migration 0006). */
  const moderateNews = async (slug: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/news', {
        method: 'PATCH',
        headers: mutHeaders(),
        body: JSON.stringify({ slug, action }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      flash('ok', action === 'approve' ? 'Item approved — it can now appear on /news.' : 'Item rejected and removed.');
      loadAll();
    } catch (err) {
      flash('err', err instanceof Error ? err.message : 'Failed');
    }
  };

  /* v2.8: bulk moderation for the queue. */
  const bulkNews = async (action: 'approve' | 'reject') => {
    const pending = news.filter((n) => !n.approved);
    if (pending.length === 0) {
      flash('err', 'Nothing pending.');
      return;
    }
    setBusy(true);
    try {
      for (const n of pending) {
        const res = await fetch('/api/admin/news', {
          method: 'PATCH',
          headers: mutHeaders(),
          body: JSON.stringify({ slug: n.slug, action }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      }
      flash('ok', `${pending.length} item(s) ${action === 'approve' ? 'approved' : 'rejected'}.`);
      loadAll();
    } catch (err) {
      flash('err', err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  /* v2.8: run the ingestion pipeline now (no cron wait). */
  const ingestNow = async () => {
    setIngestBusy(true);
    try {
      const res = await fetch('/api/admin/news/refresh', { method: 'POST', headers: mutHeaders() });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || d.note || 'Ingest failed');
      flash('ok', `Ingested: ${d.kept ?? 0} relevant, ${d.insertedNew ?? 0} new in queue.`);
      loadAll();
    } catch (err) {
      flash('err', err instanceof Error ? err.message : 'Ingest failed');
    } finally {
      setIngestBusy(false);
    }
  };

  const moderateReview = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: mutHeaders(),
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      flash('ok', `Review ${status}.`);
      loadAll();
    } catch (err) {
      flash('err', err instanceof Error ? err.message : 'Failed');
    }
  };

  const saveI18n = async () => {
    setI18nBusy(true);
    setI18nTest(null);
    try {
      const res = await fetch('/api/admin/i18n/provider', {
        method: 'PUT',
        headers: mutHeaders(),
        body: JSON.stringify({
          provider: i18n.provider,
          geminiApiKey: i18n.geminiApiKey,
          openrouterApiKey: i18n.openrouterApiKey,
          openaiApiKey: i18n.openaiApiKey,
          geminiModel: i18n.geminiModel,
          openrouterModel: i18n.openrouterModel,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
      flash('ok', 'Translation provider saved.');
      await loadAll();
    } catch (err) {
      flash('err', err instanceof Error ? err.message : 'Save failed');
    } finally {
      setI18nBusy(false);
    }
  };

  const testI18n = async () => {
    setI18nBusy(true);
    setI18nTest(null);
    try {
      const res = await fetch('/api/admin/i18n/provider', {
        method: 'POST',
        headers: mutHeaders(),
      });
      const data = await res.json();
      setI18nTest({ ok: data.ok, message: data.message || data.note || 'Test failed.' });
      if (data.ok) flash('ok', `Test OK — ${data.provider} (${data.model})`);
      else flash('err', data.message || 'Test failed.');
    } catch (err) {
      setI18nTest({ ok: false, message: err instanceof Error ? err.message : 'Test failed.' });
    } finally {
      setI18nBusy(false);
    }
  };

  /** Single batched save — the old panel fired one request per key in a loop. */
  const saveAnnouncement = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: mutHeaders(),
        body: JSON.stringify(announcement),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
      flash('ok', 'Announcement saved.');
    } catch (err) {
      flash('err', err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  // ── render ──────────────────────────────────────────────────────────
  if (authed === null) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface-0">
        <Loader2 className="h-6 w-6 animate-spin text-accent-400" aria-label="Loading" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface-0 px-4">
        <form
          onSubmit={login}
          className="w-full max-w-sm rounded-2xl border border-white/10 bg-surface-1 p-8"
        >
          <h1 className="text-xl font-bold text-white">Admin sign in</h1>
          <label htmlFor="admin-pw" className="mt-6 block text-2xs font-semibold text-zinc-400">
            Password
          </label>
          <input
            id="admin-pw"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-surface-2 px-4 py-3 text-sm text-white focus:border-accent-500 focus:outline-none"
          />
          {authError && (
            <p role="alert" className="mt-3 text-2xs font-semibold text-rose-400">
              {authError}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 py-3 text-sm font-bold text-black disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Sign in
          </button>
          <p className="mt-4 text-2xs leading-relaxed text-zinc-500">
            Sessions are signed and expire after 8 hours. The cookie no longer contains the
            password itself.
          </p>
        </form>
      </div>
    );
  }

  const pendingSubs = submissions.filter((s) => s.status === 'pending');
  const pendingReviews = reviews.filter((r) => r.status === 'pending');

  return (
    <div className="min-h-screen bg-surface-0 text-foreground">
      <header className="border-b border-white/10 bg-surface-1">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-bold">Admin</h1>
            <p className="text-2xs text-zinc-500">
              Moderation and site operations ·{' '}
              <Link href="/" className="underline hover:text-zinc-300">
                View site
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-2xs font-semibold text-zinc-300 hover:bg-white/5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              Refresh
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-2xs font-semibold text-rose-400 hover:bg-white/5"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Sign out
            </button>
          </div>
        </div>
      </header>

      {toast && (
        <div
          role="status"
          className={`mx-auto mt-4 max-w-6xl rounded-xl border px-4 py-3 text-sm font-semibold ${
            toast.kind === 'ok'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          {toast.text}
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-6">
        <nav className="flex flex-wrap gap-2" aria-label="Admin sections">
          {TABS.map(({ id, label, icon: Icon }) => {
            const count = id === 'submissions' ? pendingSubs.length : id === 'reviews' ? pendingReviews.length : 0;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                aria-current={tab === id ? 'page' : undefined}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-2xs font-bold transition-colors ${
                  tab === id
                    ? 'border-accent-500 bg-accent-500/15 text-accent-300'
                    : 'border-white/10 bg-surface-1 text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
                {count > 0 && (
                  <span className="rounded-full bg-rose-500 px-1.5 font-mono text-2xs tabular-nums text-white">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <main id="main" className="mt-6">
          {/* Submissions */}
          {/* v2.8 Overview dashboard */}
          {tab === 'overview' && (
            <section>
              <h2 className="mb-4 text-lg font-bold">Site overview</h2>
              {!stats || !stats.catalog ? (
                <p className="rounded-xl border border-white/10 bg-surface-1 p-6 text-sm text-zinc-500">
                  Stats unavailable (database not configured or still loading).
                </p>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: 'Tools catalogued', value: stats.catalog?.total ?? 0, tint: 'text-accent-300' },
                      { label: 'Pricing-verified', value: stats.catalog?.pricingVerified ?? 0, tint: 'text-emerald-300' },
                      { label: 'Hands-on tested', value: stats.catalog?.handsOnTested ?? 0, tint: 'text-emerald-300' },
                      { label: 'Listed only', value: stats.catalog?.listedOnly ?? 0, tint: 'text-zinc-400' },
                    ].map((c) => (
                      <div key={c.label} className="rounded-xl border border-white/10 bg-surface-1 p-4">
                        <p className={`font-mono text-2xl font-black tabular-nums ${c.tint}`}>{c.value}</p>
                        <p className="mt-1 text-2xs text-zinc-500">{c.label}</p>
                      </div>
                    ))}
                    {[
                      { label: 'Submissions pending', value: stats.db?.submissionsPending ?? 0, tint: 'text-accent-300' },
                      { label: 'Reviews pending', value: stats.db?.reviewsPending ?? 0, tint: 'text-accent-300' },
                      { label: 'News items (auto)', value: stats.db?.newsApproved ?? 0, tint: 'text-emerald-300' },
                      { label: 'News live', value: stats.db?.newsApproved ?? 0, tint: 'text-emerald-300' },
                      { label: 'Newsletter confirmed', value: stats.db?.newsletterConfirmed ?? 0, tint: 'text-emerald-300' },
                      { label: 'Newsletter waiting', value: stats.db?.newsletterWaiting ?? 0, tint: 'text-zinc-400' },
                      { label: 'Poll — Scripting', value: stats.db?.poll?.writing ?? 0, tint: 'text-rose-300' },
                      { label: 'Poll — Editing', value: stats.db?.poll?.editing ?? 0, tint: 'text-emerald-300' },
                      { label: 'Poll — Voiceover', value: stats.db?.poll?.voiceover ?? 0, tint: 'text-cyan-300' },
                      { label: 'Poll — Thumbnails', value: stats.db?.poll?.thumbnails ?? 0, tint: 'text-violet-300' },
                    ].map((c) => (
                      <div key={c.label} className="rounded-xl border border-white/10 bg-surface-1 p-4">
                        <p className={`font-mono text-2xl font-black tabular-nums ${c.tint}`}>
                          {stats.db?.configured ? c.value : '—'}
                        </p>
                        <p className="mt-1 text-2xs text-zinc-500">{c.label}</p>
                      </div>
                    ))}
                  </div>
                  {!stats.db?.configured && (
                    <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-2xs leading-relaxed text-amber-200/80">
                      Supabase is not configured for this session — DB-side counters show “—”. The
                      catalog counters above always work.
                    </p>
                  )}
                  <p className="mt-4 text-2xs leading-relaxed text-zinc-500">
                    Quick actions: review{' '}
                    <button onClick={() => setTab('news')} className="text-accent-400 underline">
                      the news queue
                    </button>{' '}
                    or run an ingestion right now from the News Queue tab (“Ingest now”).
                  </p>
                </>
              )}
            </section>
          )}

          {tab === 'submissions' && (
            <section>
              <h2 className="mb-4 text-lg font-bold">Tool submissions</h2>

              <div className="mb-4 flex items-start gap-2 rounded-xl border border-accent-500/20 bg-accent-500/5 p-4 text-2xs leading-relaxed text-zinc-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" aria-hidden="true" />
                <p>
                  <strong>Note:</strong> tool pages are statically generated from{' '}
                  <code className="rounded bg-surface-2 px-1">src/data/tools.ts</code> with{' '}
                  <code className="rounded bg-surface-2 px-1">dynamicParams = false</code>. Approving
                  here records the submission, but the tool will not have a live page until it is
                  added to the data file and the site is redeployed. See{' '}
                  <code className="rounded bg-surface-2 px-1">DEPLOYMENT.md</code> for why this
                  trade-off was kept.
                </p>
              </div>

              {submissions.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-surface-1 p-6 text-sm text-zinc-500">
                  No submissions yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {submissions.map((s) => (
                    <li key={s.id} className="rounded-xl border border-white/10 bg-surface-1 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-bold text-white">{s.tool_name}</h3>
                          <p className="mt-0.5 text-2xs text-zinc-400">{s.tagline}</p>
                          <a
                            href={s.website_url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="mt-1 inline-flex items-center gap-1 text-2xs text-accent-400 hover:underline"
                          >
                            {s.website_url}
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                          <p className="mt-1.5 text-2xs text-zinc-500">
                            {s.category} · {s.pricing} · {s.founder_email}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-1 text-2xs font-bold ${
                              s.status === 'pending'
                                ? 'bg-accent-500/15 text-accent-300'
                                : s.status === 'approved'
                                  ? 'bg-emerald-500/15 text-emerald-300'
                                  : 'bg-zinc-500/15 text-zinc-400'
                            }`}
                          >
                            {s.status}
                          </span>
                          {s.status === 'pending' && (
                            <>
                              <button
                                onClick={() => actOnSubmission(s, 'approve')}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-2xs font-bold text-black"
                              >
                                <Check className="h-3 w-3" aria-hidden="true" /> Approve
                              </button>
                              <button
                                onClick={() => actOnSubmission(s, 'reject')}
                                className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-2xs font-bold text-rose-400"
                              >
                                <X className="h-3 w-3" aria-hidden="true" /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* Reviews */}
          {tab === 'reviews' && (
            <section>
              <h2 className="mb-4 text-lg font-bold">Community reviews</h2>
              <p className="mb-4 text-2xs leading-relaxed text-zinc-500">
                Reviews are created with status <code className="rounded bg-surface-2 px-1">pending</code> and
                only appear on the site once approved. Approved reviews are the only source for
                structured-data ratings, so keep this list honest.
              </p>

              {reviews.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-surface-1 p-6 text-sm text-zinc-500">
                  No reviews yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {reviews.map((r) => (
                    <li key={r.id} className="rounded-xl border border-white/10 bg-surface-1 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold tabular-nums text-accent-400">
                              {r.rating}/5
                            </span>
                            <h3 className="font-bold text-white">{r.title}</h3>
                          </div>
                          <p className="mt-1 text-2xs text-zinc-400">{r.body}</p>
                          <p className="mt-1.5 text-2xs text-zinc-500">
                            {r.author_name} · {r.tool_slug} ·{' '}
                            {new Date(r.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-1 text-2xs font-bold ${
                              r.status === 'pending'
                                ? 'bg-accent-500/15 text-accent-300'
                                : r.status === 'approved'
                                  ? 'bg-emerald-500/15 text-emerald-300'
                                  : 'bg-zinc-500/15 text-zinc-400'
                            }`}
                          >
                            {r.status}
                          </span>
                          {r.status !== 'approved' && (
                            <button
                              onClick={() => moderateReview(r.id, 'approved')}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-2xs font-bold text-black"
                            >
                              <Check className="h-3 w-3" aria-hidden="true" /> Approve
                            </button>
                          )}
                          {r.status !== 'rejected' && (
                            <button
                              onClick={() => moderateReview(r.id, 'rejected')}
                              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-2xs font-bold text-rose-400"
                            >
                              <X className="h-3 w-3" aria-hidden="true" /> Reject
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* News editorial queue — migration 0006 */}
          {tab === 'news' && (
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold">
                  News feed{' '}
                  <span className="ml-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-2xs font-bold tabular-nums text-emerald-300">
                    auto-published
                  </span>
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={ingestNow}
                    disabled={ingestBusy}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-accent-500 px-3 py-1.5 text-2xs font-bold text-black disabled:opacity-50"
                  >
                    {ingestBusy ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> : <Download className="h-3 w-3" aria-hidden="true" />}
                    Ingest now
                  </button>
                </div>
              </div>
              <p className="mb-4 text-2xs leading-relaxed text-zinc-500">
                v3 (2026-08-08): the manual approval gate was removed. Items that pass the
                automated creator-relevance gate are published to{' '}
                <code className="rounded bg-surface-2 px-1">/news</code> automatically — the hourly
                cron (or “Ingest now”) inserts them as live. This list is read-only for monitoring;
                nothing here needs approval.
              </p>

              {news.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-surface-1 p-6 text-sm text-zinc-500">
                  No news items yet. Run the refresh cron or{' '}
                  <code className="rounded bg-surface-2 px-1">GET /api/news/refresh</code> with the
                  cron secret to ingest fresh stories.
                </p>
              ) : (
                <ul className="space-y-3">
                  {news.map((n) => (
                    <li key={n.slug} className="rounded-xl border border-white/10 bg-surface-1 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 max-w-2xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-white">{n.title}</h3>
                            {n.ai_summarized && (
                              <span className="rounded-md bg-cyan-500/15 px-2 py-0.5 text-2xs font-bold text-cyan-300">
                                AI summary
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-2xs leading-relaxed text-zinc-400">{n.excerpt}</p>
                          <p className="mt-1.5 text-2xs text-zinc-500">
                            {n.source} · {n.category} ·{' '}
                            {new Date(n.published_at).toLocaleDateString()} ·{' '}
                            <a
                              href={n.source_url}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="inline-flex items-center gap-1 text-accent-400 hover:text-accent-300"
                            >
                              original <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            </a>
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-2xs font-bold text-emerald-300">
                            live
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* Announcement */}
          {tab === 'announcement' && (
            <section className="max-w-2xl">
              <h2 className="mb-2 text-lg font-bold">Site announcement</h2>
              <p className="mb-5 text-2xs leading-relaxed text-zinc-500">
                These are the only settings still wired to the live site. The old Design and Content
                tabs edited values that nothing rendered, so they were removed rather than left to
                imply they worked.
              </p>

              <div className="space-y-4 rounded-xl border border-white/10 bg-surface-1 p-6">
                <div>
                  <label htmlFor="a-enabled" className="block text-2xs font-semibold text-zinc-400">
                    Visible on site
                  </label>
                  <select
                    id="a-enabled"
                    value={announcement.announcement_enabled}
                    onChange={(e) =>
                      setAnnouncement({ ...announcement, announcement_enabled: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-surface-2 px-4 py-2.5 text-sm text-white focus:border-accent-500 focus:outline-none"
                  >
                    <option value="false">Hidden</option>
                    <option value="true">Visible</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="a-title" className="block text-2xs font-semibold text-zinc-400">
                    Title
                  </label>
                  <input
                    id="a-title"
                    value={announcement.announcement_title}
                    onChange={(e) =>
                      setAnnouncement({ ...announcement, announcement_title: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-surface-2 px-4 py-2.5 text-sm text-white focus:border-accent-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="a-desc" className="block text-2xs font-semibold text-zinc-400">
                    Description
                  </label>
                  <textarea
                    id="a-desc"
                    rows={3}
                    value={announcement.announcement_desc}
                    onChange={(e) =>
                      setAnnouncement({ ...announcement, announcement_desc: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-surface-2 px-4 py-2.5 text-sm text-white focus:border-accent-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={saveAnnouncement}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-5 py-2.5 text-2xs font-bold text-black disabled:opacity-60"
                >
                  {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                  Save
                </button>
              </div>
            </section>
          )}

          {/* Translation engine — admin-managed provider keys */}
          {tab === 'i18n' && (
            <section className="max-w-2xl">
              <h2 className="mb-2 text-lg font-bold">Translation engine</h2>
              <p className="mb-5 text-2xs leading-relaxed text-zinc-500">
                Configure which AI provider translates new content (tool long descriptions, news,
                blog bodies). Keys are stored in the database and used server-side only — they are
                never shown in full or exposed to visitors. Env vars (if set) override these.
              </p>

              <div className="space-y-4 rounded-xl border border-white/10 bg-surface-1 p-6">
                <div>
                  <label htmlFor="i18n-provider" className="block text-2xs font-semibold text-zinc-400">
                    Provider
                  </label>
                  <select
                    id="i18n-provider"
                    value={i18n.provider}
                    onChange={(e) => setI18n({ ...i18n, provider: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-surface-2 px-4 py-2.5 text-sm text-white focus:border-accent-500 focus:outline-none"
                  >
                    <option value="">Auto-detect</option>
                    <option value="gemini">Google Gemini (free tier)</option>
                    <option value="openrouter">OpenRouter (free models)</option>
                    <option value="openai">OpenAI (paid)</option>
                  </select>
                  {i18n.effective && (
                    <p className="mt-1.5 text-2xs text-zinc-500">
                      Currently active: <span className="font-mono text-accent-300">{i18n.effective}</span>
                      {i18n.effectiveModel ? ` · ${i18n.effectiveModel}` : ''}
                      {i18n.env.provider ? ` · forced by env (${i18n.env.provider})` : ''}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="i18n-gemini" className="block text-2xs font-semibold text-zinc-400">
                    Gemini API key <span className="text-zinc-600">(free — aistudio.google.com)</span>
                  </label>
                  <input
                    id="i18n-gemini"
                    type="password"
                    autoComplete="off"
                    placeholder={i18n.effective === 'gemini' && !i18n.env.hasGemini ? 'Already set (••••) — type to replace' : 'Paste GEMINI_API_KEY'}
                    value={i18n.geminiApiKey}
                    onChange={(e) => setI18n({ ...i18n, geminiApiKey: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-surface-2 px-4 py-2.5 text-sm text-white focus:border-accent-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="i18n-openrouter" className="block text-2xs font-semibold text-zinc-400">
                    OpenRouter API key <span className="text-zinc-600">(free — openrouter.ai)</span>
                  </label>
                  <input
                    id="i18n-openrouter"
                    type="password"
                    autoComplete="off"
                    placeholder={i18n.effective === 'openrouter' && !i18n.env.hasOpenRouter ? 'Already set (••••) — type to replace' : 'Paste OPENROUTER_API_KEY'}
                    value={i18n.openrouterApiKey}
                    onChange={(e) => setI18n({ ...i18n, openrouterApiKey: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-surface-2 px-4 py-2.5 text-sm text-white focus:border-accent-500 focus:outline-none"
                  />
                  <input
                    placeholder="Model (default google/gemini-2.0-flash-exp:free)"
                    value={i18n.openrouterModel}
                    onChange={(e) => setI18n({ ...i18n, openrouterModel: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-surface-2 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-accent-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="i18n-openai" className="block text-2xs font-semibold text-zinc-400">
                    OpenAI API key <span className="text-zinc-600">(paid — ~$2–3 for the whole catalog)</span>
                  </label>
                  <input
                    id="i18n-openai"
                    type="password"
                    autoComplete="off"
                    placeholder={i18n.effective === 'openai' && !i18n.env.hasOpenAI ? 'Already set (••••) — type to replace' : 'Paste OPENAI_API_KEY'}
                    value={i18n.openaiApiKey}
                    onChange={(e) => setI18n({ ...i18n, openaiApiKey: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-surface-2 px-4 py-2.5 text-sm text-white focus:border-accent-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={saveI18n}
                    disabled={i18nBusy}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-5 py-2.5 text-2xs font-bold text-black disabled:opacity-60"
                  >
                    {i18nBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                    Save keys
                  </button>
                  <button
                    onClick={testI18n}
                    disabled={i18nBusy}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 text-2xs font-bold text-zinc-300 hover:bg-white/5 disabled:opacity-60"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Test connection
                  </button>
                </div>

                {i18nTest && (
                  <p
                    role="status"
                    className={`rounded-xl border px-4 py-3 text-2xs font-semibold ${
                      i18nTest.ok
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                    }`}
                  >
                    {i18nTest.message}
                  </p>
                )}

                <p className="border-t border-white/5 pt-3 text-2xs leading-relaxed text-zinc-600">
                  After saving, run the backfill once to translate the long descriptions that are
                  still in English: on GitHub → Actions → <span className="font-mono text-zinc-400">Auto-Translate Content</span> → Run workflow → limit{' '}
                  <span className="font-mono text-zinc-400">500</span>. The daily cron keeps new
                  content translated automatically.
                </p>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
