import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CalculatorsClient } from './CalculatorsClient';
import { Calculator, ShieldCheck, DollarSign, Clock, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Free Interactive Creator Calculators — Stack Cost, Time Saved & Copyright',
  description:
    'Free AI calculators for video creators: compute your exact monthly tool budget, measure time & dollars saved, and verify copyright & YouTube monetization rights.',
  alternates: { canonical: '/calculators' },
  openGraph: {
    title: 'Free Interactive Creator Calculators — Stack Cost, Time Saved & Copyright',
    description:
      'Compute your monthly tool budget, estimate time & dollars saved, and check copyright & monetization rights.',
    type: 'website',
  },
};

export default function CalculatorsPage() {
  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <Header />

      <main id="main" className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/10">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-500/10 border border-accent-500/20 px-4 py-1.5 text-xs font-semibold text-accent-300 mb-4">
              <Sparkles className="h-3.5 w-3.5" /> Free Interactive Creator Tools
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">Creator AI Calculators</h1>
            <p className="mt-3 max-w-2xl text-sm text-zinc-400 leading-relaxed">
              Calculate your optimal AI stack budget, estimate hours saved per week, and verify commercial YouTube
              monetization rights across top AI video tools.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-surface-1 border border-white/10 rounded-2xl px-5 py-3">
            <Calculator className="h-6 w-6 text-accent-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">100% Free &amp; Instant</div>
              <div className="text-2xs text-zinc-500">Live pricing &amp; copyright database</div>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <CalculatorsClient />
        </div>
      </main>

      <Footer />
    </div>
  );
}
