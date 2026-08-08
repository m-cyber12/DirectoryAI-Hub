'use client';

import React, { useState } from 'react';
import { ALL_TOOLS } from '@/data/tools';
import { CheckCircle2, Loader2, ShieldCheck, Mail, Globe, User, AlertCircle } from 'lucide-react';

/**
 * FounderClaimForm — audit fix 2.2.
 *
 * Before, submitting only ran a setTimeout and showed a fake success screen
 * ("we sent a verification link"). Nothing was stored and no email existed.
 *
 * Now it POSTs to /api/founders/claim, which records the claim in the
 * `founder_claims` table (pending) for admin review. We no longer claim a
 * verification email was sent — the honest copy states the claim is recorded
 * and ownership is verified before a badge is granted. If no database is
 * configured, the API returns an explicit error and the form shows it.
 */
export function FounderClaimForm() {
  const [slug, setSlug] = useState(ALL_TOOLS[0]?.slug || '');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Founder / CEO');
  const [notes, setNotes] = useState('');
  const [willEmbedBadge, setWillEmbedBadge] = useState(true);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const selectedTool = ALL_TOOLS.find((t) => t.slug === slug);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');
    try {
      const res = await fetch('/api/founders/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_slug: slug, email, role, notes, willEmbedBadge }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit your claim.');
      setStatus('success');
      setMessage(data.message || 'Your claim has been recorded.');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
        <h3 className="text-lg font-bold text-emerald-300">Claim Recorded</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-300">
          We have your claim for <span className="font-bold text-white">{selectedTool?.name}</span>. Our team will
          verify you own this tool before granting a badge, and we will reply to{' '}
          <span className="font-bold text-white">{email}</span>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white/10 bg-surface-1 p-6 sm:p-8">
      <div>
        <label htmlFor="fc-tool" className="mb-1.5 block text-xs font-bold text-zinc-300">
          Select Your Listed Tool *
        </label>
        <select
          id="fc-tool"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-accent-500 focus:outline-none"
        >
          {ALL_TOOLS.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.name} ({t.category})
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fc-email" className="mb-1.5 block text-xs font-bold text-zinc-300">
            Official Company Email *
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
            <input
              id="fc-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourdomain.com"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:border-accent-500 focus:outline-none"
            />
          </div>
          <p className="mt-1 text-2xs text-zinc-500">
            <Globe className="mr-1 inline h-3 w-3 text-zinc-500" />
            Must match the domain of {selectedTool?.url || 'your tool'}.
          </p>
        </div>

        <div>
          <label htmlFor="fc-role" className="mb-1.5 block text-xs font-bold text-zinc-300">
            Your Role *
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
            <select
              id="fc-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white focus:border-accent-500 focus:outline-none"
            >
              <option value="Founder / CEO">Founder / CEO</option>
              <option value="Co-Founder">Co-Founder</option>
              <option value="Head of Growth / Marketing">Head of Growth / Marketing</option>
              <option value="Product Manager">Product Manager</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="fc-notes" className="mb-1.5 block text-xs font-bold text-zinc-300">
          Update Request or Note (Optional)
        </label>
        <textarea
          id="fc-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Let us know if your pricing, tagline, or features need immediate updating..."
          className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-sm text-white placeholder-zinc-500 focus:border-accent-500 focus:outline-none"
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-accent-500/30 bg-accent-500/10 p-4">
        <input
          type="checkbox"
          checked={willEmbedBadge}
          onChange={(e) => setWillEmbedBadge(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-accent-500"
        />
        <span className="text-xs leading-relaxed text-zinc-300">
          <span className="inline-flex items-center gap-1 font-bold text-accent-300">
            <ShieldCheck className="h-3.5 w-3.5" /> Priority Review + Backlink Badge
          </span>{' '}
          — I will embed the CreatorAI Hub badge on our landing page or press room in exchange for priority editorial
          benchmark testing.
        </span>
      </label>

      {status === 'error' && (
        <p role="alert" className="flex items-start gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-2xs font-semibold text-rose-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 py-3.5 text-sm font-bold text-black hover:bg-accent-400 disabled:opacity-50 transition-colors"
      >
        {status === 'submitting' && <Loader2 className="h-4 w-4 animate-spin" />}
        Claim Official Profile &amp; Badge
      </button>
    </form>
  );
}
