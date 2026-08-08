import type { Metadata } from 'next';
import { SmartImage } from '@/components/SmartImage';
import { CoverArt } from '@/components/CoverArt';
import Link from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BLOG_POSTS } from '@/data/posts';
import { ALL_TOOLS, hasVerifiedScore, computeOverall } from '@/data/tools';
import { SITE_URL, SITE_NAME } from '@/config/site';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { localizeBlogPosts, localizeTools } from '@/lib/i18n/content';
import { Calendar, Clock, ArrowLeft, ExternalLink } from 'lucide-react';

type Params = Promise<{ slug: string; locale: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  const post = (await localizeBlogPosts(BLOG_POSTS, locale)).find((p) => p.slug === slug);
  if (!post) return { title: t('notFound') };
  const reviewed = post.editoriallyReviewed ?? true;
  return {
    title: post.title,
    description: post.excerpt,
    ...(!reviewed && { robots: { index: false, follow: true } }),
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.isoDate,
      url: `/blog/${post.slug}`,
      images: [{ url: `${SITE_URL}/og-optimized.png`, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [`${SITE_URL}/brand-cover.png`],
    },
  };
}

export default async function BlogPostDetail({ params }: { params: Params }) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'blog' });
  const tcommon = await getTranslations({ locale, namespace: 'common' });
  const post = (await localizeBlogPosts(BLOG_POSTS, locale)).find((p) => p.slug === slug);
  if (!post) notFound();

  const tool = (await localizeTools(ALL_TOOLS.filter((x) => x.slug === post.featuredToolSlug), locale))[0];
  const reviewed = post.editoriallyReviewed ?? true;

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: `${SITE_URL}/og-optimized.png`,
    datePublished: post.isoDate,
    dateModified: post.isoDate,
    author: { '@type': 'Organization', name: `${SITE_NAME} Editorial Team`, url: `${SITE_URL}/about` },
    publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.svg` } },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-surface-0 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <div>
        <Header />

        <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="mb-8 inline-flex items-center gap-2 text-xs font-bold text-zinc-400 transition-colors hover:text-accent-400"
          >
            <ArrowLeft className="h-4 w-4 rtl-flip" />
            <span>{t('backToBlog')}</span>
          </Link>

          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-bold text-accent-400">
            <span className="rounded-full border border-accent-500/30 bg-accent-500/15 px-3 py-1">{post.category}</span>
            <span className="flex items-center gap-1 text-zinc-500">
              <Calendar className="h-3.5 w-3.5" /> {post.date}
            </span>
            <span className="flex items-center gap-1 text-zinc-500">
              <Clock className="h-3.5 w-3.5" /> {post.readTime}
            </span>
          </div>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            {post.title}
          </h1>

          {!reviewed && (
            <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200">
              <strong>{t('aiDraftNoticeStrong')}</strong> {t('aiDraftNoticeBody')}
            </p>
          )}

          <div className="relative mt-8 h-72 w-full overflow-hidden rounded-3xl border border-white/10 sm:h-96">
            <CoverArt slug={post.slug} title={post.title} logo={tool?.logo} logoSize={64} className="absolute inset-0" />
          </div>

          {tool && (
            <div className="mt-10 flex flex-col items-center justify-between gap-6 rounded-3xl border border-accent-500/30 bg-gradient-to-r from-accent-500/10 via-surface-1 to-surface-2 p-6 shadow-2xl sm:flex-row">
              <div className="flex items-center gap-4">
                <SmartImage src={tool.logo} alt="" width={56} height={56} className="h-14 w-14 rounded-2xl border border-white/10 object-cover" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-accent-500/20 px-2.5 py-0.5 text-2xs font-bold text-accent-300">
                      {t('featuredToolBadge')}
                    </span>
                    {hasVerifiedScore(tool) && tool.scores ? (
                      <span className="text-2xs font-bold text-emerald-400">
                        ★ {computeOverall(tool.scores)}/10 ({t('verifiedTest')})
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-2xs font-bold text-amber-300">
                        {tool.verificationLevel === 'pricing-verified' ? t('pricingVerified') : t('listedTool')}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 text-base font-extrabold text-white">
                    {tool.name} — {tool.tagline}
                  </h3>
                  <Link href={`/tool/${tool.slug}`} className="text-2xs text-accent-400 underline hover:text-accent-300">
                    {hasVerifiedScore(tool)
                      ? t('readReview', { name: tool.name })
                      : t('viewSpecs', { name: tool.name })}
                  </Link>
                </div>
              </div>
              <a
                href={`/go/${tool.slug}`}
                target="_blank"
                rel="noopener noreferrer nofollow sponsored"
                className="flex shrink-0 items-center gap-2 rounded-2xl bg-accent-500 px-6 py-3.5 text-xs font-extrabold text-black shadow-lg transition-colors hover:bg-accent-400"
              >
                <span>{t('tryNow', { name: tool.name })}</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          {/* Rendered prose */}
          <div className="mt-10 space-y-6 leading-relaxed text-zinc-300 prose prose-invert max-w-none">
            {post.content.split('\n\n').map((paragraph, idx) => {
              if (paragraph.startsWith('### ')) {
                return <h4 key={idx} className="text-base font-bold text-white">{paragraph.replace('### ', '')}</h4>;
              }
              if (paragraph.startsWith('## ')) {
                return <h3 key={idx} className="pt-2 text-xl font-bold text-accent-400">{paragraph.replace('## ', '')}</h3>;
              }
              if (paragraph.startsWith('# ')) {
                return <h2 key={idx} className="pt-4 text-2xl font-extrabold text-white">{paragraph.replace('# ', '')}</h2>;
              }
              if (paragraph.startsWith('- ')) {
                return (
                  <ul key={idx} className="list-disc space-y-1 pl-5 text-sm sm:text-base">
                    {paragraph.split('\n').map((li, i) => <li key={i}>{li.replace(/^- /, '')}</li>)}
                  </ul>
                );
              }
              return <p key={idx} className="text-sm leading-relaxed sm:text-base">{paragraph}</p>;
            })}
          </div>

          <p className="mt-10 rounded-2xl border border-white/10 bg-zinc-900/50 p-5 text-2xs leading-relaxed text-zinc-500">
            <span className="font-bold text-zinc-400">{t('editorialNoteTitle')}:</span>{' '}
            {t('editorialNoteBody')}{' '}
            <Link href="/disclosure" className="underline hover:text-zinc-300">
              {t('fullDisclosure')}
            </Link>{' '}
            ·{' '}
            <Link href="/about" className="underline hover:text-zinc-300">
              {t('ourMethodology')}
            </Link>
          </p>
        </article>
      </div>

      <Footer />
    </div>
  );
}
