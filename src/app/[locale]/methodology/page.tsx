import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FlaskConical, Timer, DollarSign, Ruler, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'methodology' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: '/methodology' },
    openGraph: { title: t('title'), description: t('description'), url: '/methodology', type: 'website' },
  };
}

const RUBRIC = [
  {
    name: 'Output Quality',
    weight: 35,
    desc: 'Resolution fidelity, temporal consistency, artifacting, lip-sync accuracy, caption correctness, and professional finish.',
  },
  {
    name: 'Speed',
    weight: 20,
    desc: 'Wall-clock time from prompt/upload to downloadable file. Measured on a standard consumer connection (100 Mbps).',
  },
  {
    name: 'Value for Money',
    weight: 20,
    desc: 'Cost per usable output, free-tier generosity, credit expiry policies, and hidden upsells.',
  },
  {
    name: 'Ease of Use',
    weight: 15,
    desc: 'Onboarding friction, UI clarity, documentation quality, and error message helpfulness.',
  },
  {
    name: 'Export Freedom',
    weight: 10,
    desc: 'Watermark status, commercial rights, resolution caps, format options, and API availability.',
  },
];

export default async function MethodologyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'methodology' });

  return (
    <div className="min-h-screen bg-surface-0 text-foreground">
      <Header />
      <main id="main" className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="mb-10">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-500/20 bg-accent-500/10 px-4 py-1.5 text-2xs font-bold text-accent-300">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" /> Editorial Protocol
          </span>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{t('heading')}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300">
            Every tool that earns a score goes through the same 24-point benchmark brief. 
            We publish the input, the settings, the raw output, and the exact rubric — 
            so you can reproduce the test or challenge our verdict.
          </p>
        </div>

        <div className="space-y-8">
          <section className="rounded-2xl border border-white/10 bg-surface-1 p-6">
            <h2 className="text-lg font-bold text-white mb-4">The 5 Dimensions</h2>
            <div className="space-y-4">
              {RUBRIC.map((r) => (
                <div key={r.name} className="flex gap-4">
                  <div className="w-16 shrink-0 text-right">
                    <span className="font-mono text-sm font-bold text-accent-400">{r.weight}%</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{r.name}</h3>
                    <p className="text-2xs text-zinc-400 mt-1">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-surface-1 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Evidence Requirements</h2>
            <ul className="space-y-3">
              {[
                'Test Run ID with date and tool version',
                'Complete input prompt or source file (downloadable)',
                'All settings and parameters used',
                'Wall-clock render time',
                'Cost in credits or USD for the test run',
                'Raw output file (video, audio, or image)',
                'Screenshot of the tool interface during generation',
                'At least one "failure" or limitation noted honestly',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-white/10 bg-surface-1 p-6">
            <h2 className="text-lg font-bold text-white mb-4">What &ldquo;Hands-On Tested&rdquo; Means</h2>
            <div className="space-y-3 text-sm text-zinc-300">
              <p>
                A tool only receives this label when a member of the editorial team has:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Created an account with their own email and payment method (where required)</li>
                <li>Run the standard brief for the category at least once</li>
                <li>Recorded all 5 dimension scores with written justification</li>
                <li>Uploaded the raw output to permanent storage with a public link</li>
                <li>Written at least 2 specific cons (no tool is perfect)</li>
              </ol>
            </div>
          </section>

          <section className="rounded-2xl border border-amber-500/20 bg-amber-950/10 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
              <div>
                <h2 className="text-lg font-bold text-amber-300">Limitations & Honesty</h2>
                <p className="mt-2 text-sm text-amber-200/70">
                  We test on English-language inputs by default. Results for Arabic, Persian, or other 
                  RTL languages may differ. We test on standard consumer hardware unless stated otherwise.
                  Scores are subjective but reproducible — two reviewers following the same brief 
                  should arrive within ±0.5 points on each dimension.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
