import type { Metadata } from 'next';
import { CoverArt } from '@/components/CoverArt';
import Link from '@/i18n/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BLOG_POSTS } from '@/data/posts';
import { localizeBlogPosts } from '@/lib/i18n/content';
import { BookOpen, Clock, Calendar } from 'lucide-react';

type LocaleParams = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: '/blog' },
  };
}

export default async function BlogPage({ params }: { params: LocaleParams }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'blog' });
  const posts = await localizeBlogPosts(BLOG_POSTS, locale);
  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <Header />
      <main id="main" className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-10 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-500/20 bg-accent-500/10 px-4 py-1.5 text-xs font-semibold text-accent-300">
            <BookOpen className="h-3.5 w-3.5" /> {t('badge')}
          </span>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">{t('heading')}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-400">{t('subtitle')}</p>
        </div>

        {/* Featured post */}
        <Link
          href={`/blog/${featured.slug}`}
          className="group mb-10 grid overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/40 transition-colors hover:border-accent-500/30 md:grid-cols-2"
        >
          <div className="relative h-56 overflow-hidden md:h-full">
            <CoverArt slug={featured.slug} title={featured.title} className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" />
          </div>
          <div className="flex flex-col justify-center p-6 md:p-10">
            <span className="text-2xs font-bold text-accent-400">{featured.category}</span>
            <h2 className="mt-2 text-xl font-black leading-snug transition-colors group-hover:text-accent-300 md:text-2xl">{featured.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{featured.excerpt}</p>
            <div className="mt-4 flex items-center gap-4 text-2xs text-zinc-500">
              <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {featured.date}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {featured.readTime}</span>
            </div>
          </div>
        </Link>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40 transition-colors hover:border-accent-500/30"
            >
              <div className="relative h-44 overflow-hidden">
                <CoverArt slug={post.slug} title={post.title} className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <span className="text-2xs font-bold text-accent-400">{post.category}</span>
                <h3 className="mt-1.5 text-base font-bold leading-snug transition-colors group-hover:text-accent-300 line-clamp-2">
                  {post.title}
                  {(post.editoriallyReviewed ?? true) === false && (
                    <span className="ml-2 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 align-middle text-2xs font-bold text-amber-300">
                      {t('draftBadge')}
                    </span>
                  )}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500 line-clamp-2">{post.excerpt}</p>
                <div className="mt-3 flex items-center gap-3 text-2xs text-zinc-600">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {post.date}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
