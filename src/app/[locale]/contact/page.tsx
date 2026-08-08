import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Mail, Github, Send, Flag } from 'lucide-react';
import { CONTACT_EMAIL } from '@/config/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: '/contact' },
    openGraph: { title: t('title'), description: t('description'), url: '/contact', type: 'website' },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'contact' });

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <Header />
      <main id="main" className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="text-3xl font-black tracking-tight mb-2">{t('heading')}</h1>
        <p className="text-sm text-zinc-400 mb-10">We read everything. Typical response time: 1–2 business days.</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <a href={`mailto:${CONTACT_EMAIL}`} className="group rounded-2xl border border-white/10 bg-zinc-900/50 p-6 hover:border-accent-500/30 transition-colors">
            <Mail className="h-6 w-6 text-accent-400" />
            <h2 className="mt-3 text-sm font-bold group-hover:text-accent-300">General & Press</h2>
            <p className="mt-1 text-xs text-zinc-500">{CONTACT_EMAIL}</p>
          </a>
          <Link href="/submit" className="group rounded-2xl border border-white/10 bg-zinc-900/50 p-6 hover:border-accent-500/30 transition-colors">
            <Send className="h-6 w-6 text-emerald-400" />
            <h2 className="mt-3 text-sm font-bold group-hover:text-accent-300">Submit a Tool</h2>
            <p className="mt-1 text-xs text-zinc-500">Verified pricing & editorial review</p>
          </Link>
          <a href={`mailto:${CONTACT_EMAIL}?subject=Listing%20Correction`} className="group rounded-2xl border border-white/10 bg-zinc-900/50 p-6 hover:border-accent-500/30 transition-colors">
            <Flag className="h-6 w-6 text-amber-400" />
            <h2 className="mt-3 text-sm font-bold group-hover:text-accent-300">Report Incorrect Info</h2>
            <p className="mt-1 text-xs text-zinc-500">Stale pricing or dead links — fixed within 48h</p>
          </a>
          <a href="https://github.com/m-cyber12/DirectoryAI-Hub" target="_blank" rel="noopener noreferrer" className="group rounded-2xl border border-white/10 bg-zinc-900/50 p-6 hover:border-accent-500/30 transition-colors">
            <Github className="h-6 w-6 text-zinc-300" />
            <h2 className="mt-3 text-sm font-bold group-hover:text-accent-300">GitHub</h2>
            <p className="mt-1 text-xs text-zinc-500">m-cyber12/DirectoryAI-Hub</p>
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
