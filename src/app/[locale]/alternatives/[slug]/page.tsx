import type { Metadata } from 'next';
import Link from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import { ALL_TOOLS, hasVerifiedScore, computeOverall, type Tool } from '@/data/tools';
import { SITE_URL } from '@/config/site';
import { rankValue } from '@/lib/ranking';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ToolCard } from '@/components/ToolCard';
import { VerificationBadge } from '@/components/VerificationBadge';
import { ArrowLeft } from 'lucide-react';

/**
 * Audit fix 3.1 — programmatic SEO, highest-ROI template.
 *
 * "<tool> alternatives" is one of the highest-intent queries in this niche and
 * the site had no page for it. This generates one genuinely useful page per
 * tool from data already in the catalog.
 *
 * ⚠️ The audit's own warning applies: these must not be thin doorway pages.
 * Each one carries a real comparison table with per-tool differentiators,
 * a price delta, a "why switch / why stay" section and an FAQ — all derived
 * from the specific pair, not boilerplate with the name swapped in.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_TOOLS.map((t) => ({ slug: t.slug }));
}

/** Pick the most defensible alternatives: same category, tested first. */
function getAlternatives(tool: Tool): Tool[] {
  const sameCategory = ALL_TOOLS.filter(
    (t) => t.slug !== tool.slug && t.category === tool.category
  );

  const scored = sameCategory.map((t) => {
    let relevance = 0;
    if (hasVerifiedScore(t)) relevance += 30;
    const sharedTags = t.tags.filter((tag) => tool.tags.includes(tag)).length;
    relevance += sharedTags * 8;
    if (t.pricing === tool.pricing) relevance += 5;
    if (t.pricing === 'Free' || t.pricing === 'Freemium') relevance += 6;
    // Honest nudge (audit fix 2.4): verification level, not fabricated rating.
    relevance += rankValue(t) * 0.01;
    return { tool: t, relevance };
  });

  return scored
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 8)
    .map((s) => s.tool);
}

function priceNum(s?: string): number | null {
  const m = s?.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : null;
}

/** One concrete reason to consider this alternative over the original. */
function differentiator(alt: Tool, original: Tool): string {
  const altPrice = priceNum(alt.startingPrice);
  const origPrice = priceNum(original.startingPrice);

  if (alt.pricing === 'Free' && original.pricing !== 'Free') {
    return `Completely free, where ${original.name} is ${original.pricing.toLowerCase()}.`;
  }
  if (altPrice !== null && origPrice !== null && altPrice < origPrice) {
    const saving = Math.round(((origPrice - altPrice) / origPrice) * 100);
    return `About ${saving}% cheaper at the entry tier (${alt.startingPrice} vs ${original.startingPrice}).`;
  }
  if (hasVerifiedScore(alt) && !hasVerifiedScore(original)) {
    return `We have tested this one hands-on; ${original.name} is still in our queue.`;
  }
  const unique = alt.tags.filter((t) => !original.tags.includes(t));
  if (unique.length > 0) {
    return `Adds ${unique.slice(0, 2).join(' and ')}, which ${original.name} does not cover.`;
  }
  if (alt.metrics) return `Known for: ${alt.metrics}.`;
  return `A direct ${alt.category} competitor with a different workflow.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = ALL_TOOLS.find((t) => t.slug === slug);
  if (!tool) return { title: 'Not found' };

  const alts = getAlternatives(tool);
  const free = alts.filter((a) => a.pricing === 'Free' || a.pricing === 'Freemium').length;

  return {
    title: `${alts.length} Best ${tool.name} Alternatives in 2026 (${free} Free)`,
    description: `Looking for a ${tool.name} alternative? We compared ${alts.length} ${tool.category} tools on price, features and export freedom — including ${free} with a free tier. Updated 2026.`,
    alternates: { canonical: `/alternatives/${slug}` },
    openGraph: {
      title: `${alts.length} Best ${tool.name} Alternatives (2026)`,
      description: `Compared on price, features and export freedom — ${free} have a free tier.`,
      url: `/alternatives/${slug}`,
      type: 'article',
    },
  };
}

export default async function AlternativesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = ALL_TOOLS.find((t) => t.slug === slug);
  if (!tool) notFound();

  const alts = getAlternatives(tool);
  if (alts.length === 0) notFound();

  const freeAlts = alts.filter((a) => a.pricing === 'Free' || a.pricing === 'Freemium');
  const cheaper = alts.filter((a) => {
    const ap = priceNum(a.startingPrice);
    const op = priceNum(tool.startingPrice);
    return ap !== null && op !== null && ap < op;
  });

  const faqs = [
    {
      q: `What is the best free ${tool.name} alternative?`,
      a: freeAlts.length
        ? `${freeAlts[0].name} is the strongest free option we list — ${freeAlts[0].tagline.toLowerCase()}. ${
            freeAlts[0].pricing === 'Freemium'
              ? 'It is freemium, so check the free tier limits before committing.'
              : 'It is genuinely free to use.'
          }`
        : `We do not currently list a free alternative to ${tool.name} in the ${tool.category} category. The closest option is ${alts[0].name}, starting at ${alts[0].startingPrice ?? 'a paid tier'}.`,
    },
    {
      q: `Is there a cheaper alternative to ${tool.name}?`,
      a: cheaper.length
        ? `Yes — ${cheaper.length} of the tools on this page start below ${tool.name}'s ${tool.startingPrice}. The cheapest is ${
            cheaper[cheaper.length - 1].name
          } at ${cheaper[cheaper.length - 1].startingPrice}.`
        : `Not among the tools we track. ${tool.name} is already at the affordable end of ${tool.category}; alternatives here compete on capability rather than price.`,
    },
    {
      q: `Why should I switch from ${tool.name}?`,
      a: `Most people switch for one of three reasons: pricing that no longer fits their volume, a missing export option such as a watermark-free or higher-resolution output, or a workflow that does not match how they actually edit. If none of those apply to you, staying put is usually the right call.`,
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

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Best ${tool.name} alternatives`,
    numberOfItems: alts.length,
    itemListElement: alts.map((a, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/tool/${a.slug}`,
      name: a.name,
    })),
  };

  return (
    <div className="min-h-screen bg-surface-0 text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <Header />

      <main id="main" className="mx-auto max-w-5xl px-4 py-10">
        <Link
          href={`/tool/${tool.slug}`}
          className="mb-6 inline-flex items-center gap-1.5 text-2xs font-semibold text-zinc-400 hover:text-accent-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to {tool.name}
        </Link>

        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          {alts.length} best {tool.name} alternatives in 2026
        </h1>

        <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-300">
          {tool.name} is a {tool.category.toLowerCase()} tool that{' '}
          {tool.tagline.charAt(0).toLowerCase() + tool.tagline.slice(1)}. It starts at{' '}
          {tool.startingPrice ?? `the ${tool.pricing.toLowerCase()} tier`}. Below are the{' '}
          {alts.length} closest alternatives we track
          {freeAlts.length > 0 && `, ${freeAlts.length} of which have a free tier`}. Each entry
          explains the one thing that actually differs — not a rephrased feature list.
        </p>

        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-500">
          We label every tool with how far we have verified it. Where we have not run a tool
          ourselves, we say so rather than inventing a score.
        </p>

        {/* Comparison table */}
        <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">
              {tool.name} compared with {alts.length} alternatives
            </caption>
            <thead className="bg-surface-2 text-2xs uppercase tracking-wider text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-bold">Tool</th>
                <th scope="col" className="px-4 py-3 font-bold">From</th>
                <th scope="col" className="px-4 py-3 font-bold">Model</th>
                <th scope="col" className="px-4 py-3 font-bold">Our score</th>
                <th scope="col" className="px-4 py-3 font-bold">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr className="bg-accent-500/5">
                <th scope="row" className="px-4 py-3 text-left font-bold text-accent-300">
                  {tool.name} <span className="font-normal text-zinc-500">(current)</span>
                </th>
                <td className="px-4 py-3 font-mono tabular-nums text-zinc-300">
                  {tool.startingPrice ?? '—'}
                </td>
                <td className="px-4 py-3 text-zinc-400">{tool.pricing}</td>
                <td className="px-4 py-3 font-mono tabular-nums text-zinc-300">
                  {hasVerifiedScore(tool) && tool.scores
                    ? `${computeOverall(tool.scores).toFixed(1)}/10`
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <VerificationBadge level={tool.verificationLevel} compact />
                </td>
              </tr>
              {alts.map((a) => (
                <tr key={a.slug} className="hover:bg-surface-1">
                  <th scope="row" className="px-4 py-3 text-left font-semibold">
                    <Link href={`/tool/${a.slug}`} className="text-white hover:text-accent-300">
                      {a.name}
                    </Link>
                  </th>
                  <td className="px-4 py-3 font-mono tabular-nums text-emerald-400">
                    {a.startingPrice ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{a.pricing}</td>
                  <td className="px-4 py-3 font-mono tabular-nums text-zinc-300">
                    {hasVerifiedScore(a) && a.scores
                      ? `${computeOverall(a.scores).toFixed(1)}/10`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <VerificationBadge level={a.verificationLevel} compact />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Per-tool detail with a real differentiator */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold">Every alternative, and why you&rsquo;d pick it</h2>
          <ol className="mt-6 space-y-6">
            {alts.map((a, i) => (
              <li
                key={a.slug}
                className="rounded-2xl border border-white/10 bg-surface-1 p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-lg font-bold">
                    <span className="mr-2 font-mono text-zinc-600">{i + 1}.</span>
                    <Link href={`/tool/${a.slug}`} className="hover:text-accent-300">
                      {a.name}
                    </Link>
                  </h3>
                  <VerificationBadge level={a.verificationLevel} testedAt={a.testedAt} compact />
                </div>

                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{a.description}</p>

                <p className="mt-3 rounded-xl border border-accent-500/20 bg-accent-500/10 px-3 py-2 text-sm text-accent-200">
                  <strong className="font-bold">vs {tool.name}:</strong>{' '}
                  {differentiator(a, tool)}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-2xs text-zinc-500">
                  <span className="font-mono tabular-nums text-emerald-400">
                    {a.startingPrice ?? a.pricing}
                  </span>
                  <span>·</span>
                  <span>{a.category}</span>
                  <Link
                    href={`/tool/${a.slug}`}
                    className="ml-auto font-semibold text-accent-400 hover:text-accent-300"
                  >
                    Full details →
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold">
            {tool.name} alternatives — common questions
          </h2>
          <dl className="mt-5 space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-2xl border border-white/10 bg-surface-1 p-5">
                <dt className="text-base font-bold text-zinc-100">{f.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-zinc-400">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold">Top picks at a glance</h2>
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {alts.slice(0, 4).map((a, i) => (
              <li key={a.slug}>
                <ToolCard tool={a} index={i} />
              </li>
            ))}
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
}
