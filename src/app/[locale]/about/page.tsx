import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Link as LinkIcon, Mail } from 'lucide-react';
import { SITE_NAME, CONTACT_EMAIL } from '@/config/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: '/about' },
    openGraph: { title: t('title'), description: t('description'), url: '/about', type: 'website' },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'about' });

  return (
    <div className="min-h-screen bg-surface-0 text-foreground">
      <Header />
      <main id="main" className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl mb-6">{t('heading')}</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-lg text-zinc-300 leading-relaxed">
            We are video creators who got tired of paying for AI tools that promised magic 
            and delivered mediocrity. Every directory we trusted turned out to be a list of 
            affiliate links with invented 4.8-star ratings.
          </p>
          
          <p className="text-zinc-400">
            So we are building the directory we wished existed: one where benchmark claims require
            reproducible evidence. We do not currently publish editorial scores; when a test is released, its prompt, raw output, and rubric must be inspectable.
          </p>

          <h2 className="text-xl font-bold text-white mt-8 mb-4">Our principles</h2>
          <ul className="space-y-3 text-zinc-300">
            <li className="flex gap-3">
              <span className="text-accent-400 font-bold">1.</span>
              <span><strong>No score without evidence.</strong> A number is meaningless if you cannot inspect how it was produced.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-400 font-bold">2.</span>
              <span><strong>Every tool has flaws.</strong> We write cons for every single tool we test. If you cannot find a downside, we have not looked hard enough.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-400 font-bold">3.</span>
              <span><strong>Dead links die.</strong> We check every outbound link weekly. Tools that shut down are moved to our Graveyard, not left as 404s.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-400 font-bold">4.</span>
              <span><strong>Affiliate links are labeled.</strong> When we earn a commission, we say so. It never affects the score.</span>
            </li>
          </ul>

          <h2 className="text-xl font-bold text-white mt-8 mb-4">Contact</h2>
          <p className="text-zinc-400">
            Questions, corrections, or partnership inquiries:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-400 hover:underline inline-flex items-center gap-1">
              <Mail className="h-4 w-4" /> {CONTACT_EMAIL}
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
