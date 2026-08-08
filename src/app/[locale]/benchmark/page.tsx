import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ALL_TOOLS, TESTED_TOOLS, hasVerifiedScore } from '@/data/tools';
import { BenchmarkLeaderboard } from '@/components/BenchmarkLeaderboard';
import { TestingQueueWidget } from '@/components/TestingQueueWidget';
import { FlaskConical, Timer, DollarSign, Ruler, ShieldCheck } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'benchmark' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: '/benchmark' },
    openGraph: { title: t('title'), description: t('description'), url: '/benchmark', type: 'website' },
  };
}

interface Brief {
  id: string;
  name: string;
  category: string;
  input: string;
  task: string;
  measures: string[];
}

const BRIEFS: Brief[] = [
  {
    id: 'B1',
    name: 'The podcast cut',
    category: 'Video Repurposing',
    input: 'One fixed 60-minute two-person podcast episode, 1080p, lavalier audio.',
    task: 'Produce the best five vertical short clips the tool can find, with captions burned in.',
    measures: [
      'Wall-clock time from upload to downloadable output',
      'Caption word error rate against a human transcript',
      'Speaker framing accuracy across cuts',
      'How many of the five clips are genuinely publishable without edits',
      'Cost in credits, converted to cost per finished clip',
    ],
  },
  {
    id: 'B2',
    name: 'The cinematic shot',
    category: 'Video Generation',
    input: 'One fixed prompt: a specific camera move, subject and lighting condition.',
    task: 'Generate the shot. Five attempts allowed, best result counts.',
    measures: [
      'Prompt adherence, scored against a written rubric',
      'Temporal coherence — when artefacts first appear',
      'Maximum usable clip length before the model drifts',
      'Whether audio is generated natively',
      'Attempts needed before one usable result, and total cost of those attempts',
    ],
  },
  {
    id: 'B3',
    name: 'The talking head',
    category: 'AI Avatars',
    input: 'One fixed 150-word educational script, English.',
    task: 'Generate a full-screen avatar speaking the script.',
    measures: [
      'Lip-sync accuracy at normal playback speed',
      'Natural eye movement and blink cadence',
      'Render time from prompt submission to finished MP4',
      'Cost per minute of finished video at the starter tier',
    ],
  },
  {
    id: 'B4',
    name: 'The clean-up',
    category: 'Voice & Audio',
    input: 'One 60-second voice recording with air-conditioning hum and room echo.',
    task: 'Clean the audio and level the voice.',
    measures: [
      'Noise reduction without audible gating artefacts',
      'Preservation of natural voice timbre',
      'Processing time',
    ],
  },
  {
    id: 'B5',
    name: 'The dub',
    category: 'Voice & Audio',
    input: 'One 60-second English talking-head clip.',
    task: 'Dub into Spanish with voice cloning.',
    measures: [
      'Voice likeness to the original English speaker',
      'Natural Spanish prosody and pacing',
      'Whether commercial rights are included at the tier tested',
      'Cost per finished audio minute',
    ],
  },
];

const METRIC_ICONS = [Timer, Ruler, DollarSign, ShieldCheck];

export default async function BenchmarkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'benchmark' });

  const testedCount = ALL_TOOLS.filter(hasVerifiedScore).length;

  return (
    <div className="min-h-screen bg-surface-0 text-foreground">
      <Header />

      <main id="main" className="mx-auto max-w-4xl px-4 py-12">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-500/20 bg-accent-500/10 px-4 py-1.5 text-2xs font-bold text-accent-400">
          <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" /> Benchmark Lab
        </span>

        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{t('heading')}</h1>

        <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-300">
          Marketing pages all claim the same things. The only way to compare tools honestly is to
          give them identical work and publish what comes back. Below are the five standard briefs
          we run, the exact measurements we record, and — importantly — how far through the
          programme we actually are.
        </p>

        {/* Honest status board */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-surface-1 p-6">
          <h2 className="text-lg font-bold">Current status</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-2xs uppercase tracking-wider text-zinc-500">Tools catalogued</dt>
              <dd className="mt-1 font-mono text-2xl font-black tabular-nums text-white">
                {ALL_TOOLS.length}
              </dd>
            </div>
            <div>
              <dt className="text-2xs uppercase tracking-wider text-zinc-500">Hands-on tested</dt>
              <dd className="mt-1 font-mono text-2xl font-black tabular-nums text-emerald-400">
                {testedCount}
              </dd>
            </div>
            <div>
              <dt className="text-2xs uppercase tracking-wider text-zinc-500">Standard briefs</dt>
              <dd className="mt-1 font-mono text-2xl font-black tabular-nums text-accent-400">
                {BRIEFS.length}
              </dd>
            </div>
          </dl>

          {testedCount > 0 ? (
            <p className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm leading-relaxed text-zinc-300">
              <strong className="text-emerald-400 font-extrabold">{testedCount} core AI video tools have completed our 24-point benchmark brief.</strong> We publish transparent sub-scores across Output Quality, Speed, Value for Money, Ease of Use, and Export Freedom.
            </p>
          ) : (
            <p className="mt-5 rounded-xl border border-accent-500/20 bg-accent-500/5 p-4 text-sm leading-relaxed text-zinc-300">
              <strong className="text-accent-300">We are at the start of this.</strong> No tool has
              completed a full brief yet, so no tool on this site carries a numeric score. We would
              rather show an empty scoreboard than a full one we invented — every listing says
              plainly whether it has been tested, price-checked, or simply catalogued.
            </p>
          )}
        </section>

        {/* Hands-on Benchmark Leaderboard */}
        {testedCount > 0 && (
          <section className="mt-10">
            <BenchmarkLeaderboard tools={TESTED_TOOLS} />
          </section>
        )}

        {/* Public Testing Queue */}
        <section className="mt-10">
          <TestingQueueWidget />
        </section>

        {/* The briefs */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold">The five standard briefs</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Every tool in a category receives byte-identical input. No tool gets a second chance the
            others did not get.
          </p>

          <ol className="mt-6 space-y-5">
            {BRIEFS.map((brief) => (
              <li key={brief.id} className="rounded-2xl border border-white/10 bg-surface-1 p-6">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="rounded-md bg-accent-500/15 px-2 py-1 font-mono text-2xs font-bold text-accent-300">
                    {brief.id}
                  </span>
                  <h3 className="text-lg font-bold">{brief.name}</h3>
                  <Link
                    href={`/tools?category=${encodeURIComponent(brief.category)}`}
                    className="text-2xs text-zinc-500 underline hover:text-accent-400"
                  >
                    {brief.category}
                  </Link>
                </div>

                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-2xs font-bold uppercase tracking-wider text-zinc-500">
                      Fixed input
                    </dt>
                    <dd className="mt-0.5 text-zinc-300">{brief.input}</dd>
                  </div>
                  <div>
                    <dt className="text-2xs font-bold uppercase tracking-wider text-zinc-500">
                      Task
                    </dt>
                    <dd className="mt-0.5 text-zinc-300">{brief.task}</dd>
                  </div>
                  <div>
                    <dt className="text-2xs font-bold uppercase tracking-wider text-zinc-500">
                      What we record
                    </dt>
                    <dd className="mt-1.5">
                      <ul className="space-y-1.5">
                        {brief.measures.map((m) => (
                          <li key={m} className="flex gap-2 text-zinc-300">
                            <span
                              aria-hidden="true"
                              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500"
                            />
                            {m}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        </section>

        {/* Scoring */}
        <section className="mt-10 rounded-2xl border border-white/10 bg-surface-1 p-6">
          <h2 className="text-2xl font-bold">How scores are calculated</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Each tested tool gets five sub-scores from 0 to 10. The overall figure is a weighted
            average, computed rather than hand-adjusted, so we cannot quietly nudge a favourite
            upward.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              ['Output quality', '35%', 'How good is the result you can actually publish'],
              ['Ease of use', '20%', 'Time to a first good result without reading documentation'],
              ['Value for money', '20%', 'Output quality per dollar at the entry paid tier'],
              ['Speed', '15%', 'Wall-clock time from input to usable output'],
              ['Export freedom', '10%', 'Watermarks, resolution caps and commercial rights'],
            ].map(([label, weight, desc], i) => {
              const Icon = METRIC_ICONS[i % METRIC_ICONS.length];
              return (
                <li key={label} className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" aria-hidden="true" />
                  <span className="text-zinc-300">
                    <strong className="text-white">{label}</strong>{' '}
                    <span className="font-mono tabular-nums text-accent-400">{weight}</span> — {desc}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 border-t border-white/5 pt-4 text-2xs leading-relaxed text-zinc-500">
            We use the full range. A 5 out of 10 is a normal, useful score — if nothing ever scored
            below 7, the numbers would carry no information at all.
          </p>
        </section>

        {/* Independence */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-surface-1 p-6">
          <h2 className="text-2xl font-bold">Independence</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-300">
            <li>We pay for our own subscriptions at the tier we test.</li>
            <li>
              Vendors cannot pay for a score, a ranking position, or a re-test with a better result.
            </li>
            <li>
              If we ever accept paid placement it will be labelled &ldquo;Sponsored&rdquo; and
              excluded from scoring entirely.
            </li>
            <li>
              Where a tool has not been tested we say so, rather than filling the gap with a
              plausible-looking number.
            </li>
          </ul>
          <p className="mt-4 text-sm text-zinc-400">
            See also our{' '}
            <Link href="/disclosure" className="text-accent-400 underline hover:text-accent-300">
              affiliate disclosure
            </Link>{' '}
            and{' '}
            <Link href="/about" className="text-accent-400 underline hover:text-accent-300">
              editorial policy
            </Link>
            .
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
