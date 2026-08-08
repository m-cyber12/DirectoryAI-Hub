'use client';

import React, { useState, useId } from 'react';
import Link from '@/i18n/navigation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Audit fixes 4.2, 4.6, 6.5.
 *  - Adds the honeypot field the API expects for bot filtering.
 *  - Error state used absolute positioning with a magic `mt-14` offset that
 *    overlapped adjacent content; it is now in normal flow with role="alert".
 *  - Copy reflects double opt-in ("check your inbox") instead of promising
 *    immediate membership of a "Founding 500" that had no system behind it.
 */
export function NewsletterForm({ source = 'homepage' }: { source?: string }) {
  const t = useTranslations('newsletter');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const inputId = useId();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source, website: honeypot }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Subscription failed');
      setStatus('success');
      setMessage(data.message || t('success'));
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : t('error'));
    }
  };

  if (status === 'success') {
    return (
      <p
        role="status"
        className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4 text-sm font-bold text-emerald-300"
      >
        <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
        {message}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <form className="flex gap-2" onSubmit={submit}>
        <label htmlFor={inputId} className="sr-only">
          {t('label')}
        </label>
        <input
          id={inputId}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('placeholder')}
          aria-invalid={status === 'error'}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-surface-2 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
        />

        {/* Honeypot — hidden from humans, irresistible to bots. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
        />

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-accent-500 px-6 py-3 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {status === 'submitting' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {status === 'submitting' ? t('joining') : t('button')}
        </button>
      </form>

      {status === 'error' && (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-2xs font-semibold text-rose-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {message}
        </p>
      )}

      <p className="mt-2 text-2xs leading-relaxed text-zinc-500">
        {t('doubleOptIn')}{' '}
        <Link href="/privacy" className="underline hover:text-zinc-400">
          {t('privacy')}
        </Link>
      </p>
    </div>
  );
}
