"use client";

import React, { useEffect, useState } from 'react';
import Link from '@/i18n/navigation';
import { Star, MessageSquarePlus, Loader2, CheckCircle2, ThumbsUp } from 'lucide-react';
import { useAuth } from '@/context/AppProviders';

interface Review {
  id: string;
  tool_slug: string;
  rating: number;
  title: string;
  body: string;
  author_name: string;
  helpful_count: number;
  created_at: string;
}

export function ReviewSection({ toolSlug, toolName }: { toolSlug: string; toolName: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [helpfulVoted, setHelpfulVoted] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/reviews?tool=${encodeURIComponent(toolSlug)}`)
      .then((r) => r.json())
      .then((d) => setReviews(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
    try {
      const raw = localStorage.getItem('cah_helpful');
      if (raw) setHelpfulVoted(JSON.parse(raw));
    } catch {}
  }, [toolSlug]);

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_slug: toolSlug,
          rating,
          title: title.trim(),
          body: body.trim(),
          author_name: authorName.trim() || user?.email?.split('@')[0] || 'Anonymous Creator',
          user_id: user?.id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');
      setStatus('success');
      if (data.review) setReviews((prev) => [data.review, ...prev]);
      setTimeout(() => { setFormOpen(false); setStatus('idle'); setTitle(''); setBody(''); }, 2000);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  const markHelpful = async (id: string) => {
    if (helpfulVoted.includes(id)) return;
    const next = [...helpfulVoted, id];
    setHelpfulVoted(next);
    try { localStorage.setItem('cah_helpful', JSON.stringify(next)); } catch {}
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, helpful_count: (r.helpful_count || 0) + 1 } : r)));
    fetch('/api/reviews', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'helpful' }) }).catch(() => {});
  };

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold">Community Reviews</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {avg ? <>Average <span className="font-bold text-amber-400">{avg}★</span> from {reviews.length} creator {reviews.length === 1 ? 'review' : 'reviews'}</> : `Be the first creator to review ${toolName}.`}
          </p>
        </div>
        <button
          onClick={() => setFormOpen(!formOpen)}
          className="inline-flex items-center gap-2 rounded-xl border border-accent-500/30 bg-accent-500/10 px-4 py-2.5 text-xs font-bold text-accent-300 hover:bg-accent-500/20 transition-colors"
        >
          <MessageSquarePlus className="h-4 w-4" /> Write a Review
        </button>
      </div>

      {formOpen && (
        <form onSubmit={submit} className="mb-6 rounded-3xl border border-accent-500/20 bg-zinc-900/60 p-6 space-y-4">
          {!user && (
            <p className="text-2xs text-zinc-500">
              Tip: <Link href="/login" className="text-accent-400 underline">sign in</Link> to attach reviews to your account — or post as a guest below.
            </p>
          )}
          <div>
            <span id="rating-label" className="mb-1.5 block text-xs font-bold text-zinc-300">Your rating</span>
            <div className="flex items-center gap-1" role="group" aria-labelledby="rating-label">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`${s} stars`}
                >
                  <Star className={`h-6 w-6 transition-colors ${s <= (hover || rating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
                </button>
              ))}
              <span className="ml-2 text-sm font-bold text-white">{hover || rating}/5</span>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text" required maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Review title (e.g. 'Cut my editing time in half')"
              className="rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-accent-500 focus:outline-none"
            />
            <input
              type="text" maxLength={40} value={authorName} onChange={(e) => setAuthorName(e.target.value)}
              placeholder={user?.email ? `Display name (default: ${user.email.split('@')[0]})` : 'Your name (optional)'}
              className="rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-accent-500 focus:outline-none"
            />
          </div>
          <textarea
            required minLength={20} maxLength={1200} rows={4} value={body} onChange={(e) => setBody(e.target.value)}
            placeholder="What did you use it for? What worked well? What frustrated you? (min 20 characters)"
            className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-accent-500 focus:outline-none"
          />
          {status === 'error' && <p className="text-xs font-semibold text-rose-400">{errorMsg}</p>}
          {status === 'success' ? (
            <p className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Review submitted — thank you!</p>
          ) : (
            <button
              type="submit" disabled={status === 'submitting'}
              className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-6 py-3 text-sm font-bold text-black hover:bg-accent-400 disabled:opacity-50 transition-colors"
            >
              {status === 'submitting' && <Loader2 className="h-4 w-4 animate-spin" />} Submit Review
            </button>
          )}
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-900/60" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/30 p-8 text-center text-sm text-zinc-500">
          No community reviews yet — your experience could help thousands of creators.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <article key={r.id} className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-3.5 w-3.5 ${s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
                  ))}
                </div>
                <h3 className="text-sm font-bold text-white">{r.title}</h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">{r.body}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-2xs text-zinc-500">
                  {r.author_name} · {new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
                <button
                  onClick={() => markHelpful(r.id)}
                  disabled={helpfulVoted.includes(r.id)}
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-2xs font-semibold transition-colors ${
                    helpfulVoted.includes(r.id) ? 'text-accent-400' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <ThumbsUp className="h-3 w-3" /> Helpful ({r.helpful_count || 0})
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
