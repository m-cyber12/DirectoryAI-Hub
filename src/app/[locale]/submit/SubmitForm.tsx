"use client";

import React, { useState } from 'react';
import { CATEGORIES } from '@/data/tools';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';

export function SubmitForm() {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    tagline: '',
    category: CATEGORIES[1] as string,
    pricing: 'Freemium',
    founderEmail: '',
    willAddBadge: true,
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const set = (k: string, v: string | boolean) => setFormData((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to submit tool');
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message);
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-10 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
        <h2 className="text-lg font-bold text-emerald-300">Submission received!</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Our editorial team will verify <span className="font-semibold text-white">{formData.name}</span> and email{' '}
          <span className="font-semibold text-white">{formData.founderEmail}</span> within 3–5 days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sf-name" className="mb-1.5 block text-xs font-bold text-zinc-300">Tool Name *</label>
          <input
            id="sf-name"
            type="text" required maxLength={60} value={formData.name} onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. ClipGenius AI"
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-accent-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="sf-url" className="mb-1.5 block text-xs font-bold text-zinc-300">Website URL *</label>
          <input
            id="sf-url"
            type="url" required value={formData.url} onChange={(e) => set('url', e.target.value)}
            placeholder="https://yourtool.com"
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-accent-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="sf-tagline" className="mb-1.5 block text-xs font-bold text-zinc-300">One-line Tagline *</label>
        <input
          id="sf-tagline"
          type="text" required maxLength={90} value={formData.tagline} onChange={(e) => set('tagline', e.target.value)}
          placeholder="What does it do, in one sentence?"
          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-accent-500 focus:outline-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sf-category" className="mb-1.5 block text-xs font-bold text-zinc-300">Category *</label>
          <select
            id="sf-category"
            value={formData.category} onChange={(e) => set('category', e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-accent-500 focus:outline-none"
          >
            {CATEGORIES.filter((c) => c !== 'All').map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="sf-pricing" className="mb-1.5 block text-xs font-bold text-zinc-300">Pricing Model *</label>
          <select
            id="sf-pricing"
            value={formData.pricing} onChange={(e) => set('pricing', e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-accent-500 focus:outline-none"
          >
            {['Free', 'Freemium', 'Paid', 'Free Trial'].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="sf-email" className="mb-1.5 block text-xs font-bold text-zinc-300">Founder / Contact Email *</label>
        <input
          id="sf-email"
          type="email" required value={formData.founderEmail} onChange={(e) => set('founderEmail', e.target.value)}
          placeholder="you@yourtool.com"
          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-accent-500 focus:outline-none"
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-accent-500/30 bg-accent-500/10 p-4">
        <input
          type="checkbox" checked={formData.willAddBadge} onChange={(e) => set('willAddBadge', e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-accent-500"
        />
        <span className="text-xs leading-relaxed text-zinc-400">
          <span className="inline-flex items-center gap-1 font-bold text-accent-300"><ShieldCheck className="h-3.5 w-3.5" /> Verified Founder Badge</span>
          {' '}— I&apos;ll add the CreatorAI Hub badge to our site (or mention us on X) in exchange for priority review and a
          permanent verified badge on our listing.
        </span>
      </label>

      {status === 'error' && <p className="text-xs font-semibold text-rose-400">{errorMessage}</p>}

      <button
        type="submit" disabled={status === 'submitting'}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 py-3.5 text-sm font-bold text-black hover:bg-accent-400 disabled:opacity-50 transition-colors"
      >
        {status === 'submitting' && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit for Verified Listing
      </button>
      <p className="text-center text-2xs text-zinc-500">
        We verify pricing, features, and official links for every submission. Spam, dead links, and off-niche tools are rejected.
      </p>
    </form>
  );
}
