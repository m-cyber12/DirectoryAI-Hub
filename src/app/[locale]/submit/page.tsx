import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SubmitForm } from './SubmitForm';

export const metadata: Metadata = {
  title: 'Submit Your AI Tool',
  description: 'Submit your AI video tool to CreatorAI Hub for editorial review. Free listings for tools that pass our quality bar, with optional featured placement.',
  alternates: { canonical: '/submit' },
};

export default function SubmitPage() {
  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <Header />
      <main id="main" className="mx-auto max-w-2xl px-4 py-14">
        <h1 className="text-3xl font-black tracking-tight mb-2">Submit Your Tool</h1>
        <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
          Building an AI tool for video creators? Submit it for editorial review. Listings are{' '}
          <span className="text-white font-semibold">free</span> if the tool passes our quality bar — we verify pricing, features, and official links for every submission before publishing. Tools selected for our Hands-On Benchmark undergo comprehensive 24-point editorial testing. Typical review time: 3–5 days.
        </p>
        <SubmitForm />
      </main>
      <Footer />
    </div>
  );
}
