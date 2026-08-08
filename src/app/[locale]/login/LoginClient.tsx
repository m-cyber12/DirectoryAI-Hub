"use client";

import React, { useState } from 'react';
import Link from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AppProviders';
import { Mail, Loader2, CheckCircle2, Zap, AlertCircle } from 'lucide-react';

export function LoginClient({ nextPath = '/account' }: { nextPath?: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const { user } = useAuth();
  const router = useRouter();
  const next = nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/account';

  if (user) {
    router.replace(next);
    return null;
  }

  const supabaseReady = !!supabase;

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setStatus('sending');
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}${next}` : undefined },
    });
    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    } else {
      setStatus('sent');
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 text-white flex flex-col">
      <Header />
      <main id="main" className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-8 backdrop-blur-xl">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500 text-black">
                <Zap className="h-6 w-6 text-black" />
              </div>
              <h1 className="text-2xl font-black">Welcome to CreatorAI Hub</h1>
              <p className="mt-1 text-xs text-zinc-500">
                Sync your saved tools, post reviews, and get early access to deals. No password needed.
              </p>
            </div>

            {!supabaseReady && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-2xs text-amber-300">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Auth backend not configured yet. Add <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
                  <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in Vercel, then run{' '}
                  <code className="font-mono">supabase-launch-upgrade.sql</code>. Bookmarks still work locally.
                </span>
              </div>
            )}

            {status === 'sent' ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
                <p className="text-sm font-bold text-emerald-300">Magic link sent!</p>
                <p className="mt-1 text-xs text-zinc-400">Check <span className="font-semibold text-white">{email}</span> and click the link to sign in.</p>
              </div>
            ) : (
              <>
                <form onSubmit={sendMagicLink} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full rounded-xl border border-white/10 bg-zinc-950 py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:border-accent-500 focus:outline-none"
                    />
                  </div>
                  {status === 'error' && <p className="text-xs font-semibold text-rose-400">{errorMsg}</p>}
                  <button
                    type="submit"
                    disabled={!supabaseReady || status === 'sending'}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 py-3 text-sm font-bold text-black hover:bg-accent-400 disabled:opacity-40 transition-colors"
                  >
                    {status === 'sending' && <Loader2 className="h-4 w-4 animate-spin" />}
                    Send Magic Link
                  </button>
                </form>
              </>
            )}

            <p className="mt-6 text-center text-2xs leading-relaxed text-zinc-600">
              By continuing you agree to our <Link href="/terms" className="underline hover:text-zinc-400">Terms</Link> and{' '}
              <Link href="/privacy" className="underline hover:text-zinc-400">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
