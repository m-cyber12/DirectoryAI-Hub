import type { Metadata } from 'next';
import Link from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import { hasVerifiedScore, computeOverall, type Tool } from '@/data/tools';
import { COMPARISON_PAIRS, parseComparisonSlug } from '@/lib/comparisons';
import { SITE_URL } from '@/config/site';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VerificationBadge } from '@/components/VerificationBadge';
import { SmartImage } from '@/components/SmartImage';
import { ExternalLink, Check, Minus } from 'lucide-react';

/**
 * Audit fix 3.1 — /compare/[a]-vs-[b] static comparison pages.
 *
 * These target very high-intent queries ("descript vs riverside"). Pairs are
 * curated in lib/comparisons.ts rather than generated exhaustively, because
 * hundreds of near-identical pages would be doorway pages.
 *
 * The page is honest by construction: where neither tool has been tested it
 * says so plainly and compares only facts we can actually stand behind
 * (pricing, tier model, features, export terms).
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return COMPARISON_PAIRS.map(([a, b]) => ({ pair: `${a}-vs-${b}` }));
}

function priceNum(s?: string): number | null {
  const m = s?.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>;
}): Promise<Metadata> {
  const { pair } = await params;
  const parsed = parseComparisonSlug(pair);
  if (!parsed) return { title: 'Comparison not found' };
  const { a, b } = parsed;

  return {
    title: `${a.name} vs ${b.name}: Which Should You Use in 2026?`,
    description: `${a.name} (${a.startingPrice ?? a.pricing}) compared with ${b.name} (${
      b.startingPrice ?? b.pricing
    }) on price, features, export freedom and who each one actually suits.`,
    alternates: { canonical: `/compare/${pair}` },
    openGraph: {
      title: `${a.name} vs ${b.name} (2026)`,
      description: `A side-by-side comparison of two ${a.category.toLowerCase()} tools.`,
      url: `/compare/${pair}`,
      type: 'article',
    },
  };
}

export default async function ComparePairPage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const parsed = parseComparisonSlug(pair);
  if (!parsed) notFound();
  const { a, b } = parsed;

  const aPrice = priceNum(a.startingPrice);
  const bPrice = priceNum(b.startingPrice);
  const cheaper =
    aPrice !== null && bPrice !== null ? (aPrice < bPrice ? a : bPrice < aPrice ? b : null) : null;

  const aTested = hasVerifiedScore(a);
  const bTested = hasVerifiedScore(b);
  const aScore = aTested && a.scores ? computeOverall(a.scores) : null;
  const bScore = bTested && b.scores ? computeOverall(b.scores) : null;

  // Feature matrix from tags — a real, checkable difference.
  const allTags = Array.from(new Set([...a.tags, ...b.tags])).sort();
  const uniqueToA = a.tags.filter((t) => !b.tags.includes(t));
  const uniqueToB = b.tags.filter((t) => !a.tags.includes(t));

  const rows: { label: string; a: string; b: string }[] = [
    { label: 'Category', a: a.category, b: b.category },
    { label: 'Pricing model', a: a.pricing, b: b.pricing },
    { label: 'Starting price', a: a.startingPrice ?? '—', b: b.startingPrice ?? '—' },
    {
      label: 'Our score',
      a: aScore !== null ? `${aScore.toFixed(1)}/10` : 'Not tested',
      b: bScore !== null ? `${bScore.toFixed(1)}/10` : 'Not tested',
    },
    {
      label: 'Verification',
      a: a.verificationLevel.replace(/-/g, ' '),
      b: b.verificationLevel.replace(/-/g, ' '),
    },
    { label: 'Standout metric', a: a.metrics ?? '—', b: b.metrics ?? '—' },
    { label: 'Launched', a: a.launchDate?.slice(0, 4) ?? '—', b: b.launchDate?.slice(0, 4) ?? '—' },
  ];

  const faqs = [
    {
      q: `Is ${a.name} or ${b.name} cheaper?`,
      a: cheaper
        ? `${cheaper.name} is cheaper at the entry tier — ${cheaper.startingPrice} versus ${
            cheaper.slug === a.slug ? b.startingPrice : a.startingPrice
          }. Check what each tier actually includes before deciding, since credit limits often matter more than headline price.`
        : `Both start at a similar price point (${a.startingPrice ?? a.pricing} and ${
            b.startingPrice ?? b.pricing
          }). The real cost difference will come from how each one meters usage.`,
    },
    {
      q: `What can ${a.name} do that ${b.name} cannot?`,
      a: uniqueToA.length
        ? `Based on the capabilities we track, ${a.name} covers ${uniqueToA
            .slice(0, 3)
            .join(', ')} where ${b.name} does not.`
        : `Nothing we track distinguishes ${a.name}'s feature coverage from ${b.name}'s — they overlap closely, so the decision comes down to workflow fit and price.`,
    },
    {
      q: `What can ${b.name} do that ${a.name} cannot?`,
      a: uniqueToB.length
        ? `${b.name} covers ${uniqueToB.slice(0, 3).join(', ')}, which ${a.name} does not.`
        : `Nothing we track distinguishes ${b.name}'s feature coverage from ${a.name}'s.`,
    },
  ];

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const ToolColumn = ({ tool, score }: { tool: Tool; score: number | null }) => (
    <div className="flex-1 rounded-2xl border border-white/10 bg-surface-1 p-5">
      <div className="flex items-center gap-3">
        <SmartImage
          src={tool.logo}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 rounded-xl bg-surface-2 object-cover ring-1 ring-white/10"
        />
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold">
            <Link href={`/tool/${tool.slug}`} className="hover:text-accent-300">
              {tool.name}
            </Link>
          </h2>
          <p className="truncate text-2xs text-zinc-400">{tool.tagline}</p>
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        {score !== null ? (
          <>
            <span className="font-mono text-3xl font-black tabular-nums text-emerald-400">
              {score.toFixed(1)}
            </span>
            <span className="text-2xs text-zinc-500">/10 tested</span>
          </>
        ) : (
          <VerificationBadge level={tool.verificationLevel} />
        )}
      </div>

      <p className="mt-3 font-mono text-sm tabular-nums text-emerald-400">
        {tool.startingPrice ?? tool.pricing}
      </p>

      <a
        href={`/go/${tool.slug}`}
        target="_blank"
        rel={
          tool.affiliateProgram
            ? 'noopener noreferrer nofollow sponsored'
            : 'noopener noreferrer nofollow'
        }
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-accent-500 px-4 py-2.5 text-2xs font-bold text-black hover:opacity-90"
      >
        Visit {tool.name}
        <ExternalLink className="h-3 w-3" aria-hidden="true" />
      </a>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-0 text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Header />

      <main id="main" className="mx-auto max-w-5xl px-4 py-10">
        <nav aria-label="Breadcrumb" className="mb-4 text-2xs text-zinc-500">
          <Link href="/" className="hover:text-accent-400">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href="/compare" className="hover:text-accent-400">Compare</Link>
          <span className="mx-1.5">/</span>
          <span className="text-zinc-300">{a.name} vs {b.name}</span>
        </nav>

        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          {a.name} vs {b.name}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-300">
          Both are {a.category.toLowerCase()} tools, but they suit different workflows.{' '}
          {cheaper
            ? `${cheaper.name} is the cheaper entry point; `
            : 'They start at a similar price; '}
          the sections below compare what we can actually verify — pricing, tier model and
          capability coverage.
        </p>

        {!aTested && !bTested && (
          <p className="mt-4 rounded-xl border border-white/10 bg-surface-1 px-4 py-3 text-sm text-zinc-400">
            <strong className="text-zinc-200">A note on scores:</strong> we have not yet run either
            tool hands-on, so this page compares verifiable facts rather than our opinion. We do not
            publish scores we cannot defend.
          </p>
        )}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <ToolColumn tool={a} score={aScore} />
          <div className="flex items-center justify-center px-2 text-sm font-bold text-zinc-600">
            vs
          </div>
          <ToolColumn tool={b} score={bScore} />
        </div>

        {/* Spec table */}
        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold">Side by side</h2>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[560px] text-left text-sm">
              <caption className="sr-only">{a.name} compared with {b.name}</caption>
              <thead className="bg-surface-2 text-2xs uppercase tracking-wider text-zinc-400">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold">Attribute</th>
                  <th scope="col" className="px-4 py-3 font-bold">{a.name}</th>
                  <th scope="col" className="px-4 py-3 font-bold">{b.name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((r) => (
                  <tr key={r.label}>
                    <th scope="row" className="px-4 py-3 text-left font-semibold text-zinc-400">
                      {r.label}
                    </th>
                    <td className="px-4 py-3 capitalize text-zinc-200">{r.a}</td>
                    <td className="px-4 py-3 capitalize text-zinc-200">{r.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Capability matrix */}
        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold">Capability coverage</h2>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-surface-2 text-2xs uppercase tracking-wider text-zinc-400">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold">Capability</th>
                  <th scope="col" className="px-4 py-3 text-center font-bold">{a.name}</th>
                  <th scope="col" className="px-4 py-3 text-center font-bold">{b.name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allTags.map((tag) => (
                  <tr key={tag}>
                    <th scope="row" className="px-4 py-2.5 text-left font-medium text-zinc-300">
                      {tag}
                    </th>
                    <td className="px-4 py-2.5 text-center">
                      {a.tags.includes(tag) ? (
                        <Check className="mx-auto h-4 w-4 text-emerald-400" aria-label="Yes" />
                      ) : (
                        <Minus className="mx-auto h-4 w-4 text-zinc-700" aria-label="No" />
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {b.tags.includes(tag) ? (
                        <Check className="mx-auto h-4 w-4 text-emerald-400" aria-label="Yes" />
                      ) : (
                        <Minus className="mx-auto h-4 w-4 text-zinc-700" aria-label="No" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-2xs text-zinc-500">
            Coverage is based on the capabilities we catalog for each tool. A missing mark means we
            do not track that capability for it, not necessarily that it is impossible.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold">Common questions</h2>
          <dl className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-2xl border border-white/10 bg-surface-1 p-5">
                <dt className="text-base font-bold text-zinc-100">{f.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-zinc-400">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-10 flex flex-wrap gap-3 border-t border-white/5 pt-6 text-sm">
          <Link href={`/alternatives/${a.slug}`} className="text-accent-400 underline hover:text-accent-300">
            More {a.name} alternatives
          </Link>
          <span className="text-zinc-700">·</span>
          <Link href={`/alternatives/${b.slug}`} className="text-accent-400 underline hover:text-accent-300">
            More {b.name} alternatives
          </Link>
          <span className="text-zinc-700">·</span>
          <Link href="/compare" className="text-accent-400 underline hover:text-accent-300">
            Build your own comparison
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
